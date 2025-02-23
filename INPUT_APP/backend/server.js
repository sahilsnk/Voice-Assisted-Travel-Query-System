const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database connection
const db = mysql.createConnection({
    host: 'HOSTNAME',
    user: 'USERNAME',
    password: 'PASSWORD',
    database: 'DATABASE_NAME',
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to database');
});

// Get all routes
app.get('/api/routes', (req, res) => {
    const query = 'SELECT * FROM route';
    db.query(query, (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(results);
    });
});

// Add new route
app.post('/api/routes', (req, res) => {
    const { start_location, end_location, distance, total_duration } = req.body;
    const query = 'INSERT INTO route (Start_Location, End_Location, Distance, Total_Duration) VALUES (?, ?, ?, ?)';
    
    db.query(query, [start_location, end_location, distance, total_duration], (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: result.insertId, message: 'Route added successfully' });
    });
});

// Add new bus
app.post('/api/buses', (req, res) => {
    const { route_id, bus_number, bus_type, capacity, timing } = req.body;
    const query = 'INSERT INTO bus (Route_Id, Bus_Number, Bus_Type, Capacity, Timing) VALUES (?, ?, ?, ?, ?)';
    
    db.query(query, [route_id, bus_number, bus_type, capacity, timing], (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: result.insertId, message: 'Bus added successfully' });
    });
});

// Get all buses
app.get('/api/buses', (req, res) => {
    const query = `
        SELECT b.*, r.Start_Location, r.End_Location 
        FROM bus b 
        JOIN route r ON b.Route_Id = r.Route_Id
    `;
    db.query(query, (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(results);
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});