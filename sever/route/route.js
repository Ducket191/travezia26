const express = require('express');
const router = express.Router();
const InforModel = require('../model/infor');
const SeatDataBase = require('../model/seat');

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

router.post('/bookseat', async (req, res) => {
  try {
    const { seatName } = req.body; 

    if (!Array.isArray(seatName) || seatName.length === 0) {
      return res.status(400).json({ error: "No seats provided" });
    }

    const result = await SeatDataBase.updateMany(
      { Seat: { $in: seatName }, Status: "available" },
      { $set: { Status: "booked" } }
    );


    if (result.modifiedCount === seatName.length) {
      return res.status(200).json({ success: true, can: true }); 
    } else {
      return res.status(200).json({ success: false, can: false }); 
    }
  } catch (err) {
    console.error("Error booking seats:", err);
    res.status(500).json({ error: "Booking failed" });
  }
});


router.get('/availseat', async (req, res) => {
  try {
    const allSeats = await SeatDataBase.find(
      {},
      { Seat: 1, Status: 1, _id: 0 }
    );
    res.status(200).json(allSeats);
  } catch (err) {
    console.error('Error retrieving data:', err);
    res.status(500).json({ error: 'Failed to retrieve data' });
  }
});

router.post('/setback', async (req, res) => {
  try {
    const data = req.body;
    const result = await SeatDataBase.updateMany(
      {Seat: data.Name, Status: "booked"},
      { $set: { Status: "available" } }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
});

module.exports = router;
