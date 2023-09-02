import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';

import openaiRoutes from './routes/openai.routes.js';
import userRoutes from './user.routes.js'; // Import user routes using ES6 import syntax

dotenv.config();

const app = express();
const allowedOrigins = ['http://localhost:5173', 'https://kash1.onrender.com'];

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.includes(origin) || !origin) { // !origin allows requests from tools like Postman
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
};
app.use(cors(corsOptions));

app.use(express.json({ limit: "150mb" }))

app.use("/api/v1/openai", openaiRoutes);
app.use('/api/user', userRoutes); // Add user routes

app.get('/', (req, res) => {
  res.status(200).json({ message: "Hello from DALL.E" })
})

app.listen(8080, () => console.log('Server has started'))
