require('dotenv').config();
const axios = require('axios')
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const app = express();
const API_KEY = process.env.RETELL_API_KEY

const PORT = process.env.PORT || 8080;

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Parse allowed domains from environment variable
const allowedDomains = process.env.ALLOWED_DOMAINS
  ? process.env.ALLOWED_DOMAINS.split(',').map(domain => domain.trim())
  : ['localhost:3000'];

// Basic Helmet setup with CSP and frame ancestors
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", "https://api.retellai.com"],
        frameSrc: ["'self'", ...allowedDomains],
        frameAncestors: ["'self'", ...allowedDomains.map(domain => `https://${domain}`)],
        imgSrc: ["'self'", "data:", "blob:"],
        mediaSrc: ["'self'", "https://api.retellai.com"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Needed for audio streaming
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS configuration
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedDomains.some(domain => origin.includes(domain))) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Parse JSON bodies
app.use(express.json());

app.post('/create-web-call', async (req, res) => {
    const { agent_id, metadata, retell_llm_dynamic_variables } = req.body;

    // Prepare the payload for the API request
    const payload = { agent_id };

    // Conditionally add optional fields if they are provided
    if (metadata) {
        payload.metadata = metadata;
    }

    if (retell_llm_dynamic_variables) {
        payload.retell_llm_dynamic_variables = retell_llm_dynamic_variables;
    }

    try {
        const response = await axios.post(
            'https://api.retellai.com/v2/create-web-call',
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        res.status(201).json(response.data);
    } catch (error) {
        console.error('Error creating web call:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to create web call' });
    }
});

// Optional domain check endpoint
app.get('/check-domain', (req, res) => {
    const origin = req.get('origin');
    res.json({
        allowed: !origin || allowedDomains.some(domain => origin.includes(domain)),
        origin: origin || 'No origin provided'
    });
});

// Example for Express.js
app.get('/', (req, res) => {
  res.status(200).send('Server is healthy');
});

// Alternatively, use a specific health check path
app.get('/health', (req, res) => {
  res.status(200).send('Server is healthy');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
