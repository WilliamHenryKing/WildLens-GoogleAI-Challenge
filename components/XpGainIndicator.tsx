import React from 'react';

interface XpGainIndicatorProps {
  amount: number;
}

export const XpGainIndicator: React.FC<XpGainIndicatorProps> = ({ amount }) => {
  return (
    <div 
      className="fixed top-12 right-24 z-50 pointer-events-none"
      aria-live="polite"
    >
      <div className="xp-gain-indicator bg-gold/90 text-white font-bold text-sm px-3 py-1 rounded-full shadow-lg backdrop-blur-sm">
        +{amount} XP
      </div>
    </div>
  );
};
