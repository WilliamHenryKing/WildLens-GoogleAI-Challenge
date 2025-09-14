import React, { useState, useEffect, useRef, useMemo } from 'react';
import Globe from 'react-globe.gl';
import type { JournalEntry } from '../types';
import { getConservationNews } from '../services/geminiService';
import { Icon } from './Icon';

const organizations = [
    {
      id: 'wwf',
      name: 'World Wildlife Fund',
      kidFriendlyDescription: 'WWF helps protect pandas, tigers, and many other amazing animals around the world! They work in over 100 countries to keep nature safe.',
      focus: ['Wildlife Protection', 'Climate Change', 'Forests', 'Oceans'],
      website: 'https://www.worldwildlife.org/',
      color: '#00A86B'
    },
    {
      id: 'tnc',
      name: 'The Nature Conservancy',
      kidFriendlyDescription: 'The Nature Conservancy protects forests, rivers, and oceans to keep our planet healthy for all the animals and plants that live there!',
      focus: ['Land Conservation', 'Ocean Protection', 'Freshwater'],
      website: 'https://www.nature.org/',
      color: '#0066CC'
    },
    {
      id: 'ci',
      name: 'Conservation International',
      kidFriendlyDescription: 'This group works to show how much people need nature to be healthy and happy, protecting important places for both wildlife and humans.',
      focus: ['Biodiversity', 'Natural Climate Solutions', 'Sustainable Seas'],
      website: 'https://www.conservation.org/',
      color: '#007398'
    }
];

const OrganizationCard: React.FC<{ organization: typeof organizations[0] }> = ({ organization }) => {
  return (
    <div 
      className="org-card bg-surface rounded-2xl shadow-warm-md border border-outline/20 p-6 flex flex-col" 
      style={{ borderLeft: `5px solid ${organization.color}` }}
    >
      <h3 className="text-2xl font-bold font-headline text-ink">{organization.name}</h3>
      <p className="text-muted mt-2 flex-grow">{organization.kidFriendlyDescription}</p>
      
      <div className="mt-4">
        <h4 className="font-semibold text-sm text-muted mb-2">Focus Areas:</h4>
        <div className="flex flex-wrap -m-1">
          {organization.focus.map((area) => (
            <span key={area} className="focus-tag">{area}</span>
          ))}
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-outline/20">
        <a 
          href={organization.website} 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-dune text-ink font-semibold hover:bg-outline/20 transition-colors"
        >
          Learn More
          <Icon name="externalLink" className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};


const NewsTicker: React.FC = () => {
    const [news, setNews] = useState<string[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const stories = await getConservationNews();
                setNews(stories);
            } catch (err) {
                console.error("Failed to fetch conservation news:", err);
                setError("Could not fetch the latest good news from the field.");
            }
        };
        fetchNews();
    }, []);

    if (error) {
        return (
            <div className="bg-danger-surface border border-danger text-danger px-4 py-3 rounded-2xl" role="alert">
                <strong>Connection Error: </strong><span>{error}</span>
            </div>
        );
    }

    if (!news) {
        return (
             <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-surface p-4 rounded-xl shadow-warm-md border border-outline/20 h-12 animate-pulse"></div>
                ))}
            </div>
        );
    }
    
    return (
        <div className="space-y-4">
            {news.map((story, index) => (
                <div key={index} className="bg-surface p-4 rounded-xl shadow-warm-md border border-outline/20">
                    <p className="text-ink font-medium">{story}</p>
                </div>
            ))}
        </div>
    );
};


interface HubViewProps {
    entries: JournalEntry[];
}

export const HubView: React.FC<HubViewProps> = ({ entries }) => {
    const globeContainerRef = useRef<HTMLDivElement>(null);
    const [globeSize, setGlobeSize] = useState({ width: 0, height: 450 });
    const globeRef = useRef<any>(null);
    
    useEffect(() => {
        const observer = new ResizeObserver(entries => {
            if (entries[0]) {
                const { width } = entries[0].contentRect;
                setGlobeSize({ width, height: width > 600 ? 500 : 400 });
            }
        });
        if (globeContainerRef.current) {
            observer.observe(globeContainerRef.current);
        }
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (globeRef.current) {
            globeRef.current.controls().autoRotate = true;
            globeRef.current.controls().autoRotateSpeed = 0.4;
        }
    }, [globeRef]);

    const pointsData = useMemo(() => entries.map(entry => ({
        lat: entry.analysis.coordinates.latitude,
        lng: entry.analysis.coordinates.longitude,
        name: entry.analysis.subjectName,
        location: entry.analysis.estimatedLocation,
        size: 0.8,
        color: 'rgba(255, 165, 0, 0.85)'
    })), [entries]);

    const handlePointClick = (point: any) => {
        alert(`Sighting Report\n\nSpecies: ${point.name}\nSimulated Location: ${point.location}`);
        if(globeRef.current) {
            globeRef.current.pointOfView({ lat: point.lat, lng: point.lng, altitude: 1.5 }, 1000);
        }
    };

    return (
        <div className="w-full max-w-7xl animate-fade-in-up space-y-16">
            <header className="text-center">
                <Icon name="hub" className="w-24 h-24 mx-auto mb-4 text-primary" />
                <h2 className="text-4xl lg:text-5xl font-bold font-headline text-ink mb-2">Global Impact Hub</h2>
                <p className="text-lg text-muted max-w-2xl mx-auto">
                    You are part of a global movement of Eco-Scouts. See your discoveries and the latest positive news from the field.
                </p>
            </header>

            <section>
                <h3 className="text-3xl font-bold font-headline text-ink mb-4 text-center">🗺️ Your Discoveries Worldwide</h3>
                <div ref={globeContainerRef} className="w-full h-[400px] md:h-[500px] cursor-grab active:cursor-grabbing">
                    <Globe
                        ref={globeRef}
                        width={globeSize.width}
                        height={globeSize.height}
                        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
                        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                        backgroundColor="rgba(0,0,0,0)"
                        pointsData={pointsData}
                        pointAltitude={0.01}
                        pointColor="color"
                        pointRadius="size"
                        onPointClick={handlePointClick}
                        pointsMerge={true}
                        pointResolution={12}
                    />
                </div>
                 <p className="text-center text-muted mt-2">Spin the globe and click the glowing points to see your sighting reports!</p>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                <section>
                    <h3 className="text-3xl font-bold font-headline text-ink mb-6 text-center lg:text-left">📰 Good News from the Field</h3>
                    <NewsTicker />
                </section>
                <section>
                    <h3 className="text-3xl font-bold font-headline text-ink mb-6 text-center lg:text-left">🤝 Our Conservation Heroes</h3>
                    <div className="space-y-6">
                        {organizations.map((org, index) => (
                            <div key={org.id} className="animate-stagger-in" style={{ animationDelay: `${index * 100}ms` }}>
                                <OrganizationCard organization={org} />
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};