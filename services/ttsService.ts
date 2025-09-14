
import type { VoiceProfile } from '../types';

const TTS_VOICE_PROFILE_KEY = 'wildlens_voice_profile';

const VOICE_PROFILES: VoiceProfile[] = [
  {
    id: 'gem-default',
    name: 'Gem',
    description: 'Friendly and knowledgeable guide.',
    settings: { pitch: 1, rate: 1 },
  },
  {
    id: 'professor-pip',
    name: 'Professor Pip',
    description: 'Deep, wise, and thoughtful.',
    settings: { pitch: 0.7, rate: 0.9 },
  },
  {
    id: 'zippy-chipmunk',
    name: 'Zippy',
    description: 'Excitable, fast, and high-pitched!',
    settings: { pitch: 1.8, rate: 1.5 },
  },
  {
    id: 'echo-elder',
    name: 'Echo the Elder',
    description: 'A slow, calm, and resonant voice.',
    settings: { pitch: 0.4, rate: 0.7 },
  },
  {
    id: 'sparky-squirrel',
    name: 'Sparky',
    description: 'Quirky, fun, and a little goofy.',
    settings: { pitch: 1.4, rate: 1.2 },
  },
];

class TTSService {
  private synth: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  private selectedProfileId: string = VOICE_PROFILES[0].id;

  constructor() {
    this.synth = window.speechSynthesis;
    this.loadVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = this.loadVoices;
    }
    this.loadSelectedProfile();
  }

  private loadVoices = () => {
    this.voices = this.synth.getVoices();
  };

  private loadSelectedProfile() {
    try {
      const storedId = localStorage.getItem(TTS_VOICE_PROFILE_KEY);
      if (storedId && VOICE_PROFILES.some(p => p.id === storedId)) {
        this.selectedProfileId = storedId;
      }
    } catch (error) {
      console.error("Failed to load voice profile from localStorage", error);
    }
  }

  public getAvailableProfiles = (): VoiceProfile[] => {
    return VOICE_PROFILES;
  }

  public getSelectedProfile = (): VoiceProfile => {
    return VOICE_PROFILES.find(p => p.id === this.selectedProfileId) || VOICE_PROFILES[0];
  }

  public setSelectedProfile = (profileId: string): void => {
    if (VOICE_PROFILES.some(p => p.id === profileId)) {
      this.selectedProfileId = profileId;
      try {
        localStorage.setItem(TTS_VOICE_PROFILE_KEY, profileId);
      } catch (error) {
        console.error("Failed to save voice profile to localStorage", error);
      }
    }
  }

  public speak(text: string, onEnd?: () => void, profileIdOverride?: string): void {
    if (this.synth.speaking) {
      this.synth.cancel();
    }
    if (text !== '') {
      const utterance = new SpeechSynthesisUtterance(text);
      
      const profileToUse = profileIdOverride
        ? VOICE_PROFILES.find(p => p.id === profileIdOverride) || this.getSelectedProfile()
        : this.getSelectedProfile();

      // A simple attempt to find a warm, natural voice
      const preferredVoice = this.voices.find(voice => 
        voice.name.includes('Google') && voice.lang.startsWith('en')
      ) || this.voices.find(voice => voice.lang.startsWith('en-US') && !voice.name.includes('male'));
      
      utterance.voice = preferredVoice || this.voices.find(voice => voice.default) || null;
      utterance.pitch = profileToUse.settings.pitch;
      utterance.rate = profileToUse.settings.rate;
      utterance.onend = () => {
        if (onEnd) {
          onEnd();
        }
      };
      this.synth.speak(utterance);
    }
  }

  public cancel(): void {
    this.synth.cancel();
  }
}

export const ttsService = new TTSService();
