const express = require('express');
const PayOS = require('@payos/node');
const cors = require('cors');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const YOUR_DOMAIN = `https://trave26.onrender.com`;

// ✅ Raw body needed for PayOS signature verification
app.use('/payos-webhook', bodyParser.raw({ type: '*/*' }));

// ✅ Other middleware
app.use(cors());
app.use(express.static('public'));
app.use(express.json());

// ✅ PayOS config
const payos = new PayOS(
  process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY
);

// ✅ In-memory storage of orders awaiting webhook
const pendingOrders = new Map();

// ✅ Reusable email function
async function sendConfirmationEmail({ email, name, phonenumber, ticketCount }) {
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
    to: email,
    subject: 'Xác nhận đăng ký vé Travezia',
    text: `Xin chào ${name},

Cảm ơn bạn đã đăng kí vé tham dự Travézia XXIII: Retro Spins!
Thông tin của bạn:
- Họ và tên: ${name}
- Email: ${email}
- Số điện thoại: ${phonenumber}
- Số lượng vé: ${ticketCount}

Trân trọng,
Glee Ams,`
  };

  await transporter.sendMail(mailOptions);
}

// ✅ Create payment link and cache order
app.post('/create-payment-link', async (req, res) => {
  try {
    const { amount, orderCode, email, name, phonenumber, ticketCount } = req.body;

    if (!amount || !orderCode || !email || !name || !phonenumber || !ticketCount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Store customer info by orderCode
    pendingOrders.set(orderCode, { email, name, phonenumber, ticketCount });

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
    console.error('❌ Payment link error:', error);
    res.status(500).json({ error: 'Failed to create payment link' });
  }
});

app.post('/payos-webhook', bodyParser.raw({ type: '*/*' }), async (req, res) => {
  try {
    if (!req.body || !Buffer.isBuffer(req.body)) {
      console.warn('❌ No raw body received');
      return res.sendStatus(400);
    }

    const rawBody = req.body.toString('utf8');
    const parsedBody = JSON.parse(rawBody);

    const paymentData = payos.verifyPaymentWebhookData(parsedBody);

    if (!paymentData || !paymentData.data) {
      console.warn('❌ Invalid webhook or no data');
      return res.sendStatus(400);
    }

    const { code, desc, orderCode } = paymentData.data;

    if (code !== '00') {
      console.warn(`❌ Payment failed: ${desc}`);
      return res.sendStatus(200); // prevent retries
    }

    const orderInfo = pendingOrders.get(orderCode);
    if (!orderInfo) {
      console.error('❌ Order info not found for:', orderCode);
      return res.sendStatus(200);
    }

    await sendConfirmationEmail(orderInfo);
    console.log('✅ Email sent to', orderInfo.email);

    pendingOrders.delete(orderCode);
    return res.sendStatus(200);
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return res.sendStatus(200);
  }
});


// ✅ Manual email test
app.post('/send-email', async (req, res) => {
  const { email, name, phonenumber, ticketCount } = req.body;
  try {
    await sendConfirmationEmail({ email, name, phonenumber, ticketCount });
    res.status(200).json({ message: '✅ Email sent successfully!' });
  } catch (error) {
    console.error('❌ Error sending email:', error);
    res.status(500).json({ message: 'Failed to send email', error });
  }
});

// ✅ Alert internal team for new lead
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
    res.status(200).json({ message: '✅ Alert email sent!' });
  } catch (error) {
    console.error('❌ Error sending alert email:', error);
    res.status(500).json({ message: 'Failed to send alert email', error });
  }
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
