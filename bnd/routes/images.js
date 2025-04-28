const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const GeneratedImage = require('../models/GeneratedImage');
// Assuming vectorDB is a module for vector database operations
const vectorDB = require('../../vector-db/similarity');

router.get('/generated', auth, async (req, res) => {
    try {
        const images = await GeneratedImage.find({ userId: req.user.id }).sort({ datetime: -1 });
        res.json(images);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

router.post('/upload-vector', auth, async (req, res) => {
    const { images } = req.body; // Array of { filename, embedding }
    try {
        await vectorDB.storeImages(images);
        res.json({ msg: 'Images stored in vector DB' });
    } catch (err) {
        res.status(500).send('Server error');
    }
});

router.get('/similarity-search', auth, async (req, res) => {
    const { queryEmbedding } = req.query;
    try {
        const similarImages = await vectorDB.findSimilar(queryEmbedding);
        res.json(similarImages);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

module.exports = router;