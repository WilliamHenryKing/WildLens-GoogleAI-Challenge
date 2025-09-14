import React, { useState, useEffect } from 'react';
import { getHopeSpotlight } from '../services/geminiService';
import type { HopeSpotlight } from '../types';
import { Icon } from './Icon';

interface HopeSpotlightModalProps {
  isOpen: boolean;
  animalName: string;
  onClose: () => void;
}

export const HopeSpotlightModal: React.FC<HopeSpotlightModalProps> = ({ isOpen, animalName, onClose }) => {
  const [spotlight, setSpotlight] = useState<HopeSpotlight | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && animalName && !spotlight) {
      setIsLoading(true);
      getHopeSpotlight(animalName)
        .then(data => {
            setSpotlight(data);
        })
        .catch(err => {
            console.error(err);
            setSpotlight({ subjectName: animalName, story: "While I couldn't fetch a specific story right now, know that conservation teams worldwide are working tirelessly, and their efforts are making a huge difference every day."});
        })
        .finally(() => {
            setIsLoading(false);
        });
    } else if (!isOpen) {
        // Reset when closed
        setSpotlight(null);
    }
  }, [isOpen, animalName, spotlight]);

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-surface rounded-3xl shadow-warm-xl w-full max-w-lg m-4 transform transition-all animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-gold/20 flex items-center justify-center mb-4">
                <Icon name="sun" className="w-12 h-12 text-gold"/>
            </div>
            <h2 className="text-3xl font-bold font-headline text-ink">A Hope Spotlight!</h2>
            <p className="text-muted mt-2">Learning about endangered animals can be tough. But there is always hope. Here’s a story of a real conservation success.</p>

            <div className="mt-6 text-left p-4 bg-dune/70 rounded-xl min-h-[100px]">
                {isLoading ? (
                     <div className="space-y-2">
                        <div className="h-4 bg-sand rounded w-3/4 animate-pulse"></div>
                        <div className="h-4 bg-sand rounded w-full animate-pulse"></div>
                        <div className="h-4 bg-sand rounded w-5/6 animate-pulse"></div>
                    </div>
                ) : (
                    <p className="text-ink">{spotlight?.story}</p>
                )}
            </div>
        </div>
        <div className="p-4 bg-bg/50 border-t border-outline/30 rounded-b-3xl">
           <button onClick={onClose} className="w-full py-3 px-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary-pressed transition-colors transform active:scale-[0.98]">
              Keep Exploring
            </button>
        </div>
      </div>
    </div>
  );
};
