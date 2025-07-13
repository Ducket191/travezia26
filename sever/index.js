const express = require('express');
const PayOS = require('@payos/node');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
app.use('/payos-webhook', bodyParser.raw({ type: '*/*' }));
app.use(cors());
app.use(express.static('public'));
app.use(express.json());

const payos = new PayOS(
  process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY
);

const PORT = process.env.PORT || 3000;
const YOUR_DOMAIN = `https://trave26.onrender.com`;

// In-memory store for orders pending payment confirmation
const pendingOrders = new Map();

// Email sending function reused in routes & webhook
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

app.post('/create-payment-link', async (req, res) => {
    try {
        const { amount, orderCode, phonenumber } = req.body;

        if (!amount || !orderCode) {
            return res.status(400).json({ error: 'Amount and orderCode are required' });
        }


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

app.post('/payos-webhook', async (req, res) => {
  try {
    const rawBody = req.body.toString('utf8');  // Convert buffer to string
    const parsedBody = JSON.parse(rawBody);     // Parse it to JSON

    const paymentData = payos.verifyPaymentWebhookData(parsedBody); // ✅ Now it's correct

    if (!paymentData || !paymentData.data) {
      console.warn('❌ Invalid webhook or no data');
      return res.sendStatus(400);
    }

    const { code, desc, orderCode } = paymentData.data;

    if (code !== '00') {
      console.warn(`❌ Payment failed: ${desc}`);
      return res.sendStatus(200);
    }

    const orderInfo = pendingOrders.get(orderCode);
    if (!orderInfo) {
      console.error('❌ Order info not found for:', orderCode);
      return res.sendStatus(200);
    }

    await sendConfirmationEmail(orderInfo);
    console.log('✅ Confirmation email sent to:', orderInfo.email);

    pendingOrders.delete(orderCode); // Clean up
    return res.sendStatus(200);
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return res.sendStatus(200); // still return 200 to stop retries
  }
});



//send email func
app.post('/send-email', async (req, res) => {
    const { email, name, phonenumber, ticketCount } = req.body;

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            tls: {
                rejectUnauthorized: false,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Xác nhận đăng ký vé Travezia!',
            text: `Xin chào ${name}!,

Cảm ơn bạn đã đăng kí vé tham dự Travézia XXIII: Retro Spins!
Thông tin của bạn:
- Họ và tên: ${name}
- Email: ${email}
- Số điện thoại: ${phonenumber}
- Số lượng vé: ${ticketCount}

Trân trọng,
Glee Ams`
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: '✅ Email sent successfully!' });
    } catch (error) {
        console.error('❌ Error sending email:', error);
        res.status(500).json({ message: 'Failed to send email', error });
    }
});


//send email func
app.post('/send-alertemail', async (req, res) => {
    const { email, name, phonenumber, ticketCount } = req.body;

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            tls: {
                rejectUnauthorized: false,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: `dangminhduc1912008@gmail.com`,
            subject: 'Xác nhận đăng ký vé Traveziab',
            text: `Có lượt truy cập web!,

Thông tin khách chưa thanh toán:
- Họ và tên: ${name}
- Email: ${email}
- Số điện thoại: ${phonenumber}
- Số lượng vé: ${ticketCount}

`
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: '✅ Email sent successfully!' });
    } catch (error) {
        console.error('❌ Error sending email:', error);
        res.status(500).json({ message: 'Failed to send email', error });
    }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
