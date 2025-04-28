import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.layers import Lambda
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def l2_normalize(x):
    return tf.nn.l2_normalize(x, axis=1)

try:
    logger.info("Loading model...")
    model = load_model(
        'face_recognition_model.keras',
        custom_objects={'l2_normalize': Lambda(l2_normalize)},
        compile=False,
        safe_mode=False
    )
    logger.info("Model loaded successfully")
    model.summary()
except Exception as e:
    logger.error(f"Error loading model: {str(e)}")