const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Validate environment variables
const GOOGLE_CREDENTIALS = "{
  "type": "service_account",
  "project_id": "cetmock-app",
  "private_key_id": "7d6b40681a588800953f3c168d352e905ff52e82",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDcStqClpY57ca3\n3OZLw84RJFDrzPzfL821Abe20pJ0Y4kOU0+Dwwb2f57+dzAJITT2tiw+qhx3oTx5\n3CNT10iShD6vRlBSH7k7y8ozwkSl4NB/fZLSQoQaHrQ5H/8dzCryXcFDkT6DKIpc\nErog+NVBA0as1lv2lIZ7u9gVfBZzyIiQUt2HYDbeYLAbwvRSpEew+ucRulV/XU/H\nu77D4GUiptaJBYRZkGfs5zM5kjw01LW3f3jgJT3DrEpwlmAEHdFhT1SgPhuK3ZHZ\n2hNC0vbyxq4Qq1Vv1lwl71exPgxqR+fepTRlxaz9UDN1KGa3Rwu61XIc3CCMuvGT\n2p3nrdf9AgMBAAECgf8cZYnFS6QR05TKHq+RFKx7iTLlModmPcNGkfIcnwhB+JKy\nRgr58Sn0nH7iTnrismUhaFpLuaHxydcB3l6vcBDq0iFCds3jyDMYgiyOf3xZ5aD6\nzjUe5XQh6dNRic5ZCPiARZWkIBTu00sCk2dq2KikuMdjgD5aisrLKGuyWUyLoBC8\n6DNqAmxT/u6QZyfYbAIfJr5LFrupwQEMvBH87KMz1e8Cq+JDze4C1zxAo+A9D0zB\nK139xFjFAi4ZbwDn5x0v5lEjEY7Rn1z11yFHvQWHP+rcENjhFJQhDKS9K4Nt+cfl\nWoOc4DwaXWXq971of811uZ/RH8Lu6k4AWREpsmECgYEA8wxHqqnIJpUPaw88aUOw\nKBs8IM3oTXXuAZG3uOyUv8pPffdo6mtXNWbg2P2vu9+MBHvErr6y8Qn0av4JCiJq\nB4XLHV+sWxrfHbDYjn6gGTEcKQjMWi4Tb/wHIM16D+oKSXeQ9L0r+St5hXo/raRy\ns+d9M+Jv8mUw9AHrPqBI6AUCgYEA6Agi8lBTgggBrU+/BUDGtoT94diEQEO3tJUi\nH0PxddDKp1ada+EgakH8rtgAiQg1AD/Y4Cgp2/UF1tplv9qr4G7N4aJtVLRppfEf\n2SoRfpjGF5OjMfyBT2MYhhuD99mJj+IoVzE2CVEQ2lUpcFbK80tfWQ3UTL1w3y/I\nDb2XCZkCgYEA4xYZK/MAaFQjmMMejbfJsl9n+bqJjz5dh6fPwf+CKARt62Mr6sMq\nM2IROY0mEeKXn2TI6wCQjrffX8xFQ+vNp4OxuJs4ndLonoQqglD7Yy5IgmqPDL86\nOAqB2ntBzfa9b9FAZfsOR/v/yd/j+WjKJx9mEwFB2XgEmifk1ZnLJMUCgYEAh16v\n3MUGY1d+evmKjWsEQ9oFMK0cQ03+sGlNdgYyqjS89rHut9CpE7UZ0XwNm+Tg3xtg\n0S49dalW1cmnES5nllGu5dPYi1GSTZEGrrD/ced5sqmczX3uhz1eQmdtL72Hpx0f\nwfbg+sCD341N1s+cKiMwJomN8ZOYdW2v/mw84QkCgYEA6D6OqQj7mOje/PDq3btk\nrCdZPfyEPrVuFlu4LjNmVb5WyXXNAiW4Y+LrCyj2eNJn78aJmFkQZOmKJejZmsVk\nuLpWSsdH5KNcsMWffdXgXxXRKNwqNytapvzU8V9C1zv7/6kriAHRkGTe9YbzlgXn\nWqtLFGIRAX6JtghElynyVJ4=\n-----END PRIVATE KEY-----\n",
  "client_email": "test-app@cetmock-app.iam.gserviceaccount.com",
  "client_id": "103677338097044312260",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/test-app%40cetmock-app.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
";
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
  try {
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
      console.log(`Created sheet: ${name}`);
    } else {
      console.log(`Sheet ${name} already exists`);
    }
  } catch (error) {
    console.error(`Error ensuring sheet ${name} exists:`, {
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
    const client = await auth.getClient();
    console.log(`Authenticated client for sheet ${sheet}`);
    const sheets = google.sheets({ version: 'v4', auth: client });
    await ensureSheetExists(sheets, sheet);
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheet}!A1`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [values] },
    });
    console.log(`Successfully appended to sheet: ${sheet}`, values);
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
    const client = await auth.getClient();
    console.log('Authenticated client for /api/get-register');
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
    return res.status(400).json({ error: 'Email and password are required' });
  }
  try {
    const client = await auth.getClient();
    console.log('Authenticated client for /api/login');
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

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`Server time: ${new Date().toISOString()}`);
});
