import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';

import dalleRoutes from './routes/dalle.routes.js';
import userRoutes from './user.routes.js'; // Import user routes using ES6 import syntax
import feedbackRoutes from './feedback.routes.js'; // Import feedback routes

dotenv.config();

const app = express();
const allowedOrigins = ['http://localhost:5173'];

app.use(cors());

// Attach express.json() middleware specifically to the routes that need it
app.use('/api/v1/dalle', express.json({ limit: "150mb" }), dalleRoutes);

// For the /api/user endpoint, don't apply the express.json() middleware globally
app.use('/api/user', userRoutes); // Add user routes

// Add feedback routes with express.json() middleware
app.use('/api/feedback', express.json(), feedbackRoutes);

app.get('/', (req, res) => {
  res.status(200).json({ message: "Hello from DALL.E" });
});

app.listen(8080, () => console.log('Server has started'));

