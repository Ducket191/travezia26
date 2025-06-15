const express = require('express');
const PayOS = require('@payos/node');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config(); // Load environment variables

const payos = new PayOS(
    process.env.PAYOS_CLIENT_ID, 
    process.env.PAYOS_API_KEY, 
    process.env.PAYOS_CHECKSUM_KEY
);


const app = express();
app.use(cors());
app.use(express.static('public'));
app.use(express.json());

app.use('/', InforRoutes);

const YOUR_DOMAIN = 'http://localhost:3000';

// Create payment link
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

// Send email function
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

app.post('/payos-webhook', async (req, res) => {
    try {
        console.log('📩 Received webhook:', req.body);

        const webhookData = payos.verifyPaymentWebhookData(req.body); // Verify signature
        if (!webhookData) {
            return res.status(400).json({ message: '❌ Invalid webhook signature' });
        }

        const { orderCode, code, desc, amount } = webhookData.data;

        if (!orderCode || !code) {
            return res.status(400).json({ message: '❌ Missing order data.' });
        }

        if (code === '00') { // ✅ Payment successful
            console.log(`✅ Payment successful for order: ${orderCode} (Amount: ${amount} VND)`);

            // Extract extraData if available
            const { name, phone, email, ticketCount } = req.body.extraData
                ? JSON.parse(req.body.extraData)
                : {};

            if (!name || !phone || !email || !ticketCount) {
                console.warn('⚠️ Missing extraData. Cannot save user or send email.');
                return res.status(400).json({ message: '❌ Missing extraData.' });
            }

            // 1️⃣ Add user to MongoDB
            try {
                const addUserResponse = await fetch('https://glee-ams.onrender.com/Infor/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, phone, email, ticketCount }),
                });

                if (!addUserResponse.ok) {
                    throw new Error(`Failed to add user to DB: ${addUserResponse.statusText}`);
                }
                console.log(`📌 User added to database: ${name} - ${email}`);
            } catch (err) {
                console.error('❌ Error adding user to DB:', err);
            }

            // 2️⃣ Send confirmation email
            try {
                const emailResponse = await fetch('https://glee-ams.onrender.com/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, name, phonenumber: phone, ticketCount }),
                });

                if (!emailResponse.ok) {
                    throw new Error(`Failed to send email: ${emailResponse.statusText}`);
                }
                console.log(`📧 Email sent to ${email}`);
            } catch (err) {
                console.error('❌ Error sending confirmation email:', err);
            }

            return res.status(200).json({ message: '✅ Payment verified, email sent, and user added to DB.' });
        } else {
            console.warn(`❌ Payment failed for order ${orderCode}: ${desc}`);
            return res.status(400).json({ message: `❌ Payment failed: ${desc}` });
        }
    } catch (error) {
        console.error('❌ Webhook error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});



// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
