

import { useState, useEffect, useRef } from 'react';

// The Web Speech API is not fully standardized and not available in all browsers.
// TypeScript's default typings may not include it. We define the part of the
// interface that we use to ensure the code compiles.
interface SpeechRecognition {
  continuous: boolean;
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onend: () => void;
  start(): void;
  stop(): void;
}

// Check for vendor-prefixed SpeechRecognition
// FIX: Cast window to `any` to access non-standard properties and rename the constant to avoid name collision with the global SpeechRecognition type.
const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  // FIX: Added a local SpeechRecognition interface definition to resolve the type error.
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (!SpeechRecognitionAPI) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition: SpeechRecognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const currentTranscript = event.results[0][0].transcript;
      setTranscript(currentTranscript);
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') {
        setError('No speech was detected. Please try again.');
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setError(null);
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };
  
  const hasSupport = !!SpeechRecognitionAPI;

  return { isListening, transcript, error, startListening, stopListening, hasSupport };
};
