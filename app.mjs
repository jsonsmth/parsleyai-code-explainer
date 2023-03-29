import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';

const app = express();
app.use(bodyParser.json());
app.use(cors({
  origin: '*'
}));


const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/completions';

app.options('/api/interpret-code', cors());

app.post('/api/interpret-code', async (req, res) => {
  const codeSnippet = req.body.codeSnippet;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        'model': 'text-davinci-002',
        'prompt': `Explain the following code in plain English, adding technical details:\n\n${codeSnippet}\n\n`,
        'max_tokens': 2048,
        'temperature': 0.5,
        'top_p': 1
      })
    });

    const data = await response.json();
    const headers = response.headers.raw();

    const remainingRequests = headers['x-ratelimit-remaining-requests'];
    const limitRequests = headers['x-ratelimit-limit-requests'];
    const resetRequests = headers['x-ratelimit-reset-requests'];
    const remainingTokens = headers['x-ratelimit-remaining-tokens'];
    const limitTokens = headers['x-ratelimit-limit-tokens'];
    const resetTokens = headers['x-ratelimit-reset-tokens'];

    console.log(`Remaining Requests: ${remainingRequests}/${limitRequests}`);
    console.log(`Reset Requests in: ${resetRequests}`);
    console.log(`Remaining Tokens: ${remainingTokens}/${limitTokens}`);
    console.log(`Reset Tokens in: ${resetTokens}`);

    const explanation = data.choices && data.choices.length > 0 ? data.choices[0].text.trim() : null;
    const remainingRequestsMsg = `Remaining Requests: ${remainingRequests}/${limitRequests}`;
    const resetRequestsMsg = `Reset Requests in: ${resetRequests}`;
    const remainingTokensMsg = `Remaining Tokens: ${remainingTokens}/${limitTokens}`;
    const resetTokensMsg = `Reset Tokens in: ${resetTokens}`;

    const responseObj = {
      explanation,
      rateLimit: {
        remainingRequestsMsg,
        resetRequestsMsg,
        remainingTokensMsg,
        resetTokensMsg
      }
    };

    res.status(200).json(responseObj);

  } catch (error) {
    console.error('Error interpreting code snippet:', error);
    res.status(500).json({ error: 'Error interpreting code snippet' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
