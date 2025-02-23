import { useState, useEffect } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import axios from "axios";
const FeedbackForm = ({ bus, onClose, onSubmit }) => {
  const [feedback, setFeedback] = useState({
    rating: 5,
    cleanliness: 5,
    punctuality: 5,
    comment: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(feedback);
    onClose();
  };

  return (
    <div className="feedback-modal-overlay">
      <div className="feedback-modal">
        <h2 className="feedback-title">Feedback for Bus {bus.Bus_Number}</h2>
        <form onSubmit={handleSubmit} className="feedback-form">
          <div className="form-group">
            <label>Overall Rating</label>
            <input
              type="range"
              min="1"
              max="5"
              value={feedback.rating}
              onChange={(e) => setFeedback({...feedback, rating: e.target.value})}
              className="range-input"
            />
            <span>{feedback.rating}/5</span>
          </div>
          
          <div className="form-group">
            <label>Cleanliness</label>
            <input
              type="range"
              min="1"
              max="5"
              value={feedback.cleanliness}
              onChange={(e) => setFeedback({...feedback, cleanliness: e.target.value})}
              className="range-input"
            />
            <span>{feedback.cleanliness}/5</span>
          </div>

          <div className="form-group">
            <label>Punctuality</label>
            <input
              type="range"
              min="1"
              max="5"
              value={feedback.punctuality}
              onChange={(e) => setFeedback({...feedback, punctuality: e.target.value})}
              className="range-input"
            />
            <span>{feedback.punctuality}/5</span>
          </div>

          <div className="form-group">
            <label>Additional Comments</label>
            <textarea
              value={feedback.comment}
              onChange={(e) => setFeedback({...feedback, comment: e.target.value})}
              className="feedback-textarea"
              placeholder="Share your experience..."
            />
          </div>

          <div className="button-group">
            <button type="submit" className="submit-button">Submit Feedback</button>
            <button type="button" onClick={onClose} className="cancel-button">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Home = () => {
  // ... [previous state and hooks remain the same]
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [busResults, setBusResults] = useState([]);
  const [activeTab, setActiveTab] = useState("query");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingQueue, setProcessingQueue] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [selectedBusForFeedback, setSelectedBusForFeedback] = useState(null);

  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = 
    useSpeechRecognition();
    useEffect(() => {
      // Get user data from localStorage on component mount
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    }, []);
  // ... [previous useEffect and handler functions remain the same]
  useEffect(() => {
    if (!transcript || listening || isProcessing) return;

    const processQueue = async () => {
      if (processingQueue.length === 0 || !user) return;
      
      const currentTranscript = processingQueue[0];
      setIsProcessing(true);
      
      try {
        const response = await axios.post("http://localhost:3000/save-transcription", {
          user_id: user.id, // Use the logged-in user's ID
          command_text: currentTranscript,
        });

        setMessage(`Query processed successfully`);
        setBusResults(response.data.buses || []);
        setActiveTab("results");
        resetTranscript();
      } catch (error) {
        console.error("Error processing query:", error);
        setMessage("Error processing query: " + error.message);
      } finally {
        setProcessingQueue(prev => prev.slice(1));
        setIsProcessing(false);
      }
    };

    const timeoutId = setTimeout(() => {
      setProcessingQueue(prev => [...prev, transcript.trim()]);
    }, 1500);

    processQueue();
    return () => clearTimeout(timeoutId);
  }, [transcript, listening, isProcessing, processingQueue, resetTranscript, user]);
  const StarRating = ({ rating }) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className="star-rating">
        {[...Array(5)].map((_, index) => (
          <span key={index} className="star">
            {index < fullStars ? '★' : 
             (hasHalfStar && index === fullStars) ? '⯨' : '☆'}
          </span>
        ))}
        <span className="rating-text">({parseFloat(rating).toFixed(1)})</span>
      </div>
    );
  };
  const toggleListening = () => {
    if (listening) {
      SpeechRecognition.stopListening();
      if (transcript) {
        setProcessingQueue(prev => [...prev, transcript.trim()]);
      }
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ 
        continuous: false,
        language: 'en-IN'
      });
    }
  };

  const handleRowClick = (index) => {
    setSelectedBus(selectedBus === index ? null : index);
  };

  const handleGiveFeedback = (bus, e) => {
    e.stopPropagation();
    setSelectedBusForFeedback(bus);
    setShowFeedbackForm(true);
  };

  const handleFeedbackSubmit = async (feedbackData) => {
    try {
      const response = await axios.post("http://localhost:3000/submit-feedback", {
        user_id: user.id,
        bus_id: selectedBusForFeedback.Bus_Id,
        ...feedbackData
      });
  
      console.log("Feedback submitted:", response.data);
      setMessage("Feedback submitted successfully!");
      setShowFeedbackForm(false);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setMessage("Error submitting feedback: " + error.message);
    }
  };



  const TabButton = ({ tab, label }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`tab-button ${activeTab === tab ? 'active' : ''}`}
    >
      {label}
    </button>
  );

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="browser-not-supported">
        Browser doesn't support speech recognition.
      </div>
    );
  }

  return (
    <div className="home-container">
      <style>{`
        .home-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(180deg, #f0f7ff 0%, #ffffff 100%);
          padding: 2rem;
        }

        .content-wrapper {
          width: 100%;
          max-width: 1200px;
          background: white;
          border-radius: 20px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          padding: 2rem;
        }

        .title {
          font-size: 2.5rem;
          color: #1a365d;
          text-align: center;
          margin-bottom: 2rem;
          font-weight: bold;
        }

        .controls {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .feedback-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .feedback-modal {
          background: white;
          padding: 2rem;
          border-radius: 1rem;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .feedback-title {
          font-size: 1.5rem;
          color: #1a365d;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .feedback-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-weight: 600;
          color: #4b5563;
        }

        .range-input {
          width: 100%;
          height: 2rem;
        }

        .feedback-textarea {
          width: 100%;
          min-height: 100px;
          padding: 0.5rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          resize: vertical;
        }

        .button-group {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .submit-button {
          background: #3b82f6;
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          border: none;
          cursor: pointer;
          font-weight: 600;
        }

        .submit-button:hover {
          background: #2563eb;
        }

        .cancel-button {
          background: #6b7280;
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          border: none;
          cursor: pointer;
          font-weight: 600;
        }

        .cancel-button:hover {
          background: #4b5563;
        }
        .button {
          padding: 0.75rem 1.5rem;
          border-radius: 9999px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .listen-button {
          background: ${listening ? '#ef4444' : '#3b82f6'};
          color: white;
        }

        .listen-button:hover {
          background: ${listening ? '#dc2626' : '#2563eb'};
        }

        .reset-button {
          background: #6b7280;
          color: white;
        }

        .reset-button:hover {
          background: #4b5563;
        }

        .message {
          text-align: center;
          color: #4b5563;
          margin-bottom: 1.5rem;
        }

        .tabs {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .tab-button {
          padding: 0.75rem 1.5rem;
          border: none;
          background: #e5e7eb;
          border-radius: 0.5rem;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .tab-button.active {
          background: #3b82f6;
          color: white;
        }

        .tab-content {
          display: ${activeTab === 'results' ? 'block' : 'none'};
        }

        .results-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1rem;
        }

        .results-table th {
          background: #3b82f6;
          color: white;
          padding: 1rem;
          text-align: left;
        }

        .results-table td {
          padding: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .rating-cell {
          font-weight: bold;
          color: #ff9800;
        }

        .results-table tr:nth-child(even) {
          background: #f9fafb;
        }

        .results-table tr:hover {
          background: #f3f4f6;
        }

        .browser-not-supported {
          display: flex;
          height: 100vh;
          align-items: center;
          justify-content: center;
          color: #ef4444;
          font-size: 1.25rem;
        }

        .options-container {
          padding: 1rem;
          background: #f0f7ff;
          border-radius: 0.5rem;
          margin-top: 0.5rem;
          display: flex;
          justify-content: center;
          gap: 1rem;
        }

        .option-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .feedback-button {
          background: #fbbf24;
          color: black;
        }

        .feedback-button:hover {
          background: #f59e0b;
        }

        .icon {
          font-size: 1.2rem;
          margin-right: 0.5rem;
        }

        @media (max-width: 768px) {
          .content-wrapper {
            padding: 1rem;
          }

          .title {
            font-size: 2rem;
          }

          .results-table {
            display: block;
            overflow-x: auto;
            white-space: nowrap;
          }
        }
      `}</style>

      <div className="content-wrapper">
        <h1 className="title">Voice-Based Transport Query</h1>

        <div className="controls">
          <button
            onClick={toggleListening}
            className={`button listen-button`}
          >
            {listening ? "Stop Listening" : "Start Listening"}
          </button>
          <button
            onClick={() => {
              resetTranscript();
              setMessage("");
              setBusResults([]);
              setActiveTab("query");
            }}
            className="button reset-button"
          >
            Reset
          </button>
        </div>

        {message && <div className="message">{message}</div>}

        <div className="tabs">
          <TabButton tab="query" label="Query" />
          <TabButton tab="results" label="Results" />
        </div>

        <div className="tab-content">
          {busResults.length > 0 ? (
            <div>
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Bus Number</th>
                    <th>Type</th>
                    <th>Capacity</th>
                    <th>Timing</th>
                    <th>Route</th>
                    <th>Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {busResults.map((bus, index) => (
                    <>
                      <tr 
                        key={index} 
                        onClick={() => handleRowClick(index)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>{bus.Bus_Number}</td>
                        <td>{bus.Bus_Type}</td>
                        <td>{bus.Capacity}</td>
                        <td>{bus.Timing}</td>
                        <td>{bus.Start_Location} → {bus.End_Location}</td>
                        <td className="rating-cell">
                        <StarRating rating={bus.average_rating} />
                        </td>
                      </tr>
                      {selectedBus === index && (
                        <tr>
                          <td colSpan="5">
                            <div className="options-container">
                              <button 
                                onClick={(e) => handleGiveFeedback(bus, e)}
                                className="option-button feedback-button"
                              >
                                <span className="icon">💬</span>
                                Give Feedback
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-500">No results to display</div>
          )}
        </div>
        {showFeedbackForm && selectedBusForFeedback && (
          <FeedbackForm
            bus={selectedBusForFeedback}
            onClose={() => setShowFeedbackForm(false)}
            onSubmit={handleFeedbackSubmit}
          />
        )}
      </div>
    </div>
  );
};


export default Home;