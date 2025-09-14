
import { useState, useEffect, useCallback } from 'react';
import type { EcoScoutProfile, RangerRank, JournalEntry } from '../types';

const PROFILE_STORAGE_KEY = 'echolocation_scout_profile';
const HOPE_SPOTLIGHT_THRESHOLD = 5; // Discover 5 endangered species to unlock

const RANKS: Record<RangerRank, number> = {
  'Trainee Scout': 0,
  'Field Ranger': 100,
  'Ecosystem Guardian': 500,
  'Planet Ambassador': 1500,
};

const getRank = (xp: number): RangerRank => {
  let currentRank: RangerRank = 'Trainee Scout';
  for (const rank in RANKS) {
    if (xp >= RANKS[rank as RangerRank]) {
      currentRank = rank as RangerRank;
    }
  }
  return currentRank;
};

const initialProfile: EcoScoutProfile = {
  xp: 0,
  rank: 'Trainee Scout',
  completedMissions: [],
  endangeredSightingsCount: 0,
  hopeSpotlightsUnlocked: 0,
};

export const useEcoScout = (entries: JournalEntry[]) => {
  const [scoutProfile, setScoutProfile] = useState<EcoScoutProfile>(initialProfile);
  const [hasUnlockedNewHopeSpotlight, setHasUnlockedNewHopeSpotlight] = useState(false);

  useEffect(() => {
    try {
      const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (storedProfile) {
        const loadedProfile = JSON.parse(storedProfile);
        // Recalculate endangered count from journal entries on load to ensure consistency
        const endangeredCount = entries.filter(e => ['VU', 'EN', 'CR'].includes(e.analysis.conservationStatus)).length;
        setScoutProfile({...loadedProfile, endangeredSightingsCount: endangeredCount});
      } else {
         // On first load with entries, calculate initial count
        const endangeredCount = entries.filter(e => ['VU', 'EN', 'CR'].includes(e.analysis.conservationStatus)).length;
        setScoutProfile(prev => ({...prev, endangeredSightingsCount: endangeredCount}));
      }
    } catch (error) {
      console.error("Failed to load scout profile from localStorage", error);
    }
  }, [entries]);

  const saveProfile = useCallback((updatedProfile: EcoScoutProfile) => {
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
      setScoutProfile(updatedProfile);
    } catch (error) {
      console.error("Failed to save scout profile to localStorage", error);
    }
  }, []);

  const addXp = useCallback((amount: number) => {
    setScoutProfile(prev => {
      const newXp = prev.xp + amount;
      const newRank = getRank(newXp);
      const updatedProfile = { ...prev, xp: newXp, rank: newRank };
      saveProfile(updatedProfile);
      return updatedProfile;
    });
  }, [saveProfile]);

  const completeMission = useCallback((missionTitle: string, xp: number) => {
    if (!scoutProfile.completedMissions.includes(missionTitle)) {
      setScoutProfile(prev => {
        const updatedProfile = {
          ...prev,
          completedMissions: [...prev.completedMissions, missionTitle],
        };
        // Add XP after updating missions
        const newXp = updatedProfile.xp + xp;
        updatedProfile.xp = newXp;
        updatedProfile.rank = getRank(newXp);
        
        saveProfile(updatedProfile);
        return updatedProfile;
      });
    }
  }, [scoutProfile.completedMissions, saveProfile]);

  const unlockHopeSpotlight = useCallback(() => {
      setScoutProfile(prev => {
        const newCount = prev.endangeredSightingsCount + 1;
        const newUnlocks = Math.floor(newCount / HOPE_SPOTLIGHT_THRESHOLD);
        
        if (newUnlocks > prev.hopeSpotlightsUnlocked) {
            setHasUnlockedNewHopeSpotlight(true);
        }

        const updatedProfile = {
            ...prev,
            endangeredSightingsCount: newCount,
            hopeSpotlightsUnlocked: newUnlocks
        };
        saveProfile(updatedProfile);
        return updatedProfile;
    });
  }, [saveProfile]);

  const resetProfile = useCallback(() => {
    try {
      localStorage.removeItem(PROFILE_STORAGE_KEY);
      setScoutProfile(initialProfile);
    } catch (error) {
      console.error("Failed to reset scout profile in localStorage", error);
    }
  }, []);
  

  return { scoutProfile, addXp, completeMission, unlockHopeSpotlight, hasUnlockedNewHopeSpotlight, setHasUnlockedNewHopeSpotlight, resetProfile };
};