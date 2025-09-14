import React from 'react';

/**
 * A simple, native CSS sound wave animation.
 * @param {object} props
 * @param {boolean} props.isPlaying - Controls whether the animation is active and visible.
 */
interface SoundWaveAnimationProps {
  isPlaying: boolean;
}

const SoundWaveAnimation: React.FC<SoundWaveAnimationProps> = ({ isPlaying }) => {
  if (!isPlaying) {
    return null; // Don't render anything if not playing
  }

  // We generate the bars in an array to keep the JSX clean
  const bars = [...Array(5)];

  return (
    <div className="wave-container" aria-hidden="true">
      {bars.map((_, index) => (
        <div key={index} className="wave-bar"></div>
      ))}
    </div>
  );
};

export default SoundWaveAnimation;
