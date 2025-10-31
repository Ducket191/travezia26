const mongoose = require('mongoose');

const SeatSchema = new mongoose.Schema({
    Seat: String,
    Status: String,
});

module.exports = mongoose.model("seat", SeatSchema, "seats");
