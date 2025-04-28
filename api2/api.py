from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from facenet_pytorch import MTCNN, InceptionResnetV1
from PIL import Image
import numpy as np
import pickle
import os
from typing import List, Tuple
from pathlib import Path
import io
import logging
import torch
import random

# Setup logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = FastAPI(title="Criminal Faces Similarity API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize face detection and embedding models
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
mtcnn = MTCNN(image_size=160, margin=0, min_face_size=10, device=device)
resnet = InceptionResnetV1(pretrained='vggface2').eval().to(device)

# Path to embeddings file
EMBEDDINGS_PATH = "embeddings.pkl"
DATASET_PATH = "criminal_faces/"

# Store embeddings and IDs
embeddings_dict = {}

def load_embeddings():
    """Load precomputed embeddings from file."""
    global embeddings_dict
    if os.path.exists(EMBEDDINGS_PATH):
        try:
            with open(EMBEDDINGS_PATH, 'rb') as f:
                embeddings_dict = pickle.load(f)
            logger.info(f"Loaded {len(embeddings_dict)} embeddings from {EMBEDDINGS_PATH}")
        except Exception as e:
            logger.error(f"Error loading embeddings: {e}")
            embeddings_dict = {}
    else:
        logger.warning(f"No embeddings file found at {EMBEDDINGS_PATH}")

def save_embeddings():
    """Save embeddings to file."""
    try:
        with open(EMBEDDINGS_PATH, 'wb') as f:
            pickle.dump(embeddings_dict, f)
        logger.info(f"Saved {len(embeddings_dict)} embeddings to {EMBEDDINGS_PATH}")
    except Exception as e:
        logger.error(f"Error saving embeddings: {e}")

def preprocess_images():
    """Preprocess all images in the dataset and store embeddings."""
    global embeddings_dict
    if not os.path.exists(DATASET_PATH):
        logger.error(f"Dataset path {DATASET_PATH} does not exist")
        return

    embeddings_dict.clear()
    for filename in os.listdir(DATASET_PATH):
        if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
            image_id = Path(filename).stem
            image_path = os.path.join(DATASET_PATH, filename)
            try:
                embedding = get_image_embedding(image_path)
                if embedding is not None:
                    embeddings_dict[image_id] = embedding
                    logger.info(f"Processed {image_id}")
                else:
                    logger.warning(f"No face detected in {image_id}")
            except Exception as e:
                logger.error(f"Error processing {image_id}: {e}")

    save_embeddings()

def get_image_embedding(image_path: str = None, image_bytes: bytes = None) -> np.ndarray:
    """Generate embedding for an image from path or bytes."""
    try:
        if image_path:
            img = Image.open(image_path).convert('RGB')
        else:
            img = Image.open(io.BytesIO(image_bytes)).convert('RGB')

        # Detect face and align
        faces, _ = mtcnn(img, return_prob=True)
        if faces is None:
            return None

        # Generate embedding
        with torch.no_grad():
            embedding = resnet(faces.unsqueeze(0)).cpu().numpy().flatten()
        return embedding
    except Exception as e:
        logger.error(f"Error generating embedding: {e}")
        return None

def compute_similarity(embedding: np.ndarray) -> List[Tuple[str, float]]:
    """Compute cosine similarity between input embedding and stored embeddings."""
    similarities = []
    for image_id, stored_embedding in embeddings_dict.items():
        cosine_sim = np.dot(embedding, stored_embedding) / (np.linalg.norm(embedding) * np.linalg.norm(stored_embedding))
        similarities.append((image_id, float(cosine_sim)))
    
    # Sort by similarity (descending) and take top 5
    similarities.sort(key=lambda x: x[1], reverse=True)
    return similarities[:5]

def get_fallback_images() -> List[Tuple[str, float]]:
    """Return 5 random image IDs from embeddings_dict as a fallback."""
    if not embeddings_dict:
        logger.warning("No embeddings available for fallback")
        return []
    image_ids = list(embeddings_dict.keys())
    random.shuffle(image_ids)
    # Return top 5 IDs with a default similarity of 0.0
    return [(image_id, 0.0) for image_id in image_ids[:5]]

@app.on_event("startup")
async def startup_event():
    """Load embeddings or preprocess images on startup."""
    load_embeddings()
    if not embeddings_dict:
        logger.info("No embeddings found, preprocessing images...")
        preprocess_images()

@app.post("/find_similar/", response_model=List[List[str]])
async def find_similar(file: UploadFile = File(...)):
    """Upload an image and find the 5 most similar images."""
    logger.info(f"Received file: {file.filename}, content_type: {file.content_type}, size: {file.size}")
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")

    image_bytes = await file.read()
    logger.debug(f"Image bytes length: {len(image_bytes)}")
    embedding = get_image_embedding(image_bytes=image_bytes)
    
    if embedding is None:
        logger.warning("No face detected in uploaded image, returning fallback images")
        results = get_fallback_images()
    else:
        results = compute_similarity(embedding)

    formatted_results = [[id, f"{sim:.4f}"] for id, sim in results]
    logger.info(f"Returning {len(formatted_results)} similar images")
    return formatted_results

@app.get("/preprocess/")
async def preprocess_endpoint():
    """Trigger preprocessing of all images."""
    try:
        preprocess_images()
        return {"message": f"Preprocessed {len(embeddings_dict)} images"}
    except Exception as e:
        logger.error(f"Error during preprocessing: {e}")
        raise HTTPException(status_code=500, detail="Preprocessing failed")