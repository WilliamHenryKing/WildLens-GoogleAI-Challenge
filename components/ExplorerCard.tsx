
import React, { useState, useEffect, useMemo } from 'react';
import type { AnalysisResult, FieldMission, EcoScoutProfile } from '../types';
import { ttsService } from '../services/ttsService';
import { Icon } from './Icon';
import SoundWaveAnimation from './SoundWaveAnimation';

interface ExplorerCardProps {
  mediaFile: File;
  analysis: AnalysisResult;
  onSave: (isPal: boolean) => void;
  onBack: () => void;
  onMissionComplete: (xp: number) => void;
  scoutProfile: EcoScoutProfile;
  autoPlayNarration: boolean;
}

const MediaPreview: React.FC<{ file: File }> = React.memo(({ file }) => {
  const objectUrl = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(objectUrl), [objectUrl]);

  if (file.type.startsWith('image/')) return <img src={objectUrl} alt="Sighting report media" className="w-full h-full object-cover" />;
  if (file.type.startsWith('video/')) return <video src={objectUrl} controls className="w-full h-full object-cover" />;
  if (file.type.startsWith('audio/')) return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-dune">
      <Icon name="audio" className="w-24 h-24 text-muted mb-4" />
      <audio src={objectUrl} controls className="w-full max-w-xs" />
    </div>
  );
  return <div className="text-center p-4">Unsupported file type</div>;
});

const CONSERVATION_STATUS_MAP: Record<string, { label: string; color: string; bgColor: string; }> = {
    CR: { label: 'Critically Endangered', color: 'text-red-800 dark:text-red-200', bgColor: 'bg-red-200 dark:bg-red-800/50' },
    EN: { label: 'Endangered', color: 'text-orange-800 dark:text-orange-200', bgColor: 'bg-orange-200 dark:bg-orange-800/50' },
    VU: { label: 'Vulnerable', color: 'text-yellow-800 dark:text-yellow-200', bgColor: 'bg-yellow-200 dark:bg-yellow-800/50' },
    NT: { label: 'Near Threatened', color: 'text-lime-800 dark:text-lime-200', bgColor: 'bg-lime-200 dark:bg-lime-800/50' },
    LC: { label: 'Least Concern', color: 'text-green-800 dark:text-green-200', bgColor: 'bg-green-200 dark:bg-green-800/50' },
    DD: { label: 'Data Deficient', color: 'text-gray-800 dark:text-gray-200', bgColor: 'bg-gray-200 dark:bg-gray-800/50' },
    NE: { label: 'Not Evaluated', color: 'text-gray-800 dark:text-gray-200', bgColor: 'bg-gray-200 dark:bg-gray-800/50' },
};

const VitalSign: React.FC<{ icon: any; label: string; value: React.ReactNode; }> = ({ icon, label, value }) => (
    <div className="flex items-start gap-3">
        <Icon name={icon} className="w-5 h-5 text-primary flex-shrink-0 mt-1"/>
        <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">{label}</p>
            <div className="text-base font-medium text-ink">{value}</div>
        </div>
    </div>
);

export const ExplorerCard: React.FC<ExplorerCardProps> = ({ mediaFile, analysis, onSave, onBack, onMissionComplete, scoutProfile, autoPlayNarration }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (autoPlayNarration) {
        ttsService.speak(`Sighting confirmed. ${analysis.subjectName}. ${analysis.description}`, () => setIsSpeaking(false));
        setIsSpeaking(true);
    }
    return () => ttsService.cancel();
  }, [analysis, autoPlayNarration]);

  const handleSpeakerClick = () => {
    if (isSpeaking) {
      ttsService.cancel();
      setIsSpeaking(false);
    } else {
      ttsService.speak(analysis.description, () => setIsSpeaking(false));
      setIsSpeaking(true);
    }
  };

  const handleCompleteMission = (mission: FieldMission) => {
    onMissionComplete(mission.xp);
  };

  const status = CONSERVATION_STATUS_MAP[analysis.conservationStatus] || CONSERVATION_STATUS_MAP['NE'];

  return (
    <div className="w-full max-w-6xl bg-surface rounded-3xl shadow-warm-xl overflow-hidden flex flex-col lg:flex-row field-report-glow">
      <div className="lg:w-2/5 w-full h-80 lg:h-auto bg-dune rounded-t-3xl lg:rounded-l-3xl lg:rounded-tr-none overflow-hidden">
        <MediaPreview file={mediaFile} />
      </div>
      <div className="lg:w-3/5 w-full p-6 sm:p-8 flex flex-col field-report-bg">
        <div className="flex justify-between items-start gap-4">
            <div>
                <p className="text-sm font-bold text-primary uppercase tracking-widest">Sighting Report</p>
                <h2 className="text-4xl font-bold font-headline text-ink">{analysis.subjectName}</h2>
            </div>
            <button onClick={handleSpeakerClick} className="p-3 rounded-full hover:bg-outline/20 transition-colors text-muted w-14 h-12 flex items-center justify-center flex-shrink-0">
              {isSpeaking ? <SoundWaveAnimation isPlaying={isSpeaking} /> : <Icon name={'volumeOn'} className="w-6 h-6"/>}
            </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mt-4 p-4 bg-dune/50 rounded-2xl border border-outline/20">
            <VitalSign icon="badge" label="Conservation Status" value={<span className={`px-2 py-0.5 rounded-md text-sm ${status.color} ${status.bgColor}`}>{status.label}</span>} />
            <VitalSign icon="history" label="Population Trend" value={analysis.populationTrend} />
            <VitalSign icon="hub" label="Simulated Location" value={analysis.estimatedLocation} />
            <VitalSign icon="ecosystem" label="Primary Threats" value={analysis.primaryThreats.join(', ')} />
        </div>

        <div className="flex-grow overflow-y-auto max-h-[200px] lg:max-h-none my-4 pr-3 text-base text-muted leading-relaxed custom-scrollbar">
            <p>{analysis.description}</p>
        </div>
        
        <div className="mt-auto pt-4 border-t-2 border-primary/20">
            <h3 className="font-bold text-lg font-headline text-ink mb-3 flex items-center gap-2">
                <Icon name="journal" className="w-5 h-5 text-primary"/>
                Field Missions
            </h3>
            <div className="space-y-2">
                {analysis.suggestedMissions.map((mission) => {
                    const isCompleted = scoutProfile.completedMissions.includes(mission.title);
                    return (
                        <div key={mission.title} className={`p-3 rounded-xl transition-all ${isCompleted ? 'bg-primary/20' : 'bg-dune/60'}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-ink">
                                        <span className="mr-2">{mission.emoji}</span>
                                        {mission.title}
                                    </p>
                                    <p className="text-sm text-muted pl-7">{mission.description}</p>
                                </div>
                                <button
                                    onClick={() => handleCompleteMission(mission)}
                                    disabled={isCompleted}
                                    className="py-2 px-4 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary-pressed transition-colors disabled:bg-sand disabled:cursor-not-allowed whitespace-nowrap"
                                >
                                    {isCompleted ? 'Done!' : `+${mission.xp} XP`}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
          <div className="flex gap-4 mt-6">
            <button onClick={onBack} className="py-3 px-4 rounded-xl bg-dune text-ink font-semibold hover:bg-outline/20 transition-colors transform active:scale-[0.98]">
              New Sighting
            </button>
            <button onClick={() => onSave(false)} className="flex-grow py-3 px-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary-pressed transition-colors flex items-center justify-center gap-2 transform active:scale-[0.98]">
              <Icon name="journal" className="w-5 h-5" />
              Log to Field Journal
            </button>
             <button 
              onClick={() => onSave(true)}
              disabled={!analysis.isAnimalOrPlant}
              className="p-3 rounded-xl bg-secondary text-white font-semibold hover:opacity-90 transition-opacity transform active:scale-[0.98] disabled:bg-sand disabled:cursor-not-allowed"
              title="Add this creature to your Animal Pals"
            >
              <Icon name="heart" className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};