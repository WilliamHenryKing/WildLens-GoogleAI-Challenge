

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { CaptureView } from './components/CaptureView';
import { ExplorerCard } from './components/ExplorerCard';
import { JournalView } from './components/JournalView';
import { HubView } from './components/HubView';
import { Loader } from './components/Loader';
import { SettingsModal } from './components/SettingsModal';
import { Icon } from './components/Icon';
import { HopeSpotlightModal } from './components/HopeSpotlightModal';
import { RankUpModal } from './components/RankUpModal';
import { XpGainIndicator } from './components/XpGainIndicator';
import { useJournal } from './hooks/useJournal';
import { useEcoScout } from './hooks/useEcoScout';
import { analyzeMedia, getAnimalPalCheckIn } from './services/geminiService';
import type { AnalysisResult, JournalEntry, HopeSpotlight } from './types';
import { View } from './types';

const WelcomeBanner: React.FC<{ message: string; onDismiss: () => void; }> = ({ message, onDismiss }) => {
  return (
    <div className="w-full max-w-3xl bg-primary/10 border-2 border-primary/20 rounded-2xl p-4 mb-6 flex items-start gap-4 animate-fade-in-down">
      <div className="flex-shrink-0 pt-1">
        <Icon name="logo" className="w-8 h-8 text-primary" />
      </div>
      <div className="flex-grow">
        <p className="text-ink font-medium">{message}</p>
      </div>
      <button onClick={onDismiss} className="p-2 rounded-full hover:bg-primary/20" aria-label="Dismiss message">
        <Icon name="close" className="w-5 h-5 text-primary" />
      </button>
    </div>
  );
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.CAPTURE);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<{ mediaFile: File; analysis: AnalysisResult } | null>(null);
  const { entries, addEntry, removeEntry, updateEntryChatHistory, clearJournal } = useJournal();
  const { scoutProfile, addXp, completeMission, unlockHopeSpotlight, hasUnlockedNewHopeSpotlight, setHasUnlockedNewHopeSpotlight, resetProfile } = useEcoScout(entries);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null);
  const [hasFetchedCheckin, setHasFetchedCheckin] = useState(false);
  const [hopeSpotlight, setHopeSpotlight] = useState<HopeSpotlight | null>(null);
  
  // Polish feature states
  const [isRankUpModalOpen, setIsRankUpModalOpen] = useState(false);
  const [xpGain, setXpGain] = useState<{ amount: number; key: number } | null>(null);
  const prevRankRef = useRef(scoutProfile.rank);
  const isInitialMount = useRef(true);


  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>(() => {
    return (localStorage.getItem('echolocation_theme') as 'light' | 'dark' | 'auto') || 'auto';
  });
  
  const [autoPlayNarration, setAutoPlayNarration] = useState<boolean>(() => {
    const saved = localStorage.getItem('echolocation_autoplay');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('echolocation_theme', theme);
    
    const applyTheme = () => {
      if (theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
      } else {
        document.documentElement.setAttribute('data-theme', theme);
      }
    };

    applyTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'auto') {
        applyTheme();
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('echolocation_autoplay', JSON.stringify(autoPlayNarration));
  }, [autoPlayNarration]);

  // Effect to trigger Rank Up modal
  useEffect(() => {
    if (isInitialMount.current) {
        isInitialMount.current = false;
    } else {
        if (prevRankRef.current !== scoutProfile.rank) {
            setIsRankUpModalOpen(true);
        }
    }
    prevRankRef.current = scoutProfile.rank;
  }, [scoutProfile.rank]);

  const triggerAddXp = useCallback((amount: number) => {
    addXp(amount);
    setXpGain({ amount, key: Date.now() });
  }, [addXp]);

  useEffect(() => {
    if (xpGain) {
        const timer = setTimeout(() => setXpGain(null), 1500); // Corresponds to animation duration
        return () => clearTimeout(timer);
    }
  }, [xpGain]);
  
  useEffect(() => {
    if(hasUnlockedNewHopeSpotlight) {
      const endangeredPals = entries.filter(e => e.isPal && ['VU', 'EN', 'CR'].includes(e.analysis.conservationStatus));
      if(endangeredPals.length > 0) {
        const lastPal = endangeredPals[0];
        setHopeSpotlight({
          subjectName: lastPal.analysis.subjectName
        });
      }
    }
  }, [hasUnlockedNewHopeSpotlight, entries]);


  useEffect(() => {
    // Only run once when entries are loaded and we haven't fetched yet
    if (entries.length > 0 && !hasFetchedCheckin) {
        const pals = entries.filter(e => e.isPal);
        if (pals.length > 0) {
            const randomPal = pals[Math.floor(Math.random() * pals.length)];
            setHasFetchedCheckin(true); // Set flag to prevent re-fetching
            getAnimalPalCheckIn(randomPal.analysis.subjectName)
                .then(message => setWelcomeMessage(message))
                .catch(err => console.error("Failed to get animal pal check-in:", err));
        }
    } else if (entries.length === 0 && !hasFetchedCheckin) {
      setWelcomeMessage("Welcome, Eco-Scout! The planet needs our help to listen to its stories. Your photos, videos, and sounds are valuable data. Let's start our first field mission.");
      setHasFetchedCheckin(true);
    }
  }, [entries, hasFetchedCheckin]);

  const handleFileUpload = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    setCurrentAnalysis(null);
    try {
      const result = await analyzeMedia(file);
      if (result.isAnimalOrPlant) {
        setCurrentAnalysis({ mediaFile: file, analysis: result });
        setCurrentView(View.EXPLORER);
      } else {
        setError(result.description);
        setCurrentView(View.CAPTURE);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during analysis.');
      setCurrentView(View.CAPTURE);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSaveToJournal = useCallback(async (mediaFile: File, analysis: AnalysisResult, isPal: boolean) => {
    const reader = new FileReader();
    reader.readAsDataURL(mediaFile);
    reader.onload = () => {
      const newEntry: Omit<JournalEntry, 'id'> = {
        date: new Date().toISOString(),
        media: {
          dataUrl: reader.result as string,
          type: mediaFile.type,
        },
        analysis,
        isPal,
      };
      addEntry(newEntry);
      triggerAddXp(10); // Award XP for a new sighting
      if (['VU', 'EN', 'CR'].includes(analysis.conservationStatus)) {
          unlockHopeSpotlight();
      }
      setCurrentView(View.JOURNAL);
    };
    reader.onerror = () => {
       setError("Could not save the file to the journal.");
    }
  }, [addEntry, triggerAddXp, unlockHopeSpotlight]);

  const handleMissionComplete = (xp: number) => {
    triggerAddXp(xp);
  };
  
  const handleCloseHopeSpotlight = () => {
    setHopeSpotlight(null);
    setHasUnlockedNewHopeSpotlight(false);
  }

  const handleClearJournal = () => {
    clearJournal();
    resetProfile(); // Clearing the journal also resets profile progress.
  };

  const handleResetProfile = () => {
    resetProfile();
  };

  const renderContent = () => {
    if (isLoading) {
      return <Loader />;
    }

    switch (currentView) {
      case View.JOURNAL:
        return <JournalView entries={entries} removeEntry={removeEntry} updateEntryChatHistory={updateEntryChatHistory} />;
      case View.HUB:
        return <HubView entries={entries} />;
      case View.EXPLORER:
        if (currentAnalysis) {
          return (
            <ExplorerCard 
              mediaFile={currentAnalysis.mediaFile} 
              analysis={currentAnalysis.analysis} 
              onSave={(isPal: boolean) => handleSaveToJournal(currentAnalysis.mediaFile, currentAnalysis.analysis, isPal)}
              onBack={() => {
                setCurrentAnalysis(null);
                setCurrentView(View.CAPTURE);
              }}
              onMissionComplete={handleMissionComplete}
              scoutProfile={scoutProfile}
              autoPlayNarration={autoPlayNarration}
            />
          );
        }
        return <CaptureView onFileUpload={handleFileUpload} error={error} />;
      case View.CAPTURE:
      default:
        return <CaptureView onFileUpload={handleFileUpload} error={error} />;
    }
  };

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col">
      <Header 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        onOpenSettings={() => setIsSettingsOpen(true)}
        scoutProfile={scoutProfile}
      />
      {xpGain && <XpGainIndicator key={xpGain.key} amount={xpGain.amount} />}
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-start">
         {currentView === View.CAPTURE && welcomeMessage && (
            <WelcomeBanner message={welcomeMessage} onDismiss={() => setWelcomeMessage(null)} />
        )}
        {renderContent()}
      </main>
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        setTheme={setTheme}
        autoPlayNarration={autoPlayNarration}
        setAutoPlayNarration={setAutoPlayNarration}
        onClearJournal={handleClearJournal}
        onResetProfile={handleResetProfile}
      />
      <HopeSpotlightModal
        isOpen={!!hopeSpotlight}
        animalName={hopeSpotlight?.subjectName || ''}
        onClose={handleCloseHopeSpotlight}
      />
      <RankUpModal
        isOpen={isRankUpModalOpen}
        onClose={() => setIsRankUpModalOpen(false)}
        newRank={scoutProfile.rank}
      />
    </div>
  );
};

export default App;