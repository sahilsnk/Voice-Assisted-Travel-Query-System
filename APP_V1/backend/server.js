const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2/promise');
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const port = 3000;
const uri = "MONGO_DB_CONNECTION_STRING"; 

// MySQL Database Configuration
const dbConfig = {
  host: 'HOSTNAME',
  user: 'USERNAME',
  password: 'PASSWORD',
  database: 'DATABASE_NAME',
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
    // In your /save-transcription route
    const [busResults] = await mysqlDb.execute(
      `SELECT bus.Bus_Id, bus.Bus_Number, bus.Bus_Type, bus.Capacity, bus.Timing, 
      route.Start_Location, route.End_Location,
      COALESCE(AVG(feedback.Rating), 0) AS average_rating
      FROM Bus 
      JOIN Route ON bus.Route_Id = Route.Route_Id
      LEFT JOIN feedback ON bus.Bus_Id = feedback.Bus_Id
      WHERE LOWER(Route.Start_Location) = ? AND LOWER(Route.End_Location) = ?
      GROUP BY bus.Bus_Id`,
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
    const { user_id, bus_id, rating, cleanliness, punctuality, comment } = req.body;
    
    // Calculate average rating
    const averageRating = (parseFloat(rating) + parseFloat(cleanliness) + parseFloat(punctuality)) / 3;

    // Insert into MySQL feedback table
    const [result] = await mysqlDb.execute(
      `INSERT INTO feedback (User_Id, Bus_Id, Rating, Feedback_Text) 
       VALUES (?, ?, ?, ?);`,  // Add Bus_Id to SQL query
      [user_id, bus_id, averageRating, comment]
    );

    console.log('✅ Feedback submitted successfully to MySQL');

    // MongoDB feedback insertion
    const feedback_collection = mongodbDb.collection("FeedBackData");
    const feedback_mongoResult = await feedback_collection.insertOne({
      user_id: user_id || null,  
      bus_id : bus_id,
      comment,
      feedback_id: result.insertId,
      rating,
      cleanliness,
      punctuality,
      averageRating,
      timestamp: new Date()
    });

    console.log('✅ Feedback saved to MongoDB:', feedback_mongoResult.insertedId);

    // Send response after both operations are completed
    res.json({ 
      message: 'Feedback submitted successfully',
      feedback_id: result.insertId,
      mongo_id: feedback_mongoResult.insertedId
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
