import torch
import torch.nn as nn
import cv2
import numpy as np
from PIL import Image
from torchvision import transforms
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import io
import base64
from pathlib import Path
import logging
import os

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(title="Sketch to Photo Converter")

# Add CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Self-Attention Module
class SelfAttention(nn.Module):
    def __init__(self, in_channels):
        super(SelfAttention, self).__init__()
        self.query = nn.Conv2d(in_channels, in_channels // 8, 1)
        self.key = nn.Conv2d(in_channels, in_channels // 8, 1)
        self.value = nn.Conv2d(in_channels, in_channels, 1)
        self.gamma = nn.Parameter(torch.zeros(1))

    def forward(self, x):
        batch, channels, height, width = x.size()
        proj_query = self.query(x).view(batch, -1, height * width).permute(0, 2, 1)
        proj_key = self.key(x).view(batch, -1, height * width)
        energy = torch.bmm(proj_query, proj_key)
        attention = torch.softmax(energy, dim=-1)
        proj_value = self.value(x).view(batch, -1, height * width)
        out = torch.bmm(proj_value, attention.permute(0, 2, 1))
        out = out.view(batch, channels, height, width)
        out = self.gamma * out + x
        return out

# Generator class (matches trained model)
class Generator(nn.Module):
    def __init__(self, in_channels, out_channels):
        super(Generator, self).__init__()
        self.enc1 = nn.Sequential(
            nn.Conv2d(in_channels, 64, 4, stride=2, padding=1),
            nn.LeakyReLU(0.2)
        )  # 256x256 -> 128x128
        self.enc2 = nn.Sequential(
            nn.Conv2d(64, 128, 4, stride=2, padding=1),
            nn.BatchNorm2d(128),
            nn.LeakyReLU(0.2)
        )  # 128x128 -> 64x64
        self.enc3 = nn.Sequential(
            nn.Conv2d(128, 256, 4, stride=2, padding=1),
            nn.BatchNorm2d(256),
            nn.LeakyReLU(0.2)
        )  # 64x64 -> 32x32
        self.enc4 = nn.Sequential(
            nn.Conv2d(256, 512, 4, stride=2, padding=1),
            nn.BatchNorm2d(512),
            nn.LeakyReLU(0.2)
        )  # 32x32 -> 16x16
        self.enc5 = nn.Sequential(
            nn.Conv2d(512, 512, 4, stride=2, padding=1),
            nn.BatchNorm2d(512),
            nn.LeakyReLU(0.2)
        )  # 16x16 -> 8x8
        self.attention = SelfAttention(512)
        self.dec1 = nn.Sequential(
            nn.ConvTranspose2d(512, 512, 4, stride=2, padding=1),
            nn.BatchNorm2d(512),
            nn.ReLU(),
            nn.Dropout(0.3)
        )  # 8x8 -> 16x16
        self.dec2 = nn.Sequential(
            nn.ConvTranspose2d(1024, 256, 4, stride=2, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(),
            nn.Dropout(0.3)
        )  # 16x16 -> 32x32
        self.dec3 = nn.Sequential(
            nn.ConvTranspose2d(512, 128, 4, stride=2, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(),
            nn.Dropout(0.3)
        )  # 32x32 -> 64x64
        self.dec4 = nn.Sequential(
            nn.ConvTranspose2d(256, 64, 4, stride=2, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.Dropout(0.3)
        )  # 64x64 -> 128x128
        self.dec5 = nn.Sequential(
            nn.ConvTranspose2d(128, 64, 4, stride=2, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.Dropout(0.3)
        )  # 128x128 -> 256x256
        self.dec6 = nn.Sequential(
            nn.Conv2d(64, out_channels, 3, stride=1, padding=1),
            nn.Tanh()
        )  # 256x256 -> 256x256

    def forward(self, x):
        e1 = self.enc1(x)
        e2 = self.enc2(e1)
        e3 = self.enc3(e2)
        e4 = self.enc4(e3)
        e5 = self.enc5(e4)
        e5 = self.attention(e5)
        d1 = self.dec1(e5)
        d2 = self.dec2(torch.cat([d1, e4], dim=1))
        d3 = self.dec3(torch.cat([d2, e3], dim=1))
        d4 = self.dec4(torch.cat([d3, e2], dim=1))
        d5 = self.dec5(torch.cat([d4, e1], dim=1))
        d6 = self.dec6(d5)
        return d6

# Initialize the model globally
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = None
# Model path relative to main.py
model_path = os.path.join(os.path.dirname(__file__), 'models', 'G_sketch_to_photo_best.pth')
logger.info("Model path: %s", model_path)

def load_model():
    global model
    try:
        # Check if model file exists
        if not Path(model_path).exists():
            raise FileNotFoundError(f"Model weights file not found at {model_path}")

        # Initialize model
        model = Generator(in_channels=1, out_channels=3).to(device)
        
        # Load state dictionary
        state_dict = torch.load(model_path, map_location=device)
        model.load_state_dict(state_dict)
        model.eval()

        # Print state dictionary keys and shapes
        logger.info("Loaded state dictionary keys:")
        for key in state_dict.keys():
            logger.info("  %s: %s", key, list(state_dict[key].shape))

        # Print weight statistics for key layers
        logger.info("Weight statistics for key layers:")
        sample_keys = ['enc1.0.weight', 'attention.query.weight', 'dec6.0.weight']
        for key in sample_keys:
            if key in state_dict:
                weights = state_dict[key]
                logger.info("  %s: shape=%s, mean=%s, std=%s",
                            key, list(weights.shape), weights.mean().item(), weights.std().item())

        # Test inference with dummy input
        logger.info("Testing model with dummy input...")
        dummy_input = torch.randn(1, 1, 256, 256).to(device)
        with torch.no_grad():
            output = model(dummy_input)
        logger.info("Dummy inference output shape: %s", list(output.shape))
        if output.shape != (1, 3, 256, 256):
            raise ValueError(f"Unexpected output shape: {output.shape}, expected (1, 3, 256, 256)")

        logger.info("Model weights loaded and verified successfully from %s", model_path)
    except Exception as e:
        logger.error("Error loading model weights: %s", str(e))
        raise RuntimeError(f"Failed to load model weights from {model_path}")

# Load model at startup
load_model()

# Define transformation for input sketch
transform = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.ToTensor(),
    transforms.Normalize((0.5,), (0.5,))
])

@app.post("/image/upload")
async def upload_image(digitalImage: UploadFile = File(...)):
    try:
        # Validate file existence and type
        if not digitalImage:
            raise HTTPException(status_code=422, detail="No file provided")
        if not digitalImage.content_type.startswith('image/'):
            raise HTTPException(status_code=422, detail=f"Invalid file type: {digitalImage.content_type}. Only image files are allowed")

        # Read the uploaded image
        contents = await digitalImage.read()
        if not contents:
            raise HTTPException(status_code=422, detail="Empty file uploaded")

        # Decode image
        nparr = np.frombuffer(contents, np.uint8)
        sketch = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
        if sketch is None:
            raise HTTPException(status_code=422, detail="Could not decode image. Ensure it's a valid grayscale image")

        # Preprocess the sketch
        sketch_pil = Image.fromarray(sketch)
        sketch_tensor = transform(sketch_pil).unsqueeze(0).to(device)

        # Generate the photo
        with torch.no_grad():
            generated_photo = model(sketch_tensor)

        # Denormalize the generated image
        generated_photo = generated_photo * 0.5 + 0.5
        generated_photo_np = generated_photo.cpu().squeeze().permute(1, 2, 0).numpy()
        generated_photo_uint8 = (generated_photo_np * 255).astype(np.uint8)

        # Encode the image to base64
        _, buffer = cv2.imencode('.png', cv2.cvtColor(generated_photo_uint8, cv2.COLOR_RGB2BGR))
        image_base64 = base64.b64encode(buffer).decode('utf-8')
        image_data_url = f"data:image/png;base64,{image_base64}"

        logger.info("Successfully processed image: %s", digitalImage.filename)
        return JSONResponse(content={
            "result": {
                "generatedImage": image_data_url
            }
        })
    except HTTPException as e:
        logger.error("HTTP error: %s", str(e))
        raise e
    except Exception as e:
        logger.error("Server error: %s", str(e))
        raise HTTPException(status_code=500, detail=f"Photo generation failed: {str(e)}")
    finally:
        await digitalImage.close()

# Test block for running as a normal script
if __name__ == "__main__":
    import uvicorn
    test_image_path = "test_sketch.jpg"
    try:
        sketch = cv2.imread(test_image_path, cv2.IMREAD_GRAYSCALE)
        if sketch is None:
            logger.error("Could not load test image: %s", test_image_path)
        else:
            sketch_pil = Image.fromarray(sketch)
            sketch_tensor = transform(sketch_pil).unsqueeze(0).to(device)
            with torch.no_grad():
                generated_photo = model(sketch_tensor)
            generated_photo = generated_photo * 0.5 + 0.5
            generated_photo_np = generated_photo.cpu().squeeze().permute(1, 2, 0).numpy()
            generated_photo_uint8 = (generated_photo_np * 255).astype(np.uint8)
            output_path = "test_output.png"
            cv2.imwrite(output_path, cv2.cvtColor(generated_photo_uint8, cv2.COLOR_RGB2BGR))
            logger.info("Test image processed and saved as %s", output_path)
    except Exception as e:
        logger.error("Test failed: %s", str(e))
    
    # Run FastAPI server
    uvicorn.run(app, host="0.0.0.0", port=5003)