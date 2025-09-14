
import React, { useState, useEffect } from 'react';
import { ttsService } from '../services/ttsService';
import type { VoiceProfile } from '../types';
import { Icon } from './Icon';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark' | 'auto';
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  autoPlayNarration: boolean;
  setAutoPlayNarration: (enabled: boolean) => void;
  onClearJournal: () => void;
  onResetProfile: () => void;
}

const SettingsSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="py-4">
    <h3 className="text-sm font-semibold text-muted uppercase tracking-wider px-6 pb-2">{title}</h3>
    {children}
  </div>
);

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, onClose, theme, setTheme, autoPlayNarration, setAutoPlayNarration, onClearJournal, onResetProfile
}) => {
  const profiles = ttsService.getAvailableProfiles();
  const [selectedProfileId, setSelectedProfileId] = useState(ttsService.getSelectedProfile().id);

  useEffect(() => {
    // Sync state if it's changed elsewhere or on first open
    setSelectedProfileId(ttsService.getSelectedProfile().id);
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSelectProfile = (profile: VoiceProfile) => {
    setSelectedProfileId(profile.id);
    ttsService.setSelectedProfile(profile.id);
  };

  const handleTestVoice = (e: React.MouseEvent, profile: VoiceProfile) => {
    e.stopPropagation(); // prevent selection when clicking test button
    ttsService.speak(`Hello, my name is ${profile.name}. This is a test of my voice.`, undefined, profile.id);
  };
  
  const handleClose = () => {
    ttsService.cancel(); // Stop any test speech
    onClose();
  };

  const handleClearJournalClick = () => {
    if (window.confirm("Are you sure you want to permanently delete all journal entries? This action cannot be undone and will also reset your Eco-Scout profile.")) {
        onClearJournal();
        onClose(); // Close modal after action
    }
  };

  const handleResetProfileClick = () => {
    if (window.confirm("Are you sure you want to reset your Eco-Scout profile? Your rank, XP, and mission progress will be lost. This cannot be undone.")) {
        onResetProfile();
        onClose(); // Close modal after action
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-surface rounded-3xl shadow-warm-xl w-full max-w-lg m-4 flex flex-col max-h-[90vh] transform transition-all animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-outline/30 flex-shrink-0">
          <h2 className="text-2xl font-bold font-headline text-ink">Settings</h2>
          <button onClick={handleClose} className="p-2 rounded-full hover:bg-outline/20 transition-colors" aria-label="Close settings">
            <Icon name="close" className="w-6 h-6 text-muted" />
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto custom-scrollbar">
          {/* Display Section */}
          <SettingsSection title="Display">
            <div className="px-6">
              <label className="block font-medium text-ink mb-2">Theme</label>
              <div className="flex bg-dune p-1 rounded-xl">
                {(['Light', 'Dark', 'Auto'] as const).map(t => {
                  const value = t.toLowerCase() as 'light' | 'dark' | 'auto';
                  return (
                    <button 
                      key={value}
                      onClick={() => setTheme(value)}
                      className={`w-full py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${
                        theme === value ? 'bg-surface text-primary shadow-sm' : 'text-muted hover:bg-surface/50'
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          </SettingsSection>

          {/* Voice & Audio Section */}
          <SettingsSection title="Voice & Audio">
            <div className="px-6 flex justify-between items-center py-2">
                <div>
                    <label htmlFor="autoplay-toggle" className="font-medium text-ink">Auto-Play Narrations</label>
                    <p className="text-sm text-muted">Automatically play Gem's Sighting Report narration.</p>
                </div>
                <button
                    id="autoplay-toggle"
                    role="switch"
                    aria-checked={autoPlayNarration}
                    onClick={() => setAutoPlayNarration(!autoPlayNarration)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        autoPlayNarration ? 'bg-primary' : 'bg-outline'
                    }`}
                >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        autoPlayNarration ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                </button>
            </div>
             <div className="px-6 pt-4">
              <label className="block font-medium text-ink mb-2">AI Guide Voice</label>
              <div className="space-y-2">
                {profiles.map(profile => (
                  <div
                    key={profile.id}
                    onClick={() => handleSelectProfile(profile)}
                    className={`p-4 border-2 rounded-2xl cursor-pointer transition-all ${
                      selectedProfileId === profile.id
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                        : 'border-outline/30 bg-bg hover:border-outline'
                    }`}
                    role="radio"
                    aria-checked={selectedProfileId === profile.id}
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelectProfile(profile); }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-ink">{profile.name}</h3>
                        <p className="text-sm text-muted">{profile.description}</p>
                      </div>
                      <button 
                        onClick={(e) => handleTestVoice(e, profile)}
                        className="py-1 px-3 rounded-lg bg-dune text-ink text-sm font-medium hover:bg-outline/20 transition-colors"
                        aria-label={`Test voice for ${profile.name}`}
                      >
                        Test
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SettingsSection>

          {/* Data Management Section */}
          <SettingsSection title="Data Management">
            <div className="mx-4 p-4 rounded-2xl bg-danger-surface border border-danger/50">
                <div className="flex items-start gap-3">
                    <Icon name="warning" className="w-6 h-6 text-danger flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-danger">Danger Zone</h4>
                        <p className="text-sm text-danger/80 mt-1">These actions are permanent and cannot be undone.</p>
                    </div>
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button onClick={handleClearJournalClick} className="w-full py-2 px-3 rounded-lg bg-danger/10 border border-danger/80 text-danger font-semibold hover:bg-danger hover:text-white transition-colors">
                        Clear Field Journal
                    </button>
                    <button onClick={handleResetProfileClick} className="w-full py-2 px-3 rounded-lg bg-danger/10 border border-danger/80 text-danger font-semibold hover:bg-danger hover:text-white transition-colors">
                        Reset Eco-Scout Profile
                    </button>
                </div>
            </div>
          </SettingsSection>

           {/* About Section */}
          <SettingsSection title="About">
            <div className="px-6 text-sm text-muted">
                <p>Echo Location is powered by Google's Gemini AI to provide intelligent wildlife analysis and create an engaging learning experience. All data is simulated for a safe and inspiring adventure.</p>
            </div>
          </SettingsSection>

        </div>
      </div>
    </div>
  );
};
