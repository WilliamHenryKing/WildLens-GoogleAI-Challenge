import React from 'react';
import { Icon } from './Icon';
import type { RangerRank } from '../types';

interface RankUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  newRank: RangerRank;
}

export const RankUpModal: React.FC<RankUpModalProps> = ({ isOpen, onClose, newRank }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-surface rounded-3xl shadow-warm-xl w-full max-w-md m-4 transform transition-all animate-fade-in-up relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 confetti-bg opacity-20"></div>
        <div className="p-8 text-center relative">
            <Icon name="badge" className="w-24 h-24 mx-auto text-primary mb-4" />
            <h2 className="text-3xl font-bold font-headline text-ink">Rank Up!</h2>
            <p className="text-muted mt-2 text-lg">Congratulations, Eco-Scout! You've been promoted to:</p>
            <p className="text-2xl font-bold text-secondary mt-2">{newRank}</p>
            <button 
              onClick={onClose} 
              className="mt-8 w-full py-3 px-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary-pressed transition-colors transform active:scale-[0.98]"
            >
              Awesome!
            </button>
        </div>
      </div>
    </div>
  );
};
