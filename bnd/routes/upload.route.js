import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import cors from 'cors';
import Details from '../models/Details.js';

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

// Enable CORS for React app
router.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST'],
  credentials: true
}));

// Existing /upload route
router.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  const imagePath = path.resolve(req.file.path);
  console.log(`Uploading image: ${imagePath}`);

  try {
    // Create FormData for FastAPI request
    const formData = new FormData();
    formData.append('file', fs.createReadStream(imagePath), req.file.filename);

    // Send image to FastAPI /find_similar/
    const fastApiResponse = await axios.post('http://localhost:5004/find_similar/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    // Clean up uploaded file
    fs.unlink(imagePath, (err) => {
      if (err) console.error(`Error deleting file ${imagePath}:`, err);
      else console.log(`Successfully deleted file: ${imagePath}`);
    });

    const matches = fastApiResponse.data;
    console.log('FastAPI response:', matches);

    if (!Array.isArray(matches) || matches.length === 0) {
      throw new Error('No matches returned from FastAPI');
    }

    // Extract image IDs
    const top5Ids = matches.map(([id, similarity]) => id);

    // Query MongoDB for details (offense, mittimus)
    const details = await Details.find({ id: { $in: top5Ids } });

    // Combine FastAPI results with MongoDB details
    const result = matches.map(([id, similarity]) => {
      const detail = details.find((d) => d.id === id);
      return {
        id,
        similarity: parseFloat(similarity),
        offense: detail?.offense || 'N/A',
        mittimus: detail?.mittimus || 'N/A'
      };
    });

    console.log('Processed result:', result);
    res.status(200).json({ result });
  } catch (error) {
    console.error('Error processing recognition:', error.message);
    console.error('FastAPI response:', error.response?.data || 'N/A');

    // Clean up uploaded file on error
    fs.unlink(imagePath, (err) => {
      if (err) console.error(`Error deleting file ${imagePath}:`, err);
    });

    res.status(500).json({
      error: 'Failed to process recognition',
      details: error.response?.data?.detail || error.message
    });
  }
});

router.post('/fetch-details', async (req, res) => {
  try {
    const imageIds = req.body;
    console.log(imageIds);
    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return res.status(400).json({ error: 'No image IDs provided' });
    }

    const details = await Details.find({ id: { $in: imageIds } });

    const result = imageIds.map((id) => {
      const detail = details.find((d) => d.id === id);
      return {
        id,
        offense: detail?.offense || 'N/A',
        mittimus: detail?.mittimus || 'N/A',
        class: detail?.class || 'N/A',
        count: detail?.count || 'N/A',
        custody_date: detail?.custody_date || 'N/A',
        sentence: detail?.sentence || 'N/A',
        county: detail?.county || 'N/A',
        sentence_discharged: detail?.sentence_discharged || 'N/A',
        mark: detail?.mark || 'N/A',
        url: detail?.url || 'N/A',
      };
    });

    res.status(200).json({ result });
  } catch (error) {
    console.error('Error fetching details:', error.message);
    res.status(500).json({ error: 'Failed to fetch details', details: error.message });
  }
});

export default router;