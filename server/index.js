import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';

import dalleRoutes from './routes/dalle.routes.js';
import userRoutes from './user.routes.js'; // Import user routes using ES6 import syntax

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "150mb" }))

app.use("/api/v1/dalle", dalleRoutes);
app.use('/api/user', userRoutes); // Add user routes

app.get('/', (req, res) => {
  res.status(200).json({ message: "Hello from DALL.E" })
})

app.listen(8080, () => console.log('Server has started'))
