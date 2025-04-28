

# FaceTrace
FaceTrace is an advanced, modular, machine learning-based **Face Recognition and Tracing System**.  
It provides APIs for facial detection, recognition, and criminal matching, along with a secure user authentication system.

---

# ✨ Project Highlights

- **Deep Learning Face Recognition:** Custom model for sketch-to-photo matching.
- **MongoDB Integration:** Criminal database and secure user authentication.
- **Multi-Module Architecture:** `api`, `api2`, and `bnd` folders with distinct purposes.
- **Secure Authentication:** Passwords hashed using bcrypt.
- **Cloud Storage Integration:** Model files and datasets hosted externally (Cloudinary, Google Drive).
- **Portable Design:** Ready for integration with Web Apps, Desktop apps, Surveillance systems.

---
# 🎥 Execution Video

Watch the complete working demo of **FaceTrace** here:  
[Watch the video](https://drive.google.com/file/d/1rexNACGenBhDd2ktu1j_Av_imk3ypX9K/view?usp=sharing)


---

# 🚀 System Requirements

| Item | Version/Notes |
|:----|:--------------|
| Operating System | Windows 10/11, Linux (Ubuntu), MacOS |
| Python | 3.8 or higher |
| MongoDB | 5.0+ (Atlas or Local) |
| Git | Latest |
| NodeJS | Optional (for advanced backend work) |
| Virtualenv | For isolated Python environments |
| Cloud Storage Account | (Google Drive, Cloudinary) |
| Kaggle Account | (To download criminal face datasets) |

---

# 🛠️ Installation

## 1. Clone Repository
```bash
git clone https://github.com/RohanCheera/FaceTrace.git
cd FaceTrace
```

## 2. Setting up Virtual Environments

We use **separate environments for each module** to avoid dependency conflicts.

```bash
# For api
cd api
python -m venv venv
source venv/bin/activate  # (Mac/Linux)
# .\venv\Scripts\activate  # (Windows)
pip install -r requirements.txt
deactivate
cd ..

# For api2
cd api2
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..

# For bnd
cd bnd
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..
```

---

# 📦 Required Python Libraries

Common across modules:
- `torch`
- `torchvision`
- `opencv-python`
- `flask`
- `pymongo`
- `bcrypt`
- `pillow`
- `faiss-cpu`
- `scikit-learn`
- `fastapi`
- `uvicorn`
- `python-dotenv`
- `requests`
- `pydantic`
- `flask-cors`

Each module (`api`, `api2`, `bnd`) has its own `requirements.txt`. **Always install per module.**

---

# 🧠 Machine Learning Model

## Model:
- **G_sketch_to_photo_best.pth**
- Size: ~65 MB
- Purpose: Sketch-to-photo matching and enhanced face recognition.

## Download:
- [Download Model](https://colab.research.google.com/drive/1VMUtjNmf8jmfnsH5dujAN-nHWVJPw7tY?usp=sharing)

## Placement:
```bash
mkdir -p api/models
mv path/to/G_sketch_to_photo_best.pth api/models/
```

---

# 🗂️ Database Setup (MongoDB)

FaceTrace uses **MongoDB** to store:
- **Criminal Records (Details Collection)**
- **User Authentication (Users Collection)**

You can set it up either:
- Locally
- Or with **MongoDB Atlas** (Cloud database)

### Example Data Structures:

---

## 1. Details Collection (`details`)

```json
{
  "_id": {"$oid": "67e3bf12e2a11a6a494e8025"},
  "id": "A60478",
  "mittimus": "14CR0652901",
  "class": "X",
  "count": 1,
  "offense": "MFG/DEL 15<100 GR HEROIN/ANLG",
  "custody_date": "03/18/2014",
  "sentence": "6 Years 0 Months 0 Days",
  "county": "COOK",
  "sentence_discharged": "NO",
  "mark": "TATTOO, ARM, LEFT - HEART,PIE, CARMEN",
  "url": "https://res.cloudinary.com/ddho8twg3/image/upload/v1742929093/faiss_dataset/A60478.jpg"
}
```

> **Note**:  
> - `url` points to criminal face image (Cloudinary hosted).
> - `offense`, `custody_date`, `sentence` are available for report generation.

---

## 2. Users Collection (`users`)

```json
{
  "_id": {"$oid": "67e18c8e9811bd043e5cc3f7"},
  "userId": "1742834829900",
  "username": "1234",
  "email": "jeevan",
  "password": "$2b$10$RctuNM5OyL2nlyRcl1cjrupje7kTOPfAQ4Fu7PKfIanuODZ1ReNbq",
  "__v": 0
}
```

- **Password is hashed** using **bcrypt** (10 salt rounds).
- **userId** is a timestamp-based unique ID.

---

# 🔒 Authentication Flow

### Signup:
- User provides `username`, `email`, `password`.
- Password is hashed using **bcrypt** before saving to MongoDB.

### Login:
- User provides `email` and `password`.
- Password is verified against bcrypt-hashed password in DB.

---

# 🔥 API Usage (Simple Examples)

---

## API Module (`api/`)

**Main File:** `main.py`

- Load model
- Accept image input
- Return prediction (match vs criminal database)

```bash
cd api
source venv/bin/activate
python main.py
```

---

## Example API Endpoints

| Route | Method | Description |
|:------|:-------|:------------|
| `/predict-image` | POST | Upload an image, detect face, match against criminal faces |
| `/register` | POST | Register a user |
| `/login` | POST | Login for registered users |
| `/upload-criminal` | POST | Add new criminal record (image + metadata) |

---

# 📷 Face Matching Logic

1. Input Image (Uploaded via POST)
2. Face Detection using OpenCV or MTCNN
3. Features extracted (using deep neural networks)
4. Similarity check using **FAISS** (Facebook AI Similarity Search)
5. If match confidence > threshold, retrieve criminal details

---

# 🖼 Dataset Usage

**Dataset:** [Kaggle: Criminal Detection Faces](https://www.kaggle.com/code/mehmetokuyar/criminal-dedection/data)

- Consists of mugshots and offense details
- Placed in `/data/criminal_faces/` folder

---

# 🧩 Project Folder Structure

```
FaceTrace/
├── api/                  # Primary API (Image Processing + Recognition)
│   ├── models/
│   ├── main.py
│   ├── utils/
│   └── requirements.txt
│
├── api2/                 # Additional Utilities (Alternate Flows)
│   ├── alternate.py
│   └── requirements.txt
│
├── bnd/                  # Backend APIs (Authentication + DB CRUD)
│   ├── app.py
│   └── requirements.txt
│
├── data/                 # Criminal Face Dataset
│   ├── criminal_faces/
│
├── README.md
├── .gitignore
└── LICENSE
```

---

# ⚙️ Security Considerations

- **Passwords are NEVER stored in plain text**.
- **Environment Variables** are used for secrets (`MONGO_URI`, etc).
- **Rate Limiting** and **JWT authentication** (Future version planned).
- **Cloudinary** links are protected via randomized URLs.

---

# 🛣️ Roadmap

| Stage | Feature |
|:------|:--------|
| ✅ | Sketch-to-Photo Model Integration |
| ✅ | MongoDB Authentication |
| ✅ | FAISS Similarity Search |
| 🔜 | JWT Token-based Authentication |
| 🔜 | Admin Dashboard (Web Frontend) |
| 🔜 | Automated Model retraining via new criminal uploads |
| 🔜 | Edge device deployment (Raspberry Pi compatibility) |

---

# 👨‍💻 Contributing

Contributions are welcome! 🚀

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Create a Pull Request

---

# 📜 License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).

---

# 📞 Contact

**Developer:** Rohan Cheera  
**Email:** rohancheera@example.com  
**GitHub:** [RohanCheera](https://github.com/RohanCheera)

**Developer:** Pasunuri Kathyayini      
**LinkedIn:** [Pasunuri Kathyayini](https://www.linkedin.com/in/kathyayini-p-741980227/)          
**GitHub:** [kathyayini-25](https://github.com/kathyayini-25)         

---

# 🙏 Thanks for reading
Thank you for taking the time to read this documentation!
Hope this helps you build or understand the project better.
For any improvements, suggestions, or issues, feel free to contribute or open an issue on GitHub!

---

# 🏁 End of Documentation

---


