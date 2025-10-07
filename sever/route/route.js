const express = require('express');
const router = express.Router();
const InforModel = require('../model/infor');

router.post('/infor/add', async (req, res) => {
  try {
    const { Name, Email, Phone, Ticket, Seat } = req.body;

    if (!Name || !Email || !Phone || !Ticket || !Seat) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const newInfor = new InforModel({ Name, Email, Phone, Ticket, Seat });
    const savedInfor = await newInfor.save();
    res.status(201).json(savedInfor);
  } catch (err) {
    console.error('Error saving data:', err);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

router.get('/infor', async (req, res) => {
  try {
    const inforItems = await InforModel.find();
    res.status(200).json(inforItems);
  } catch (err) {
    console.error('Error retrieving data:', err);
    res.status(500).json({ error: 'Failed to retrieve data' });
  }
});

router.delete('/infor/:id', async (req, res) => {
  try {
    const deleted = await InforModel.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (err) {
    console.error('Error deleting data:', err);
    res.status(500).json({ error: 'Failed to delete data' });
  }
});

module.exports = router;
