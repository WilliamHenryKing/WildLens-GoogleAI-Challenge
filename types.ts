

export enum View {
  CAPTURE = 'capture',
  EXPLORER = 'explorer', // This is the "Field Report" view
  JOURNAL = 'journal',
  HUB = 'hub', // Global Impact Hub
}

export interface FieldMission {
  title: string;
  description: string;
  type: 'plasticPatrol' | 'pollinatorPledge' | 'artForAwareness' | 'general';
  emoji: string;
  xp: number; // XP reward for completion
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface AnalysisResult {
  isAnimalOrPlant: boolean;
  subjectName: string;
  description: string; // This is now the narrative part
  // New conservation data
  conservationStatus: 'LC' | 'NT' | 'VU' | 'EN' | 'CR' | 'EW' | 'EX' | 'DD' | 'NE'; // IUCN codes
  populationTrend: 'Increasing' | 'Decreasing' | 'Stable' | 'Unknown';
  primaryThreats: string[];
  estimatedLocation: string; // Text description of location
  ecosystem: string; // e.g., "Amazon Rainforest"
  coordinates: Coordinates; // For the map
  suggestedMissions: FieldMission[];
}


export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface JournalEntry {
  id: string;
  date: string;
  media: {
    dataUrl: string;
    type: string;
  };
  analysis: AnalysisResult;
  isPal?: boolean;
  chatHistory?: ChatMessage[];
}

// New types for gamification
export type RangerRank = 'Trainee Scout' | 'Field Ranger' | 'Ecosystem Guardian' | 'Planet Ambassador';

export interface EcoScoutProfile {
  rank: RangerRank;
  xp: number;
  completedMissions: string[]; // Store titles of completed missions
  endangeredSightingsCount: number;
  hopeSpotlightsUnlocked: number;
}


export interface VoiceProfile {
  id: string;
  name: string;
  description: string;
  settings: {
    pitch: number;
    rate: number;
  };
}

export interface EcosystemSubject {
  name:string;
  description: string;
  emoji: string;
}

export interface EcosystemAnalysis {
  subjects: EcosystemSubject[];
  summary: string;
}

export interface AncestralEcho {
  ancestorName: string;
  description: string;
  imageDataUrl: string;
}

export interface HopeSpotlight {
  subjectName: string;
  story?: string;
}
