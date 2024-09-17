const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors'); // Only need this once
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bookRoutes = require('./routes/bookRoutes');
const app = express();
const port =  process.env.PORT ||  5000;
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimiter = require('express-rate-limit');
require('dotenv').config();

app.set('trust proxy', 1);
app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  })
);
app.use(express.json());
app.use(helmet());
app.use(xss());
app.use(bodyParser.json({ limit: '10mb' })); // Increase limit as needed // Declare cors only once


const allowedOrigins = ['https://bookoub.onrender.com', 'https://dashboard-krez.onrender.com'];

app.use(cors({
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));


// app.use(cors({
//   origin: '*',
// }));

// Create a transporter object with Gmail service
let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

app.post('/send', async (req, res) => {
  const { first_name, last_name, email, subject, message } = req.body;

  let mailOptions = {
    from: `"${first_name} ${last_name}" <${process.env.EMAIL_USER}>`,
    to: 'bookoubstore@gmail.com',
    replyTo: email,
    subject: subject,
    text: `Message from ${first_name} ${last_name} (${email}):\n\n${message}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto;">
        <h2 style="background-color: #f4f4f4; padding: 10px; border-radius: 5px; text-align: center; color: #444;">
          CONTACT PAGE
        </h2>
        <div style="margin-bottom: 20px; padding: 10px; border-bottom: 1px solid #ddd;">
          <h3 style="color: #555; display: inline;">MESSAGE FROM: </h3>
          <span style="font-size: 16px; font-weight: bold;">${first_name} ${last_name}</span>
        </div>
        <div style="margin-bottom: 20px; padding: 10px; border-bottom: 1px solid #ddd;">
          <h3 style="color: #555; display: inline;">EMAIL: </h3>
          <span style="font-size: 16px; font-weight: bold; color: #0073e6;">${email}</span>
        </div>
        <div style="margin-bottom: 20px; padding: 10px; border-bottom: 1px solid #ddd;">
          <h3 style="color: #555;">MESSAGE</h3>
          <p style="font-size: 16px; line-height: 1.6; color: #444;">${message}</p>
        </div>
        <p style="font-size: 12px; color: #777; text-align: center;">This email was sent from the contact form on your website.</p>
      </div>
    `
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    res.status(200).send('Email sent successfully: ' + info.response);
  } catch (error) {
    res.status(500).send('Error sending email: ' + error.message);
  }
});

app.post('/api/send-email', async (req, res) => {
  const { cartItems, clientInfo, subtotal, shippingCost, total } = req.body;

  let itemsList = cartItems.map(item => 
    `<tr>
        <td style="padding: 10px; border: 1px solid #ddd;">${item.title}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${item.selectedLanguage}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${item.quantity}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${item.price} Da</td>
    </tr>`
  ).join('');

  let mailOptions = {
    from: `"${clientInfo.prenom} ${clientInfo.nom}" <${process.env.EMAIL_USER}>`,
    to: 'bookoubstore@gmail.com',
    subject: `Order from ${clientInfo.prenom} ${clientInfo.nom}`,
    text: `Order Details:\n\nClient Info:\nName: ${clientInfo.prenom} ${clientInfo.nom}\nPhone: ${clientInfo.phone}\nDelivery Method: ${clientInfo.deliveryMethod}\nWilaya: ${clientInfo.wilaya}\nCity: ${clientInfo.commune}\nAddress: ${clientInfo.adresse}\n\nCart Items:\n${cartItems.map(item => 
        `${item.title} (${item.selectedLanguage}): ${item.quantity} x ${item.price} Da = ${item.quantity * item.price} Da`
    ).join('\n')}\n\nSubtotal: ${subtotal} Da\nShipping Cost: ${shippingCost} Da\nTotal: ${total} Da`,
    html: `
    <div style="font-family: Arial, sans-serif; margin: 20px; border: 1px solid #ddd; border-radius: 8px; padding: 20px; background-color: #f9f9f9; max-width: 600px; margin: auto;">
      <div style="background-color: #4CAF50; color: white; padding: 10px 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0;">Cart Page</h1>
      </div>
      <div style="padding: 20px;">
        <h2 style="color: #333; margin-bottom: 20px; text-align: center; background-color: #e0e0e0; padding: 10px; border-radius: 5px;">Client Info</h2>
        <div style="background-color: #ffffff; padding: 10px; border-radius: 5px;">
          <p style="margin: 5px 0; font-size: 16px; color: #555;"><strong>Name:</strong> <span style="color: #333;">${clientInfo.prenom} ${clientInfo.nom}</span></p>
          <p style="margin: 5px 0; font-size: 16px; color: #555;"><strong>Phone:</strong> <span style="color: #333;">${clientInfo.phone}</span></p>
          <p style="margin: 5px 0; font-size: 16px; color: #555;"><strong>Delivery Method:</strong> <span style="color: #333;">${clientInfo.deliveryMethod}</span></p>
          <p style="margin: 5px 0; font-size: 16px; color: #555;"><strong>Wilaya:</strong> <span style="color: #333;">${clientInfo.wilaya}</span></p>
          <p style="margin: 5px 0; font-size: 16px; color: #555;"><strong>City:</strong> <span style="color: #333;">${clientInfo.commune}</span></p>
          <p style="margin: 5px 0; font-size: 16px; color: #555;"><strong>Address:</strong> <span style="color: #333;">${clientInfo.adresse}</span></p>
        </div>
        <h2 style="color: #333; margin-bottom: 20px; text-align: center; background-color: #e0e0e0; padding: 10px; border-radius: 5px;">Cart Items</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr>
              <th style="padding: 10px; background-color: #f4f4f4; border: 1px solid #ddd; text-align: left;">Title</th>
              <th style="padding: 10px; background-color: #f4f4f4; border: 1px solid #ddd; text-align: left;">Language</th>
              <th style="padding: 10px; background-color: #f4f4f4; border: 1px solid #ddd; text-align: left;">Quantity</th>
              <th style="padding: 10px; background-color: #f4f4f4; border: 1px solid #ddd; text-align: left;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsList}
          </tbody>
        </table>
        <p style="font-size: 16px; color: #555;"><strong>Subtotal:</strong> ${subtotal} Da</p>
        <p style="font-size: 16px; color: #555;"><strong>Shipping Cost:</strong> ${shippingCost} Da</p>
        <p style="font-size: 16px; color: #555;"><strong>Total:</strong> ${total} Da</p>
      </div>
      <div style="background-color: #f4f4f4; padding: 10px; text-align: center; border-radius: 0 0 8px 8px;">
        <p style="font-size: 12px; color: #777;">This is an automated email. Please do not reply.</p>
      </div>
    </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    res.status(200).send('Email sent successfully: ' + info.response);
  } catch (error) {
    res.status(500).send('Error sending email: ' + error.message);
  }
});

// Connect to MongoDB
mongoose.connect(process.env.MONDO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch(err => {
  console.error('MongoDB connection error:', err);
});

app.use('/api/books', bookRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
