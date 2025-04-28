const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const HistoryItem = require('../models/HistoryItem');

router.get('/', auth, async (req, res) => {
    try {
        const history = await HistoryItem.find({ userId: req.user.id });
        res.json(history);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

router.post('/', auth, async (req, res) => {
    const { srcImages, results } = req.body;
    try {
        const historyItem = new HistoryItem({
            userId: req.user.id,
            itemId: Date.now().toString(),
            srcImages,
            results
        });
        await historyItem.save();
        res.json(historyItem);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

module.exports = router;