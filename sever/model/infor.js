const mongoose = require('mongoose');

const TicketInfoSchema = new mongoose.Schema({
    Name: String,
    Phone: String,
    Email: String,
    Ticket: Number,
});

module.exports = mongoose.model("Infor", TicketInfoSchema, "infors");

module.exports = TicketInforModel;