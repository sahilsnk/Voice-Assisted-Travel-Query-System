const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2/promise');
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const port = 3000;
const uri = "mongodb+srv://samarthdgothe:dbmsel@el.tugo2.mongodb.net/?retryWrites=true&w=majority&appName=EL";

// MySQL Database Configuration
const dbConfig = {
  host: '192.168.56.1',
  user: 'sahil',
  password: 'sahil123',
  database: 'transport_system',
};
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let mysqlDb; 
let mongodbDb; 

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    await client.connect();
    mongodbDb = client.db("voiceDataDB");
    console.log("Connected to MongoDB!");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1); 
  }
}

// Connect to MySQL Database
async function connectToMySQL() {
  try {
    mysqlDb = await mysql.createConnection(dbConfig);
    console.log("✅ Connected to MySQL Database!");
  } catch (error) {
    console.error("❌ Failed to connect to MySQL:", error);
    process.exit(1);
  }
}

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Login Route
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Check if the user exists
        const [users] = await mysqlDb.execute(
            `SELECT * FROM user WHERE Email = ? AND Password = ?`,
            [email, password]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = users[0];
        res.json({ message: 'Login successful', user: { email: user.Email, id: user.User_Id } });
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Function to extract source and destination
function extractSourceDestination(command_text) {
  const fromToPattern = /from (.*?) to (.*?)(?:$|[.,])/i;
  const toFromPattern = /go to (.*?) from (.*?)(?:$|[.,])/i;
  const directPattern = /^(.*?) to (.*?)(?:$|[.,])/i;

  let source = null, destination = null;

  if (fromToPattern.test(command_text)) {
    [, source, destination] = command_text.match(fromToPattern);
  } else if (toFromPattern.test(command_text)) {
    [, destination, source] = command_text.match(toFromPattern);
  } else if (directPattern.test(command_text)) { 
    [, source, destination] = command_text.match(directPattern);
  }

  return { source, destination };
}

// API Route - Save Transcription and Fetch Buses
app.post('/save-transcription', async (req, res) => {
  console.log('📌 POST /save-transcription called');

  try {
    const { user_id, command_text } = req.body;

    if (!command_text) {
      console.error('⚠️ No command_text received');
      return res.status(400).json({ error: 'Missing command_text' });
    }

    console.log('📥 Received transcription data:', { user_id, command_text });

    // Extract source and destination
    const { source, destination } = extractSourceDestination(command_text);
    console.log(`📍 Extracted - Source: ${source}, Destination: ${destination}`);

    if (!source || !destination) {
      return res.status(400).json({ error: 'Could not extract source and destination' });
    }

    // 📝 **Save transcription data into MongoDB**
    const collection = mongodbDb.collection("SpeechToTextData");
    const mongoResult = await collection.insertOne({
      user_id: user_id || null,  
      command_text,
      source,
      destination,
      timestamp: new Date()
    });

    console.log('✅ Transcription saved to MongoDB:', mongoResult.insertedId);

    // 🔍 **Find matching buses from MySQL**
    const [busResults] = await mysqlDb.execute(
      `SELECT bus.Bus_Id, bus.Bus_Number, bus.Bus_Type, bus.Capacity, bus.Timing, 
              route.Start_Location, route.End_Location
       FROM Bus 
       JOIN Route ON bus.Route_Id = Route.Route_Id
       WHERE LOWER(Route.Start_Location) = ? AND LOWER(Route.End_Location) = ?`,
      [source.toLowerCase(), destination.toLowerCase()]
    );

    console.log(`🚌 Found ${busResults.length} matching buses`);

    res.json({
      message: 'Transcription processed successfully',
      mongo_id: mongoResult.insertedId,
      extracted_data: { source, destination },
      buses: busResults
    });
  } catch (error) {
    console.error('❌ Error processing transcription:', error);
    res.status(500).json({ error: 'Failed to process transcription' });
  }
});

// Add this new endpoint in your server.js
app.post('/submit-feedback', async (req, res) => {
  console.log('📌 POST /submit-feedback called');

  try {
    const { user_id, rating, cleanliness, punctuality, comment } = req.body;
    
    // Calculate average rating from the three ratings
    const averageRating = (parseFloat(rating) + parseFloat(cleanliness) + parseFloat(punctuality)) / 3;

    // Insert into feedback table
    const [result] = await mysqlDb.execute(
      `INSERT INTO feedback (User_Id, Rating, Feedback_Text) 
       VALUES (?, ?, ?)`,
      [user_id, averageRating, comment]
    );

    console.log('✅ Feedback submitted successfully');
    res.json({ 
      message: 'Feedback submitted successfully',
      feedback_id: result.insertId 
    });

  } catch (error) {
    console.error('❌ Error submitting feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});
// Start the server after connecting to the databases
async function startServer() {
  await connectToMongoDB();
  await connectToMySQL();
  
  app.listen(port, () => {
    console.log(`🚀 Server is running at http://localhost:${port}`);
  });
}

startServer();
