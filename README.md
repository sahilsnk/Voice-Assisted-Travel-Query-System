# Voice-Assisted-Travel-Query-System
# Voice-Assisted Travel Query System

A voice-based application that allows users to query travel routes, bus schedules, and availability using natural speech. This project leverages React for the frontend, Node.js for the backend, and MongoDB for data storage.

---

## Features

- Voice recognition for capturing user queries.
- Parses speech input into actionable transport queries.
- Fetches relevant bus details and routes based on the parsed input.
- Displays bus schedules, routes, and other details.

---

## Project Structure

### Backend (`backend/`)

- **`server.js`**: Main backend server written in Node.js. Handles routes and integrates with MongoDB.
- **`speech.js`**: Handles speech transcription and routes for saving and processing speech input.

### Frontend (`frontend/`)

- **React App**:
  - `VoiceTransportApp.jsx`: Main component for handling voice inputs and displaying results.
  - `components/ui/`: Reusable UI components such as buttons and cards.

---

## Setup Instructions

### Prerequisites

- Node.js (v16 or later)
- MongoDB database (Atlas or Local)

### Backend Setup

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Update MongoDB URI in `server.js`:
   ```javascript
   const client = new MongoClient("<Your MongoDB URI>");
   ```

4. Start the server:
   ```bash
   node server.js
   ```

   The server runs on `http://localhost:3000`.

### Frontend Setup

1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The React app runs on `http://localhost:5173`.

---

## API Endpoints

### `/save-transcription`
- **Method**: POST
- **Description**: Saves the user's speech transcription to the MongoDB database.
- **Payload**:
  ```json
  {
    "user_id": "<string>",
    "command_text": "<string>"
  }
  ```

---

## Technologies Used

- **Frontend**: React, TailwindCSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Speech Recognition**: Web Speech API

---

## Future Enhancements

- Add support for multilingual queries.
- Enhance query parsing for more complex requests.
- Integrate real-time bus tracking.

---

## Contributors

- **Sahil Santosh Naik**

Feel free to contribute to this project by submitting a pull request or reporting issues!

---

## License

This project is licensed under the MIT License.
