const express = require('express');
const PayOS = require('@payos/node');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.static('public'));
app.use(express.json());

const payos = new PayOS(
  process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY
);

const PORT = process.env.PORT || 3000;
const YOUR_DOMAIN = `http://localhost:3000`;

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
        const { amount, orderCode, email, name, phonenumber } = req.body;

        if (!amount || !orderCode) {
            return res.status(400).json({ error: 'Amount and orderCode are required' });
        }

      const description = 
        `Thanh toán vé\n` +
        `Họ và tên: ${name || 'N/A'}\n` +
        `Email: ${email || 'N/A'}\n` +
        `Số điện thoại: ${phonenumber || 'N/A'}`;

      const order = {
        amount,
        description,
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

// PayOS webhook handler - verifies payment & sends email
app.post('/payos-webhook', async (req, res) => {
  try {
    const paymentData = payos.verifyPaymentWebhookData(req.body);
    if (!paymentData) {
      console.warn('Invalid webhook signature');
      return res.sendStatus(400);
    }

    const { code, desc, orderCode } = paymentData.data;

    if (code !== '00') {
      console.warn(`Payment failed: ${desc}`);
      return res.sendStatus(200); // Respond 200 so PayOS won't retry repeatedly
    }

    const orderInfo = pendingOrders.get(orderCode);
    if (!orderInfo) {
      console.error('Order info not found for:', orderCode);
      return res.sendStatus(200);
    }

    await sendConfirmationEmail(orderInfo);
    console.log('Confirmation email sent to', orderInfo.email);

    pendingOrders.delete(orderCode); // Clean up

    return res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    return res.sendStatus(200);
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
            to: `dangminhduc1912008@gmail.com`,
            subject: 'Mail check thông tin người truy cập web',
            text: `Xin chào !,

Đã có người truy cập web
Thông tin của họ
- Họ và tên: ${name}
- Email: ${email}
- Số điện thoại: ${phonenumber}
- Số lượng vé: ${ticketCount}

Nếu khách đã thanh toán thì gửi mail xác nhận mua vé`
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
