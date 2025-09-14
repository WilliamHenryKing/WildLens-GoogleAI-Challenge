import React, { useState, useEffect, useRef } from 'react';
import type { JournalEntry, ChatMessage } from '../types';
import { Icon } from './Icon';
import { getAnimalChatResponse } from '../services/geminiService';
import { ttsService } from '../services/ttsService';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import SoundWaveAnimation from './SoundWaveAnimation';

interface AnimalChatModalProps {
  isOpen: boolean;
  animal: JournalEntry | null;
  onClose: () => void;
  onUpdateHistory: (id: string, newHistory: ChatMessage[]) => void;
}

const TypingIndicator = () => (
  <div className="flex items-center space-x-1.5">
    <div className="w-2 h-2 bg-muted rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="w-2 h-2 bg-muted rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="w-2 h-2 bg-muted rounded-full animate-bounce"></div>
  </div>
);

export const AnimalChatModal: React.FC<AnimalChatModalProps> = ({ isOpen, animal, onClose, onUpdateHistory }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [playingMessageIndex, setPlayingMessageIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isListening, transcript, startListening, hasSupport } = useSpeechRecognition();

  useEffect(() => {
    if (animal?.chatHistory) {
      setMessages(animal.chatHistory);
    } else {
      setMessages([]);
    }
  }, [animal]);
  
  useEffect(() => {
    if (transcript) {
        setUserInput(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleClose = () => {
    ttsService.cancel();
    setPlayingMessageIndex(null);
    onClose();
  };

  const handlePlayAudio = (text: string, index: number) => {
    if (playingMessageIndex === index) {
      ttsService.cancel();
      setPlayingMessageIndex(null);
    } else {
      ttsService.speak(text, () => setPlayingMessageIndex(null));
      setPlayingMessageIndex(index);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || !animal) return;

    const userMessage: ChatMessage = { role: 'user', parts: [{ text: userInput.trim() }] };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setUserInput('');
    setIsTyping(true);
    ttsService.cancel();
    setPlayingMessageIndex(null);

    try {
      const aiResponseText = await getAnimalChatResponse(
        animal.analysis.subjectName,
        animal.analysis.description,
        newMessages.map(m => ({...m, parts: m.parts.map(p => ({text: p.text}))})), // Ensure correct format
        userInput.trim()
      );
      
      const aiMessage: ChatMessage = { role: 'model', parts: [{ text: aiResponseText }] };
      const finalMessages = [...newMessages, aiMessage];
      
      setMessages(finalMessages);
      onUpdateHistory(animal.id, finalMessages);
      
      ttsService.speak(aiResponseText, () => setPlayingMessageIndex(null));
      setPlayingMessageIndex(finalMessages.length - 1);

    } catch (error) {
      console.error("Failed to get chat response:", error);
      const errorMessage: ChatMessage = { role: 'model', parts: [{ text: "I'm a little sleepy and can't talk right now. Try again later!" }] };
      const finalMessages = [...newMessages, errorMessage];
      setMessages(finalMessages);
      onUpdateHistory(animal.id, finalMessages);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen || !animal) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-surface rounded-3xl shadow-warm-xl w-full max-w-lg h-[80vh] m-4 flex flex-col transform transition-all animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-outline/30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Icon name="chatBubble" className="w-8 h-8 text-primary" />
            <h2 className="text-xl font-bold font-headline text-ink">Chat with {animal.analysis.subjectName}</h2>
          </div>
          <button onClick={handleClose} className="p-2 rounded-full hover:bg-outline/20 transition-colors" aria-label="Close chat">
            <Icon name="close" className="w-6 h-6 text-muted" />
          </button>
        </div>
        
        <div className="flex-grow p-4 overflow-y-auto custom-scrollbar">
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'model' && <div className="flex-shrink-0 w-8 h-8 bg-dune rounded-full flex items-center justify-center text-primary"><Icon name="logo" className="w-5 h-5"/></div>}
                <div className={`max-w-[70%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-primary text-white rounded-br-lg' : 'bg-dune text-ink rounded-bl-lg'}`}>
                  <p className="text-base">{msg.parts[0].text}</p>
                </div>
                {msg.role === 'model' && (
                  <button 
                      onClick={() => handlePlayAudio(msg.parts[0].text, index)}
                      className="p-2 rounded-full hover:bg-outline/20 transition-colors text-muted w-10 h-10 flex items-center justify-center self-center flex-shrink-0"
                      aria-label="Play message audio"
                  >
                      {playingMessageIndex === index 
                          ? <SoundWaveAnimation isPlaying={true} /> 
                          : <Icon name="volumeOn" className="w-5 h-5" />
                      }
                  </button>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex items-end gap-2 justify-start">
                <div className="flex-shrink-0 w-8 h-8 bg-dune rounded-full flex items-center justify-center text-primary"><Icon name="logo" className="w-5 h-5"/></div>
                <div className="max-w-xs md:max-w-md p-3 rounded-2xl bg-dune text-ink rounded-bl-lg">
                  <TypingIndicator />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="p-4 border-t border-outline/30 flex-shrink-0">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask a question..."
              className="w-full py-3 px-4 rounded-xl bg-bg border-2 border-outline/30 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
              disabled={isTyping || isListening}
            />
            {hasSupport && (
                <button
                    type="button"
                    onClick={isListening ? () => {} : startListening}
                    className={`p-3 rounded-full transition-colors flex-shrink-0 ${
                        isListening 
                        ? 'bg-secondary/20 text-secondary animate-pulse' 
                        : 'bg-dune hover:bg-outline/20'
                    }`}
                    aria-label="Use microphone"
                    disabled={isTyping}
                >
                    <Icon name="microphone" className="w-6 h-6" />
                </button>
            )}
            <button
              type="submit"
              className="p-3 rounded-full bg-primary text-white hover:bg-primary-pressed transition-colors disabled:bg-sand flex-shrink-0"
              aria-label="Send message"
              disabled={!userInput.trim() || isTyping || isListening}
            >
              <Icon name="send" className="w-6 h-6" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};