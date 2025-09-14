
import React from 'react';
import { View, EcoScoutProfile } from '../types';
import { Icon } from './Icon';

interface HeaderProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  onOpenSettings: () => void;
  scoutProfile: EcoScoutProfile;
}

const RANKS_XP: Record<string, number> = {
  'Trainee Scout': 100,
  'Field Ranger': 500,
  'Ecosystem Guardian': 1500,
  'Planet Ambassador': Infinity,
};

const getXpForNextRank = (rank: string) => RANKS_XP[rank] || Infinity;

export const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView, onOpenSettings, scoutProfile }) => {

  const xpForNextRank = getXpForNextRank(scoutProfile.rank);
  const xpProgress = scoutProfile.xp / xpForNextRank * 100;
  
  return (
    <header className="bg-surface/80 backdrop-blur-lg shadow-warm-md sticky top-0 z-10 transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setCurrentView(View.CAPTURE)}
          >
            <Icon name="logo" className="w-10 h-10 text-primary" />
            <h1 className="text-2xl font-bold font-headline text-ink tracking-tight">Echo Location</h1>
          </div>
          
          <div className="hidden md:flex items-center gap-2">
            <Icon name="badge" className="w-6 h-6 text-primary"/>
            <div className="w-48">
                <span className="font-bold text-sm text-ink block">{scoutProfile.rank}</span>
                <div className="w-full bg-outline/20 rounded-full h-1.5 mt-1">
                    <div className="bg-primary h-1.5 rounded-full" style={{width: `${xpProgress}%`}}></div>
                </div>
            </div>
          </div>

          <nav className="flex items-center gap-1 sm:gap-2">
             <button
              onClick={() => setCurrentView(View.HUB)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-muted hover:bg-outline/20 transition-all duration-200"
              title="Global Impact Hub"
            >
              <Icon name="hub" className="w-6 h-6" />
              <span className="font-semibold hidden sm:inline">Hub</span>
            </button>
            <button
              onClick={() => setCurrentView(View.JOURNAL)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-muted hover:bg-outline/20 transition-all duration-200"
              title="Field Journal"
            >
              <Icon name='journal' className="w-6 h-6" />
              <span className="font-semibold hidden sm:inline">
                Field Journal
              </span>
            </button>
            <button
              onClick={onOpenSettings}
              className="p-3 rounded-full text-muted hover:bg-outline/20 transition-all duration-200"
              aria-label="Open voice settings"
            >
              <Icon name="settings" className="w-6 h-6" />
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};