const mongoose = require('mongoose');

const TicketInfoSchema = new mongoose.Schema({
    Name: String,
    Phone: String,
    Email: String,
    Ticket: Number,
});

const TicketInforModel = mongoose.model('', TicketInfoSchema);

module.exports = TicketInforModel;