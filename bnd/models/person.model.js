
import mongoose from "mongoose";
import fs from "fs";


const PersonSchema = mongoose.Schema({
    filename:String,
    url:String
})

const Person=mongoose.model("Person",PersonSchema) || mongoose.models(Person);


const UploadData=async()=>{
    const data = fs.readFileSync('uploaded_image_urls.json','utf-8');
    try {
        const imageData = JSON.parse(data);
        await Person.insertMany(imageData);
        console.log("JSON file inserted in database");
    } catch (error) {
        console.log(error);
    }
}

// UploadData();

export default Person;
