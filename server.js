import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config(); // Load .env file

const app = express();
app.use(express.json());

// Enable CORS for all routes
app.use(cors({
  origin: [
    'http://localhost:5173', // for local development
    'https://marvey-new-clean-96n2.vercel.app' // your deployed frontend
  ],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));


// Basic GET route to check server status
app.get('/', (req, res) => {
  res.send('Server is up and running!');
});

// Nodemailer transport configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.VITE_SMTP_USER,  // Use env variable for Gmail username
    pass: process.env.VITE_SMTP_PASS,  // Use env variable for Gmail password
  },
  tls: {
    rejectUnauthorized: false,  // Disable certificate validation
  },
  secure: true,  // Ensure secure connection
});

// Send email endpoint
app.post('/send-email', async (req, res) => {
  const { to, subject, html } = req.body;

  try {
    await transporter.sendMail({
      from: process.env.VITE_CONTACT_EMAIL,  // Use sender email from environment variable
      to,
      subject,
      html,
    });
    res.status(200).send({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).send({ success: false, error: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
