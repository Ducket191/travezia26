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
const YOUR_DOMAIN = `https://trave26.onrender.com`;

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
        res.status(200).json({ message: '✅ Email sent successfully!' });
    } catch (error) {
        console.error('❌ Error sending email:', error);
        res.status(500).json({ message: 'Failed to send email', error });
    }
});

// ✅ Payment link
app.post('/create-payment-link', async (req, res) => {
    try {
        const { amount, orderCode } = req.body;

        if (!amount || !orderCode) {
            return res.status(400).json({ error: 'Amount and orderCode are required' });
        }

        const order = {
            amount,
            description: 'Thanh toán vé',
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
    // 5.1 Xác thực chữ ký
    const paymentData = payos.verifyPaymentWebhookData(req.body); // :contentReference[oaicite:1]{index=1}
    const { code, desc, orderCode } = paymentData.data;

    if (code !== '00') {
      console.warn(`Payment thất bại: ${desc}`);
      return res.sendStatus(200);          // vẫn trả 200 để PayOS khỏi retry
    }

    // 5.2 Tra ngược info khách theo orderCode
    const orderInfo = pendingOrders.get(orderCode);
    if (!orderInfo) {
      console.error('Không tìm thấy đơn hàng local', orderCode);
      return res.sendStatus(200);
    }

    // 5.3 Gửi mail
    await sendConfirmationEmail(orderInfo);
    console.log('Đã gửi mail cho', orderInfo.email);

    // 5.4 Hoàn tất
    pendingOrders.delete(orderCode);        // dọn cache tạm
    return res.sendStatus(200);
  } catch (err) {
    console.error('Webhook error:', err);
    // trả về 200 để PayOS đừng retry liên tục; log lại để xử lý thủ công
    return res.sendStatus(200);
  }
});

// ✅ Run server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
