
import React from 'react';
import { Icon } from './Icon';

const messages = [
  "Gem is analyzing environmental data...",
  "Cross-referencing global species database...",
  "Listening for ecological soundscapes...",
  "Simulating habitat location...",
  "Patience, Eco-Scout, great discoveries take time...",
  "Compiling your Sighting Report...",
];

export const Loader: React.FC = () => {
  const [message, setMessage] = React.useState(messages[0]);

  React.useEffect(() => {
    const intervalId = setInterval(() => {
      setMessage(prevMessage => {
        const currentIndex = messages.indexOf(prevMessage);
        const nextIndex = (currentIndex + 1) % messages.length;
        return messages[nextIndex];
      });
    }, 2500);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center text-muted">
      <div className="relative w-24 h-24">
        <Icon name="logo" className="w-full h-full text-primary opacity-50" />
        <div 
          className="absolute inset-0 border-2 border-primary rounded-full"
          style={{ 
            animation: 'spin-pulse 2s cubic-bezier(0.4, 0, 0.2, 1) infinite',
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 50%, 0% 50%)' 
          }}
        ></div>
      </div>
      <p className="mt-8 text-lg font-semibold">{message}</p>
      <style>{`
        @keyframes spin-pulse {
          50% { transform: rotate(180deg); opacity: 0.5; }
          100% { transform: rotate(360deg); opacity: 1; }
        }
      `}</style>
    </div>
  );
};