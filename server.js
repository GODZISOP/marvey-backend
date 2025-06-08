import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import cors from 'cors';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
app.use(express.json());

// Allow CORS from your frontend origins
app.use(cors({
  origin: [
    'http://localhost:5173', // your dev frontend URL
    'https://marvey-new-clean-96n2.vercel.app' // your deployed frontend URL
  ],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Initialize Stripe with secret key, trimming whitespace/newlines
const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY environment variable is missing');
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2022-11-15',
});

// Basic health check route
app.get('/', (req, res) => {
  res.send('Server is running!!');
});

// Endpoint to create a PaymentIntent
app.post('/create-payment-intent', async (req, res) => {
  const { amount } = req.body;

  if (!amount || typeof amount !== 'number') {
    return res.status(400).json({ error: 'Amount must be a number' });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Setup Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER?.trim(), // Gmail account user
    pass: process.env.SMTP_PASS?.trim(), // Gmail app password
  },
  secure: true, // Use SSL
  tls: {
    rejectUnauthorized: false, // Useful for self-signed certificates (or some environments)
  },
  debug: true, // Enable debugging (logs detailed info)
});

// Email send route example
app.post('/send-email', async (req, res) => {
  const { to, subject, html } = req.body;

  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Missing to, subject, or html' });
  }

  try {
    await transporter.sendMail({
      from: 'appointmentstudio1@studio.com', // Custom "from" address
      to,
      subject,
      html,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
