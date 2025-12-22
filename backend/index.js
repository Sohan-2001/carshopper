require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Basic Health Check
app.get('/', (req, res) => {
  res.send('CarShopper Backend is running');
});

// Example: Trigger Scrape (Placeholder)
app.post('/api/refresh-listings', async (req, res) => {
  // Logic to trigger Apify actor
  res.json({ message: 'Scraping triggered' });
});

// Example: Webhook Receiver
app.post('/webhooks/apify', async (req, res) => {
  console.log('Received data from Apify:', req.body);
  // Logic to process data and insert into Supabase
  res.status(200).send('OK');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
