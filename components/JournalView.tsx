

import React, { useState, useMemo } from 'react';
import type { JournalEntry, ChatMessage } from '../types';
import { Icon } from './Icon';
import { AnimalChatModal } from './AnimalChatModal';

interface JournalViewProps {
  entries: JournalEntry[];
  removeEntry: (id: string) => void;
  updateEntryChatHistory: (id: string, newHistory: ChatMessage[]) => void;
}

const JournalCard: React.FC<{ entry: JournalEntry; onRemove: () => void; onChat: () => void; }> = ({ entry, onRemove, onChat }) => {
  return (
    <div className="bg-surface rounded-2xl shadow-warm-md overflow-hidden transition-all duration-300 hover:shadow-warm-xl hover:-translate-y-1 group">
      <div className="relative">
        {entry.media.type.startsWith('image/') ? (
          <img className="h-48 w-full object-cover" src={entry.media.dataUrl} alt={entry.analysis.subjectName} />
        ) : (
          <div className="h-48 w-full bg-dune flex items-center justify-center">
             <Icon name={entry.media.type.startsWith('video/') ? 'video' : 'audio'} className="w-16 h-16 text-muted/50" />
          </div>
        )}
        {entry.isPal && (
           <div 
             className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" 
             onClick={onChat}
             aria-label={`Chat with ${entry.analysis.subjectName}`}
           >
              <div className="flex flex-col items-center text-white text-center">
                  <Icon name="chatBubble" className="w-12 h-12" />
                  <span className="font-bold mt-1 text-lg">Chat!</span>
              </div>
          </div>
        )}
         <div className="absolute top-3 left-3 flex items-center gap-2">
          {entry.isPal && (
            <div className="bg-white/90 text-secondary p-1.5 rounded-full shadow-sm backdrop-blur-sm" aria-label="Animal Pal">
                <Icon name="heart" className="w-5 h-5 fill-current animate-pulse-heart" />
            </div>
           )}
        </div>
        <button onClick={onRemove} className="absolute top-3 right-3 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger" aria-label="Remove entry">
            <Icon name="trash" className="w-5 h-5" />
        </button>
      </div>
      <div className="p-5">
        <div className="uppercase tracking-wide text-sm text-primary font-bold">{entry.analysis.subjectName}</div>
        <p className="text-xs text-muted mt-1">{new Date(entry.date).toLocaleDateString()}</p>
        <p className="mt-2 text-muted text-sm line-clamp-2">{entry.analysis.description}</p>
      </div>
    </div>
  );
};

export const JournalView: React.FC<JournalViewProps> = ({ entries, removeEntry, updateEntryChatHistory }) => {
  const [chattingWith, setChattingWith] = useState<JournalEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEntries = useMemo(() => {
    if (!searchQuery) return entries;
    return entries.filter(entry => 
      entry.analysis.subjectName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [entries, searchQuery]);

  const groupedEntries = useMemo(() => {
    return filteredEntries.reduce((acc, entry) => {
      const ecosystem = entry.analysis.ecosystem || 'General Discoveries';
      if (!acc[ecosystem]) {
        acc[ecosystem] = [];
      }
      acc[ecosystem].push(entry);
      return acc;
    }, {} as Record<string, JournalEntry[]>);
  }, [filteredEntries]);

  if (entries.length === 0) {
    return (
      <div className="text-center text-muted">
        <Icon name="journal" className="w-24 h-24 mx-auto mb-4" />
        <h3 className="text-3xl font-headline font-semibold text-ink">Your Field Journal is Empty</h3>
        <p className="mt-2 text-lg">Submit a Sighting Report to begin your quest!</p>
      </div>
    );
  }

  const ecosystemOrder = Object.keys(groupedEntries).sort();

  return (
    <div className="w-full max-w-7xl">
        <header className="text-center mb-8">
            <h2 className="text-4xl font-bold font-headline text-ink mb-4 flex items-center justify-center gap-3">
                <Icon name="journal" className="w-8 h-8 text-primary" /> 
                Ranger's Field Journal
            </h2>
             <div className="max-w-lg mx-auto">
                <div className="relative">
                    <input
                        type="search"
                        placeholder="Search your sightings by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full py-3 pl-10 pr-4 rounded-xl bg-surface border-2 border-outline/30 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Icon name="search" className="w-5 h-5 text-muted" />
                    </div>
                </div>
            </div>
        </header>

        {ecosystemOrder.map(ecosystem => (
            <section key={ecosystem} className="mb-12">
                <h3 className="text-2xl font-bold font-headline text-secondary mb-6 flex items-center gap-3">
                    <Icon name="ecosystem" className="w-6 h-6"/>
                    {ecosystem}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {groupedEntries[ecosystem].map((entry, index) => (
                         <div key={entry.id} className="animate-stagger-in" style={{ animationDelay: `${index * 50}ms` }}>
                            <JournalCard 
                                entry={entry} 
                                onRemove={() => removeEntry(entry.id)} 
                                onChat={() => setChattingWith(entry)}
                            />
                        </div>
                    ))}
                </div>
            </section>
        ))}

        <AnimalChatModal
          isOpen={!!chattingWith}
          animal={chattingWith}
          onClose={() => setChattingWith(null)}
          onUpdateHistory={updateEntryChatHistory}
        />
    </div>
  );
};