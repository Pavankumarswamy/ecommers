const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(bodyParser.json());

// Serve static frontend files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Google Sheets Auth
const auth = new google.auth.GoogleAuth({
  keyFile: 'service_account.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const SPREADSHEET_ID = '1K0SHF2Lmm7iFNwGTAZ4RqvM0vFfsu9j1EXNpxH0CYu8';

// Utilities
async function ensureSheetExists(sheets, sheetName) {
  const response = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: 'sheets.properties.title',
  });
  const sheetsList = response.data.sheets.map(sheet => sheet.properties.title);
  if (!sheetsList.includes(sheetName)) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [{ addSheet: { properties: { title: sheetName } } }]
      }
    });
  }
}

async function appendToSheet(sheetName, values) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });
  await ensureSheetExists(sheets, sheetName);
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A1`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [values] },
  });
}

// Endpoints

app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'All fields required' });
  try {
    await appendToSheet('Register', [name, email, password, new Date().toISOString()]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/address', async (req, res) => {
  const { name, email, address, phone } = req.body;
  if (!name || !email || !address || !phone)
    return res.status(400).json({ error: 'All fields required' });
  try {
    await appendToSheet('Address', [name, email, address, phone, new Date().toISOString()]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/billing', async (req, res) => {
  const { name, email, cardNumber, expiry, cvv } = req.body;
  if (!name || !email || !cardNumber || !expiry || !cvv)
    return res.status(400).json({ error: 'All fields required' });
  try {
    await appendToSheet('Billing', [name, email, cardNumber, expiry, cvv, new Date().toISOString()]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message)
    return res.status(400).json({ error: 'All fields required' });
  try {
    await appendToSheet('Contact', [name, email, message, new Date().toISOString()]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' });
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Register!A1:D1000',
    });
    const users = response.data.values || [];
    const user = users.find(row => row[1] === email && row[2] === password);
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    res.json({ success: true, user: { name: user[0], email: user[1] } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fallback: serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on https://ecommers-ula5.onrender.com${PORT}`);
});
