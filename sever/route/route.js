const express = require('express');
const router = express.Router();
const InforModel = require('../model/infor'); 

// Define the POST route for creating a new vocabulary item
router.post('/infor/add', async (req, res) => {
    try {
        const newInfor = new InforModel({
            Name: req.body.Name,
            Email: req.body.Email,
            Phone: req.body.Phone,
            Ticket: req.body.Ticket,
            Seat: req.body.Seat
        });

        const savedInfor = await newInfor.save();
        res.status(200).json(savedInfor);
    } catch (err) {
        console.error("Error saving the vocab item:", err);
        res.status(500).json({ error: "Failed to save the vocab item" });
    }
});
router.get('/infor', async (req, res) => {
    try {
        const inforItems = await InforModel.find();
        res.status(200).json(inforItems);
    } catch (err) {
        console.error("Error retrieving vocab items:", err);
        res.status(500).json({ error: "Failed to retrieve vocab items" });
    }
});

router.delete('/infor/:id', async (req, res) => {
    try {
        const deletedInfor = await InforModel.findByIdAndDelete(req.params.id);
        if (deletedInfor) {
            res.status(200).json({ message: 'Vocabulary item deleted successfully' });
        } else {
            res.status(404).json({ error: 'Vocabulary item not found' });
        }
    } catch (err) {
        console.error("Error deleting the vocab item:", err);
        res.status(500).json({ error: "Failed to delete the vocab item" });
    }
});

module.exports = router;