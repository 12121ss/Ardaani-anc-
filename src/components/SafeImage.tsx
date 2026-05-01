import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export function SafeImage({ src, alt, className = "", fallbackSrc = "", onClick }: SafeImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Default to a UI avatar if no fallback provided
  const actualFallback = fallbackSrc || `https://ui-avatars.com/api/?name=Arda&background=3b82f6&color=fff&size=512`;

  return (
    <div className={`relative overflow-hidden bg-slate-900 ${className}`} onClick={onClick}>
      {/* Loading Skeleton */}
      {!isLoaded && !error && (
        <div className="absolute inset-0 bg-brand-primary/5 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-brand-primary/20 border-t-brand-primary animate-spin" />
        </div>
      )}

      {/* Initials Fallback (If file fails to load) */}
      {error && (
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 to-slate-900 flex items-center justify-center">
          <span className="text-brand-primary font-display font-bold text-2xl opacity-80">AR</span>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.img
          key={error ? 'fallback' : 'main'}
          src={error ? actualFallback : src}
          alt={alt}
          onLoad={(e) => {
            if (e.currentTarget.naturalWidth === 0) {
              console.error(`Image failed to decode: ${src}`);
              setError(true);
            } else {
              setIsLoaded(true);
            }
          }}
          onError={() => {
            console.error(`Image failed to load: ${src}`);
            setError(true);
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`w-full h-full object-cover transition-transform duration-700 ${isLoaded ? 'scale-100' : 'scale-105'}`}
          referrerPolicy="no-referrer"
        />
      </AnimatePresence>
    </div>
  );
}
