import express from 'express';
import * as dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

router.route('/').get((req, res) => {
  res.status(200).json({ message: "Hello from DALL.E ROUTES" })
});

router.route('/').post(async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await openai.images.generate({
      prompt,
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json'
    });

    const image = response.data[0].b64_json;

    res.status(200).json({ photo: image });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" })
  }
});

router.post('/chatbot', async (req, res) => {
  try {
    const { message } = req.body;
    
    const response = await openai.completions.create({
      model: "text-davinci-003",
      prompt: message,
      max_tokens: 150
    });

    const chatbotResponse = response.choices[0].text.trim();

    res.status(200).json({ message: chatbotResponse });
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      console.error(error.status);  // e.g. 401
      console.error(error.message); // e.g. The authentication token you passed was invalid...
      console.error(error.code);    // e.g. 'invalid_api_key'
      console.error(error.type);    // e.g. 'invalid_request_error'
      res.status(error.status).json({ message: error.message });
    } else {
      // Non-API error
      console.log(error);
      res.status(500).json({ message: "Something went wrong" });
    }
  }
});

export default router;





