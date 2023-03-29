import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import cors from 'cors';
import validator from 'validator';

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(cors({
  origin: '*'
}));

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    const errorMessage = 'Invalid input. Please provide a valid code snippet.';

    const responseObj = {
      explanation: errorMessage,
      rateLimit: {}
    };

    res.status(400).json(responseObj);
  } else {
    next(err);
  }
});

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/completions';

app.options('/api/interpret-code', cors());

app.post('/api/interpret-code', async (req, res) => {

  if (!req.body || !req.body.hasOwnProperty("codeSnippet")) {
    const errorMessage = 'Invalid input. Please provide a valid code snippet.';
    return res.status(200).json({
      explanation: errorMessage,
      rateLimit: {},
    });
  }

  let codeSnippet = req.body.codeSnippet;
  codeSnippet = validator.escape(codeSnippet);

  if (!validator.isLength(codeSnippet, { min: 1 })) {
    const errorMessage = 'Invalid input. Please provide a valid code snippet.';
    res.status(200).json({
      explanation: errorMessage,
      rateLimit: {}
    });
    return;
  }

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

    if (!response.ok) {
      const errorMessage = 'Error in OpenAI API Call. Please try again.';
      res.status(200).json({
        explanation: errorMessage,
        rateLimit: {}
      });
      return;
    }

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
