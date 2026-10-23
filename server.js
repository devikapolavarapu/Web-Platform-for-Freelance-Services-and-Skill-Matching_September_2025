const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Token missing' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Forbidden: Invalid token' });
  }
};

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Freelance Marketplace API is running' });
});

// User Routes
app.post('/api/users', async (req, res) => {
  const { name, email, password, role = 'student' } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  if (role !== 'student' && role !== 'client') {
    return res.status(400).json({ error: 'Invalid role. Must be student or client.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashedPassword, role]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating user:', err.message);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Error during login:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/profile', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching profile:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Job Routes
app.post('/api/jobs', authMiddleware, async (req, res) => {
  if (req.user.role !== 'client') {
    return res.status(403).json({ error: 'Only clients can create jobs' });
  }

  const { title, description } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO jobs (title, description, client_id) VALUES ($1, $2, $3) RETURNING *',
      [title, description, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating job:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/jobs', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM jobs');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching jobs:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Application Routes
app.post('/api/apply', authMiddleware, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can apply' });
  }

  const { job_id } = req.body;
  if (!job_id) {
    return res.status(400).json({ error: 'job_id is required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO applications (job_id, student_id) VALUES ($1, $2) RETURNING *',
      [job_id, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating application:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Messaging and Notification Routes
app.post('/api/message', authMiddleware, async (req, res) => {
  const { receiver_id, content } = req.body;
  if (!receiver_id || !content) {
    return res.status(400).json({ error: 'receiver_id and content are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const msgResult = await client.query(
      'INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, receiver_id, content]
    );
    const messageRecord = msgResult.rows[0];

    await client.query(
      'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
      [receiver_id, 'You have a new message']
    );

    await client.query('COMMIT');
    res.status(201).json(messageRecord);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error sending message:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

app.get('/api/messages/:userId', authMiddleware, async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM messages 
       WHERE (sender_id = $1 AND receiver_id = $2) 
          OR (sender_id = $2 AND receiver_id = $1)
       ORDER BY created_at ASC`,
      [req.user.id, userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching messages:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/notifications', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY id DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching notifications:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Payment Routes
app.post('/api/pay', authMiddleware, async (req, res) => {
  if (req.user.role !== 'client') {
    return res.status(403).json({ error: 'Only clients can process payments' });
  }

  const { job_id, amount } = req.body;
  if (!job_id || !amount) {
    return res.status(400).json({ error: 'job_id and amount are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO payments (job_id, amount, status) VALUES ($1, $2, $3) RETURNING *',
      [job_id, amount, 'completed']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating payment:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/payments', authMiddleware, async (req, res) => {
  try {
    let query;
    let params = [req.user.id];

    if (req.user.role === 'client') {
      query = `
        SELECT p.* FROM payments p
        JOIN jobs j ON p.job_id = j.id
        WHERE j.client_id = $1
      `;
    } else {
      query = `
        SELECT p.* FROM payments p
        JOIN applications a ON p.job_id = a.job_id
        WHERE a.student_id = $1
      `;
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching payments:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Resume Routes
const multer = require('multer');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const upload = multer({ dest: 'uploads/' });

app.post('/api/resume', authMiddleware, upload.single('resume'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No resume file uploaded' });
  }
  
  try {
    console.log(req.file);
    
    const dataBuffer = fs.readFileSync(req.file.path);
    const data = await pdfParse(dataBuffer);
    const text = data.text.toLowerCase();
    
    let finalScore = 50;
    if (text.includes('javascript')) finalScore += 10;
    if (text.includes('react')) finalScore += 10;
    if (text.includes('projects')) finalScore += 10;
    if (text.includes('experience')) finalScore += 10;
    
    fs.unlinkSync(req.file.path); // cleanup empty temp buffers 
    
    res.json({ score: finalScore });
  } catch (err) {
    console.error('Error parsing PDF:', err.message);
    res.json({ score: 0 });
  }
});

// Database Connection
const PORT = process.env.PORT || 5000;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL
      )
    `);
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'student';
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        client_id INTEGER REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id SERIAL PRIMARY KEY,
        job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
        student_id INTEGER REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
        amount INTEGER NOT NULL,
        status TEXT NOT NULL
      )
    `);
    console.log('Users, jobs, applications, messages, notifications, and payments tables ensured');
  } catch (err) {
    console.error('Error creating table:', err.message);
  }
};

pool.connect()
  .then(() => {
    console.log('Connected to PostgreSQL');
    initDb();
  })
  .catch(err => console.error('PostgreSQL connection error:', err.message));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});