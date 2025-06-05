const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Validate environment variables
const GOOGLE_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '1K0SHF2Lmm7iFNwGTAZ4RqvM0vFfsu9j1EXNpxH0CYu8';
if (!GOOGLE_CREDENTIALS) {
  throw new Error('Missing GOOGLE_APPLICATION_CREDENTIALS environment variable');
}
if (!SPREADSHEET_ID) {
  throw new Error('Missing SPREADSHEET_ID environment variable');
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
  credentials: JSON.parse(GOOGLE_CREDENTIALS),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Check or create sheet
async function ensureSheetExists(sheets, name) {
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
  }
}

// Append values
async function appendToSheet(sheet, values) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });
  await ensureSheetExists(sheets, sheet);
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheet}!A1`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [values] },
  });
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
    console.error('Error in /api/register:', error.message, error.stack);
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
    console.error('Error in /api/address:', error.message, error.stack);
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
    console.error('Error in /api/billing:', error.message, error.stack);
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
    console.error('Error in /api/contact:', error.message, error.stack);
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
});

app.get('/api/get-register', async (req, res) => {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Register!A1:D1000',
    });
    res.json(response.data.values || []);
  } catch (error) {
    console.error('Error in /api/get-register:', error.message, error.stack);
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  try {
    const client = await auth.getClient();
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
    console.error('Error in /api/login:', error.message, error.stack);
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
