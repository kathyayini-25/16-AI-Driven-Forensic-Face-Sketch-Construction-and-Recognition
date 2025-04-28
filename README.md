
# FaceTrace

FaceTrace is a Python-based project for advanced face recognition and tracing. It leverages machine learning models to detect and analyze faces in images or videos, suitable for applications like criminal detection, identity verification, or attendance tracking. The project is organized into three modules: `api`, `api2`, and `bnd`, each with specific functionalities and dependencies.

## Features
- Face detection and recognition using a custom model (`G_sketch_to_photo_best.pth`).
- Modular structure with separate APIs for image and video processing.
- Supports integration with external datasets (e.g., `criminal_faces`).

## Demo
Watch a video of FaceTrace in action: [Execution Demo](https://drive.google.com/file/d/1rexNACGenBhDd2ktu1j_Av_imk3ypX9K/view?usp=sharing)

## Prerequisites
- Python 3.8 or higher
- Git
- Virtual environment tool (e.g., `venv`)
- Access to cloud storage for model and dataset files

## Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone https://github.com/RohanCheera/FaceTrace.git
   cd FaceTrace
   ```

2. **Install Dependencies**
   Each module (`api`, `api2`, `bnd`) has its own dependencies. Install them in separate virtual environments:
   ```bash
   # For api
   cd api
   python -m venv venv
   .\venv\Scripts\activate   # On Windows
   pip install -r requirements.txt
   deactivate
   cd ..

   # For api2
   cd api2
   python -m venv venv
   .\venv\Scripts\activate
   pip install -r requirements.txt
   deactivate
   cd ..

   # For bnd
   cd bnd
   python -m venv venv
   .\venv\Scripts\activate
   pip install -r requirements.txt
   deactivate
   cd ..
   ```

3. **Download the Model**
   - The model file `G_sketch_to_photo_best.pth` (65.33 MB) is hosted externally.
   - Download it from: [Google Drive Link](https://colab.research.google.com/drive/1VMUtjNmf8jmfnsH5dujAN-nHWVJPw7tY?usp=sharing) (replace `<your-cloud-link>` with your actual model download link).
   - Place it into the `api/models/` directory:
     ```bash
     mkdir -p api/models
     mv path/to/G_sketch_to_photo_best.pth api/models/
     ```

4. **Access the Dataset**
   - The project uses the `criminal_faces` dataset. Download it from [Kaggle Dataset](https://www.kaggle.com/code/mehmetokuyar/criminal-dedection/data).
   - Place it in the appropriate directory (e.g., `data/criminal_faces/`) according to module usage.
   - *Note*: You may need a Kaggle account to access the dataset and must comply with Kaggle’s terms.

## Usage
- Each module (`api`, `api2`, `bnd`) contains scripts for specific tasks. Refer to the module’s README for detailed instructions.
- Example to run the face recognition script:
  ```bash
  cd api
  .\venv\Scripts\activate
  python main.py
  deactivate
  ```

## Project Structure
```
FaceTrace/
├── api/                  # Primary API for face recognition
│   ├── requirements.txt
│   ├── models/
│   └── ...
├── api2/                 # Secondary API for additional tasks
│   ├── requirements.txt
│   └── ...
├── bnd/                  # Backend or auxiliary module
│   ├── requirements.txt
│   └── ...
├── .gitignore
└── README.md
```

## Contributing
- Fork the repository and create a pull request with your changes.
- Ensure large files (>50 MB) are hosted externally and properly documented.
- Follow coding style guidelines and include tests where possible.

---
