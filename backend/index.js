const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all origins (for development; restrict in production)
app.use(cors());
app.use(bodyParser.json());

// Google Sheets authentication
const auth = new google.auth.GoogleAuth({
  keyFile: 'service_account.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const SPREADSHEET_ID = '1K0SHF2Lmm7iFNwGTAZ4RqvM0vFfsu9j1EXNpxH0CYu8';

// Check if a sheet exists and create it if it doesn't
async function ensureSheetExists(sheets, sheetName) {
  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
      fields: 'sheets.properties.title',
    });
    const sheetsList = response.data.sheets.map(sheet => sheet.properties.title);
    if (!sheetsList.includes(sheetName)) {
      console.log(`Creating sheet "${sheetName}"...`);
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: {
          requests: [{
            addSheet: {
              properties: { title: sheetName },
            },
          }],
        },
      });
      console.log(`Sheet "${sheetName}" created.`);
    }
  } catch (err) {
    console.error(`Error ensuring sheet "${sheetName}" exists:`, err.message);
    throw err;
  }
}

// Append data to a sheet
async function appendToSheet(sheetName, values) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });
  await ensureSheetExists(sheets, sheetName);
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [values] },
    });
    console.log(`Appended to ${sheetName}:`, values);
  } catch (err) {
    console.error(`Error appending to ${sheetName}:`, err.message);
    throw err;
  }
}

// POST /api/register
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log('Register request:', req.body);
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    await appendToSheet('Register', [name, email, password, new Date().toISOString()]);
    res.status(200).json({ success: true, message: 'Registration successful' });
  } catch (err) {
    res.status(500).json({ error: `Failed to register: ${err.message}` });
  }
});

// POST /api/address
app.post('/api/address', async (req, res) => {
  try {
    const { name, email, address, phone } = req.body;
    console.log('Address request:', req.body);
    if (!name || !email || !address || !phone) {
      return res.status(400).json({ error: 'Name, email, address, and phone are required' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (!/^\d{10,15}$/.test(phone.replace(/\D/g, ''))) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }
    await appendToSheet('Address', [name, email, address, phone, new Date().toISOString()]);
    res.status(200).json({ success: true, message: 'Address saved successfully' });
  } catch (err) {
    res.status(500).json({ error: `Failed to save address: ${err.message}` });
  }
});

// POST /api/billing
app.post('/api/billing', async (req, res) => {
  try {
    const { name, email, cardNumber, expiry, cvv } = req.body;
    console.log('Billing request:', req.body);
    if (!name || !email || !cardNumber || !expiry || !cvv) {
      return res.status(400).json({ error: 'Name, email, cardNumber, expiry, and cvv are required' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (!/^\d{16}$/.test(cardNumber.replace(/\D/g, ''))) {
      return res.status(400).json({ error: 'Invalid card number (must be 16 digits)' });
    }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
      return res.status(400).json({ error: 'Invalid expiry date (MM/YY)' });
    }
    if (!/^\d{3}$/.test(cvv)) {
      return res.status(400).json({ error: 'Invalid CVV (must be 3 digits)' });
    }
    await appendToSheet('Billing', [name, email, cardNumber, expiry, cvv, new Date().toISOString()]);
    res.status(200).json({ success: true, message: 'Billing information saved successfully' });
  } catch (err) {
    res.status(500).json({ error: `Failed to save billing info: ${err.message}` });
  }
});

// POST /api/contact
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    console.log('Contact request:', req.body);
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    await appendToSheet('Contact', [name, email, message, new Date().toISOString()]);
    res.status(200).json({ success: true, message: 'Contact message sent successfully' });
  } catch (err) {
    res.status(500).json({ error: `Failed to send message: ${err.message}` });
  }
});

// GET /api/get-register
app.get('/api/get-register', async (req, res) => {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });
    await ensureSheetExists(sheets, 'Register');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Register!A1:D1000',
    });
    const values = response.data.values || [];
    console.log('Fetched Register data:', values);
    res.status(200).json(values);
  } catch (err) {
    console.error('Error fetching Register data:', err.message);
    res.status(500).json({ error: `Failed to fetch data: ${err.message}` });
  }
});

// POST /api/login (New endpoint for Login form)
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login request:', { email, password });
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });
    await ensureSheetExists(sheets, 'Register');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Register!A1:D1000',
    });
    const users = response.data.values || [];
    const user = users.find(row => row[1] === email && row[2] === password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    res.status(200).json({ success: true, message: 'Login successful', user: { name: user[0], email: user[1] } });
  } catch (err) {
    console.error('Error on login:', err.message);
    res.status(500).json({ error: `Failed to login: ${err.message}` });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});