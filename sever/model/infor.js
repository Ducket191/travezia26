const mongoose = require('mongoose');

const TicketInfoSchema = new mongoose.Schema({
    Name: String,
    Phone: String,
    Email: String,
    Ticket: Number,
    Seat: [String], 
});

module.exports = mongoose.model("Infor", TicketInfoSchema, "infors");
