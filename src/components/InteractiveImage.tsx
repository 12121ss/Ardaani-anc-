import React, { useState } from 'react';
import { SafeImage } from './SafeImage';

interface InteractiveImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function InteractiveImage({ src, alt, className = "" }: InteractiveImageProps) {
  const [displayMode, setDisplayMode] = useState<'default' | 'gray' | 'color'>('default');

  const handleClick = (e: React.MouseEvent) => {
    if (e.shiftKey) {
      setDisplayMode('color');
    } else {
      setDisplayMode('gray');
    }
  };

  const getFilterClass = () => {
    if (displayMode === 'gray') return 'grayscale brightness-100';
    if (displayMode === 'color') return 'grayscale-0 brightness-100';
    return 'grayscale-0 brightness-100 group-hover:brightness-90';
  };

  return (
    <SafeImage 
      src={src} 
      alt={alt}
      onClick={handleClick}
      className={`${className} transition-all duration-700 cursor-pointer ${getFilterClass()}`}
      fallbackSrc="https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800&h=450" // Stable code/tech fallback
    />
  );
}
