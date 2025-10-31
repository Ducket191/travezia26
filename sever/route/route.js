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

router.post('/bookseat', async (req,res) => {
  const seatName = req.body;
  try {
    const bookedSeat = await SeatModel.findOneAndUpdate(
      { Seat: seatName, Status: "available" },
      { $set: { Status: "booked"}},
      { new: true }
    );
    if (!bookedSeat) {
      return res.status(400).json({ message: "Seat already booked" });
    }
  } catch (err) {
    console.error("Error booking seat:", err);
    res.status(500).json({ error: "Booking failed" });
  }
})

router.get('/availseat', async (req, res) => {
  try {
    const availableSeats = await InforModel.find(
      { Status: "available" },
      { Seat: 1, _id: 0 }      
    );
    res.status(200).json(availableSeats); 
  } catch (err) {
    console.error('Error retrieving data:', err);
    res.status(500).json({ error: 'Failed to retrieve data' });
  }
});


module.exports = router;
