import http from "http";
import mongoose from "mongoose";
import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import authRouter from "./routes/auth.js";
import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';
import path from 'path';
import UploadRoute from './routes/upload.route.js';
import Person from './models/person.model.js';
const PORT=8000
dotenv.config();
const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: "50mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(express.json());


// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/history', require('./routes/history'));
// app.use('/api/images', require('./routes/images'));

app.use("/auth", authRouter);
app.use("/image",UploadRoute);

const uri=process.env.MONGODB_URI  ;




mongoose.connect(uri,{dbName:"rohan"})
    .then(()=> console.log("Mongodb connected"))
    .catch((err)=> console.log(err));

app.listen(8000,()=> console.log(`Server is running on port ${PORT}`));




cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "ddho8twg3",
    api_key: process.env.CLOUDINARY_API_KEY || "116998563459467",
    api_secret: process.env.CLOUDINARY_API_SECRET || "yFNikWe-a3DPJvIpJPC1nYNNoEU"
});


const folderPath = './criminal_faces';
const uploadedUrlsFile = 'uploaded_image_urls.json';



async function uploadImages() {
    const imageFiles = fs.readdirSync(folderPath);
    let uploadedUrls = new Set();

    if (fs.existsSync(uploadedUrlsFile)) {
        const existingData = fs.readFileSync(uploadedUrlsFile);
        uploadedUrls = new Set(JSON.parse(existingData));  
    }

    let newImageURLs = [];

    for (const file of imageFiles) {
        const filePath = path.join(folderPath, file);

        try {
            if (uploadedUrls.has(file)) {
                console.log(` Skipping ${file}, already uploaded.`);
                continue;
            }

            const result = await cloudinary.uploader.upload(filePath, {
                folder: 'faiss_dataset',
                use_filename: true,
                unique_filename: false
            });

            console.log(`Uploaded: ${file} -> ${result.secure_url}`);
            newImageURLs.push(result.secure_url);
            uploadedUrls.add(file);

            console.log(newImageURLs);
        } catch (error) {
            console.error(` Failed to upload ${file}:`, error);
        }
    }

    fs.writeFileSync(uploadedUrlsFile, JSON.stringify([...uploadedUrls], null, 2));
    console.log("All new image URLs saved to uploaded_image_urls.json");
}
async function fetchAllImageUrls() {
    let imageData = [];
    let nextCursor = null;

    try {

        do {
            const result = await cloudinary.api.resources({
                type: 'upload',
                prefix: 'faiss_dataset/',
                max_results: 500, 
                next_cursor: nextCursor
            });

            const images = result.resources.map(image => ({
                url:image.secure_url,
                filename:image.public_id.split('/').pop()
            }));

            imageData=imageData.concat(images);

            nextCursor = result.next_cursor;
        } while (nextCursor);

        fs.writeFileSync('uploaded_image_urls.json', JSON.stringify(imageData, null, 2));

        return imageUrls;
    } catch (error) {
        console.error(" Error fetching image URLs:", error);
    }
}




