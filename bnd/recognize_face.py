import sys
import json
import os
import numpy as np
import faiss
import pickle
from deepface import DeepFace
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load FAISS index and IDs
try:
    logger.info("Loading FAISS index and embeddings...")
    index = faiss.read_index('faiss_index.bin')
    with open('embeddings.pickle', 'rb') as f:
        data = pickle.load(f)
        ids = data['ids']
    if index.ntotal != len(ids):
        raise ValueError(f"FAISS index size ({index.ntotal}) does not match ids length ({len(ids)})")
    logger.info("FAISS index and embeddings loaded successfully")
except Exception as e:
    logger.error(f"Error loading FAISS index or embeddings: {str(e)}")
    sys.exit(1)

def get_query_embedding(image_path):
    try:
        valid_extensions = ['.jpg', '.jpeg', '.png']
        if not any(image_path.lower().endswith(ext) for ext in valid_extensions):
            raise ValueError(f"Unsupported file format for {image_path}. Use JPG or PNG.")
        embedding_list = DeepFace.represent(
            img_path=image_path,
            model_name='ArcFace',
            enforce_detection=False
        )
        if not embedding_list or not isinstance(embedding_list, list) or not embedding_list[0].get('embedding'):
            raise ValueError("No valid embedding generated")
        embedding = np.array(embedding_list[0]['embedding'], dtype='float32')
        # Normalize embedding for cosine similarity
        embedding = embedding / np.linalg.norm(embedding)
        return embedding.reshape(1, -1)
    except Exception as e:
        logger.error(f"Error generating embedding for {image_path}: {str(e)}")
        return None

def recognize_face(query_embedding):
    try:
        if query_embedding is None or query_embedding.shape != (1, index.d):
            raise ValueError("Invalid query embedding shape")
        distances, indices = index.search(query_embedding, 5)
        matches = [
            [ids[i], 1 / (1 + float(dist))]  # Maintain compatibility with router.js
            for i, dist in zip(indices[0], distances[0])
            if i < len(ids)
        ]
        matches = sorted(matches, key=lambda x: x[1], reverse=True)
        return matches
    except Exception as e:
        logger.error(f"Error searching FAISS index: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        logger.error("Expected one image path as argument")
        sys.exit(1)

    image_path = sys.argv[1]
    if not os.path.isfile(image_path):
        logger.error(f"Image file {image_path} does not exist")
        sys.exit(1)

    query_embedding = get_query_embedding(image_path)
    if query_embedding is None:
        print(json.dumps([]))
        sys.exit(0)

    matches = recognize_face(query_embedding)
    print(json.dumps(matches))