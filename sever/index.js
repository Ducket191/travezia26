// index.js
const express = require('express');
const PayOS = require('@payos/node');
const cors = require('cors');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
require('dotenv').config();
const mongoose = require('mongoose');
const route = require('./route/route');
const InforModel = require('./model/infor'); 
const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const app = express();
const PORT = process.env.PORT || 3000;
const YOUR_DOMAIN = `https://trave26.onrender.com`;

//  Middleware
app.use(cors());
app.use(express.static('public'));
app.use(express.json());
app.use('/', route);


const payos = new PayOS(
  process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY
);

//  In-memory storage
const pendingOrders = new Map();

app.post('/payos-webhook', bodyParser.raw({ type: '*/*' }), async (req, res) => {
  try {
    let parsedBody;

    if (Buffer.isBuffer(req.body)) {
      parsedBody = JSON.parse(req.body.toString('utf8'));
    } else if (typeof req.body === 'object') {
      parsedBody = req.body;
    } else {
      console.warn('Unexpected body format:', typeof req.body);
      return res.sendStatus(400);
    }

    console.log('Parsed JSON body:', parsedBody);
    console.log('Headers:', req.headers);

    let paymentData;
    try {
      paymentData = payos.verifyPaymentWebhookData(parsedBody);
      console.log('Verified paymentData:', paymentData);
    } catch (verifyErr) {
      console.error('Error during webhook verification:', verifyErr);
      return res.sendStatus(400);
    }

    if (!paymentData || !paymentData.orderCode) {
      console.warn('Invalid webhook or no data');
      return res.sendStatus(400);
    }

    const { code, desc, orderCode } = paymentData;

    if (code !== '00') {
      console.warn(`Payment failed: ${desc}`);
      return res.sendStatus(200);
    }

    const orderInfo = pendingOrders.get(Number(orderCode));
    if (!orderInfo) {
      console.error('Order info not found for:', orderCode);
      console.log('Current pendingOrders keys:', [...pendingOrders.keys()]);
      return res.sendStatus(200);
    }

   const newInfor = new InforModel({
      Name: orderInfo.name,
      Email: orderInfo.email,
      Phone: orderInfo.phonenumber,
      Ticket: orderInfo.ticketCount,
      Seat: orderInfo.seat,
    });

    await newInfor.save();
    console.log('Info saved to database:', newInfor);

    await sendConfirmationEmail(orderInfo);
    console.log('Email sent to', orderInfo.email);

    pendingOrders.delete(Number(orderCode));
    return res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    return res.sendStatus(200);
  }
});


async function sendConfirmationEmail({ email, name, phonenumber, ticketCount, seat }) {
  const msg = {
    to: email,
    from: process.env.SENDGRID_VERIFIED_SENDER, 
    subject: "Xác nhận đăng ký vé Travezia",
    text: `Xin chào ${name},

Cảm ơn bạn đã đăng kí vé tham dự Travézia XXIII: Retro Spins!
Thông tin của bạn:
- Họ và tên: ${name}
- Email: ${email}
- Số điện thoại: ${phonenumber}
- Số lượng vé: ${ticketCount}
- Chỗ ngồi: ${seat}

Trân trọng,
Glee Ams,`,
  };

  await sgMail.send(msg);
}


//  Payment link
app.post('/create-payment-link', async (req, res) => {
  try {
    const { amount, orderCode, email, name, phonenumber, ticketCount, seat } = req.body;

    if (!amount || !orderCode || !email || !name || !phonenumber || !ticketCount || !seat) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    pendingOrders.set(Number(orderCode), { email, name, phonenumber, ticketCount, seat });

    const order = {
      amount,
      description: `${phonenumber}`,
      orderCode,
      returnUrl: `${YOUR_DOMAIN}/success.html`,
      cancelUrl: `${YOUR_DOMAIN}/cancel.html`
    };

    const paymentLink = await payos.createPaymentLink(order);
    res.json({ url: paymentLink.checkoutUrl });
  } catch (error) {
    console.error('Payment link error:', error);
    res.status(500).json({ error: 'Failed to create payment link' });
  }
});


app.post('/send-email', async (req, res) => {
  const { email, name, phonenumber, ticketCount, selectedSeats } = req.body;
  try {
    await sendConfirmationEmail({ email, name, phonenumber, ticketCount, selectedSeats });
    res.status(200).json({ message: 'Email sent successfully!' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Failed to send email', error });
  }
});


app.post('/send-alertemail', async (req, res) => {
  const { email, name, phonenumber, ticketCount } = req.body;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: { rejectUnauthorized: false },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'dangminhduc1912008@gmail.com',
    subject: 'Xác nhận đăng ký vé Travezia (Chưa thanh toán)',
    text: `Có lượt truy cập web!

Thông tin khách chưa thanh toán:
- Họ và tên: ${name}
- Email: ${email}
- Số điện thoại: ${phonenumber}
- Số lượng vé: ${ticketCount}`
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Alert email sent!' });
  } catch (error) {
    console.error('Error sending alert email:', error);
    res.status(500).json({ message: 'Failed to send alert email', error });
  }
});

//  Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

mongoose.connect(process.env.DB_CONNECT)
.then(() => console.log('Database is connected'))
.catch((err) => console.error('Failed to connect to MongoDB', err));