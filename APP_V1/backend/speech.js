import React, { useState, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import axios from 'axios';

const SpeechRecognitionComponent = () => {
  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();
  const [message, setMessage] = useState('');

  useEffect(() => {
    const saveTranscript = async () => {
      try {
        if (!transcript || listening) return;

        const response = await axios.post('http://localhost:3000/save-transcription', {
          user_id: '1', // Replace with actual user ID
          command_text: transcript,
        });
        setMessage(`Transcription saved successfully: ${response.data.document_id}`);
        resetTranscript();
      } catch (error) {
        console.error('Error saving transcription:', error);
        setMessage('Error saving transcription: ' + error.message);
      }
    };

    saveTranscript();
  }, [transcript, listening]);

  if (!browserSupportsSpeechRecognition) {
    return <p>Browser doesn't support speech recognition.</p>;
  }

  return (
    <div>
      <button onClick={SpeechRecognition.startListening}>Start</button>
      <button onClick={SpeechRecognition.stopListening}>Stop</button>
      <button onClick={resetTranscript}>Reset</button>
      <p>{listening ? 'Listening...' : 'Click "Start" to begin'}</p>
      <p>Transcript: {transcript}</p>
      <p>{message}</p>
    </div>
  );
};

export default SpeechRecognitionComponent;
