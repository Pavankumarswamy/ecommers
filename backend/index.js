const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const path = require('path');
const axios = require('axios'); // For diagnostic requests
const app = express();
const PORT = process.env.PORT || 3000;

// Validate environment variables
const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '1K0SHF2Lmm7iFNwGTAZ4RqvM0vFfsu9j1EXNpxH0CYu8';
if (!SPREADSHEET_ID) {
  throw new Error('Missing SPREADSHEET_ID environment variable');
}

// Service account credentials (testing only; move to environment variables in production)
const credentials = {
  type: 'service_account',
  project_id: 'cetmock-app',
  private_key_id: '6cbf2629fb136a2a9d46900b6ccdad759731a5db',
  private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDOBxzOWnLj4Zts\neFOT3cbHciuwejxXxmDImt4AAzSBimpyJcUHXOr84SPZ/NbR/41UvRnCffUPZ/re\nzFbdyQ9waFMFPCqVnOqK9kETvYdJ34MlqiIElMkDA+fVEwaFj5U7TJAnDrBuO9xV\n+ypPr9zagVZqKGksmACRCOHPeQvBFjxwpg1ZVdt7umyqLLML+55NlMdz0YYzr7NI\nFhUd0sDFhNF1kVe/KOwDC13mPqoNvVkQQ/ZmeUqR9zR8ukVXNfeEN7jzxx6eRaIb\nn/RpQbQxACAkRkNhSnSZrJRy9rH9CJnq8kJ1lZCwQrOaXajQwLOJH9FDqUOg2bei\nPLXu9SLhAgMBAAECggEAAo3jBQnpB7s5zo/1VU14E+vt77usONhcRdBptS1U/tAk\n/rJKLYuw3B68b4zrauIUsfrAMYGXQrAi05VL9Gb0OowIj3WN/5nY7I0eBG0imr9b\nJGHmFxFzJobrXmBkgc5kZr5NwTY06MD0O9qnzSIchlb5J8rFdwiRZTrrdcOF6khj\nEwF0zBJNvZax6tmAp5Zt+mvkf0fwTvov/ZWNcvhY29VOQy2am2SkikMojAZhh8SH\nqkokRcltouWjEcSSYgNkOmt0Hdap4g39hGKF+VledH24C+ey3NsJrF8hDXQSY1Ef\nYNyQDWiGHK6IHYXdGSUjiw6D58EzBGmOFyJdFeS4kwKBgQD6xFOA6qVtYmGVnrJP\nKR7RwT/vQSx270w1e/YgLIbMCVxFrYcs5XrwGVvx5y1vnbAagMzXcJmZmUYmQExv\nMukzAA5/E80Oio2meoVvXqH0rsX7g3++HYBVfIBIFRI3q6NCMt3qwr1AJ/+Sg4BZ\neJYrqo30ppJNxBrykav2mUg9XwKBgQDSU8a3bn/3qfzV7ZItWXZg1rr0gAQvRh9x\n5XmV8JK+pHnORImGsjdg7MYCi51DNof87HlOj0DCWxEqJnyY/XV+eJp8G0fRJoFz\ntoQda9/tjdSE2E8t+KzPbZR0g1jy3rRdjZAJkZSRDumNxg3LKrhp4CByMKuXTdXF\nAUx2yTZHvwKBgQDHNPsY6E5uLL9UunLvy7y96IS/rciC2upxen41ZOnYYH86ovVF\nRy94WMzfyEQh7OSeyT7wznRWvpopfN67X3g9mYfqj3JQYOTSIXaq2ERUOhrxCK+L\n+aefQX4uxP5p1yGkTwBXpEfvFVdDrs9hRBgXrC+E8GY8/NJjbDFtfqsShQKBgG9o\nRMgA1fO/rNc8IcO3sYaV9y1vacgIortXy9FqPrCQupxRnW8lk0PZ5wCOJ1zk059b\nOt4r7yeDyVHEVRdMmiHFjD7UzHOyq7s5ID3dWB2ilMFROo+lOxQcfRhCQqlS4cL0\nKymGXWWAuqGIGOJW3JvoRgd2VE2uwt65U2FQL1pNAoGADueVENBMWLotUo5n7PmL\nrVs2A0MKz4xxN6rd8wwoo1oLYWkiRKzAPvm0BaHMEeO+1ixwaWeX1w6oyMPto/iF\nLtShtD4ReVOp2XrL8Q2Eos/Zlbya3x37XfgZ00rbzPnz8vO/z3zl5sWt1V0DqxIl\nf1oe5B5jltZQLPc1SGBxiM0=\n-----END PRIVATE KEY-----\n',
  client_email: 'sheet-access-service@cetmock-app.iam.gserviceaccount.com',
  client_id: '111798034106787658912',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/sheet-access-service%40cetmock-app.iam.gserviceaccount.com',
  universe_domain: 'googleapis.com'
};

// Validate credentials
if (!credentials.client_email || !credentials.private_key) {
  throw new Error('Invalid credentials: Missing client_email or private_key');
}

app.use(cors({
  origin: ['https://workmitra.onrender.com', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Authenticate with Google
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Diagnostic route to test Google API connectivity and time
app.get('/api/health', async (req, res) => {
  try {
    const serverTime = new Date();
    const googleResponse = await axios.get('https://sheets.googleapis.com/v4/discovery', {
      headers: { 'User-Agent': 'workmitra/1.0' },
    });
    const googleTime = googleResponse.headers.date ? new Date(googleResponse.headers.date) : null;
    res.json({
      status: 'ok',
      googleApiReachable: true,
      serverTime: serverTime.toISOString(),
      googleTime: googleTime ? googleTime.toISOString() : 'N/A',
      timeDiffMs: googleTime ? serverTime - googleTime : 'N/A',
      apiResponse: googleResponse.status,
    });
  } catch (error) {
    console.error('Health check error:', {
      message: error.message,
      code: error.code,
      details: error.response?.data,
      stack: error.stack,
    });
    res.status(500).json({
      status: 'error',
      googleApiReachable: false,
      error: error.message,
      serverTime: new Date().toISOString(),
    });
  }
});

// Check or create sheet
async function ensureSheetExists(sheets, name) {
  try {
    console.log(`Checking sheet ${name} for spreadsheet ${SPREADSHEET_ID} @ ${new Date().toISOString()}`);
    const res = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
      fields: 'sheets.properties.title',
    });
    const existing = res.data.sheets.map(s => s.properties.title);
    if (!existing.includes(name)) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: {
          requests: [{ addSheet: { properties: { title: name } } }],
        },
      });
      console.log(`Created sheet ${name} @ ${new Date().toISOString()}`);
    } else {
      console.log(`Sheet ${name} already exists`);
    }
  } catch (error) {
    console.error(`Error ensuring sheet ${name}:`, {
      message: error.message,
      code: error.code,
      details: error.errors,
      stack: error.stack,
    });
    throw error;
  }
}

// Append values
async function appendToSheet(sheet, values) {
  try {
    const clientTime = new Date();
    const client = await auth.getClient();
    console.log(`Authenticated client for ${sheet} @ ${clientTime.toISOString()}`);
    const sheets = google.sheets({ version: 'v4', auth: client });
    await ensureSheetExists(sheets, sheet);
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheet}!A1`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [values] },
    });
    console.log(`Successfully appended to sheet ${sheet} @ ${new Date().toISOString()}`, values);
  } catch (error) {
    console.error(`Error appending to sheet ${sheet}:`, {
      message: error.message,
      code: error.code,
      details: error.errors,
      stack: error.stack,
    });
    throw error;
  }
}

// Routes
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields required' });
  }
  try {
    await appendToSheet('Register', [name, email, password, new Date().toISOString()]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error in /api/register:', {
      message: error.message,
      code: error.code,
      details: error.errors,
      stack: error.stack,
    });
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
});

app.post('/api/address', async (req, res) => {
  const { name, email, address, phone } = req.body;
  if (!name || !email || !address || !phone) {
    return res.status(400).json({ error: 'All fields required' });
  }
  try {
    await appendToSheet('Address', [name, email, address, phone, new Date().toISOString()]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error in /api/address:', {
      message: error.message,
      code: error.code,
      details: error.errors,
      stack: error.stack,
    });
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
});

app.post('/api/billing', async (req, res) => {
  const { name, email, cardNumber, expiry, cvv } = req.body;
  if (!name || !email || !cardNumber || !expiry || !cvv) {
    return res.status(400).json({ error: 'All fields required' });
  }
  try {
    await appendToSheet('Billing', [name, email, cardNumber, expiry, cvv, new Date().toISOString()]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error in /api/billing:', {
      message: error.message,
      code: error.code,
      details: error.errors,
      stack: error.stack,
    });
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
});

app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields required' });
  }
  try {
    await appendToSheet('Contact', [name, email, message, new Date().toISOString()]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error in /api/contact:', {
      message: error.message,
      code: error.code,
      details: error.errors,
      stack: error.stack,
    });
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
});

app.get('/api/get-register', async (req, res) => {
  try {
    const clientTime = new Date();
    const client = await auth.getClient();
    console.log(`Authenticated client for get-register @ ${clientTime.toISOString()}`);
    const sheets = google.sheets({ version: 'v4', auth: client });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Register!A1:D1000',
    });
    res.json(response.data.values || []);
  } catch (error) {
    console.error('Error in /api/get-register:', {
      message: error.message,
      code: error.code,
      details: error.errors,
      stack: error.stack,
    });
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  try {
    const clientTime = new Date();
    const client = await auth.getClient();
    console.log(`Authenticated client for login @ ${clientTime.toISOString()}`);
    const sheets = google.sheets({ version: 'v4', auth: client });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Register!A1:D1000',
    });
    const users = response.data.values || [];
    const user = users.find(row => row[1] === email && row[2] === password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    res.json({ success: true, user: { name: user[0], email: user[1] } });
  } catch (error) {
    console.error('Error in /api/login:', {
      message: error.message,
      code: error.code,
      details: error.errors,
      stack: error.stack,
    });
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log('Server time:', new Date().toISOString());
});
