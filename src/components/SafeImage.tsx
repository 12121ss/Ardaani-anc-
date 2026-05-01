import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export function SafeImage({ src, alt, className = "", fallbackSrc = "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop", onClick }: SafeImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-slate-900 ${className}`} onClick={onClick}>
      {/* Loading Skeleton / Placeholder */}
      {!isLoaded && !error && (
        <div className="absolute inset-0 bg-brand-primary/5 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-brand-primary/20 border-t-brand-primary animate-spin" />
        </div>
      )}

      {/* Better Fallback when image fails */}
      {error && (
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 to-slate-900 flex items-center justify-center">
          <span className="text-brand-primary font-display font-bold text-2xl opacity-50">AR</span>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.img
          key={error ? 'fallback' : 'main'}
          src={error ? fallbackSrc : src}
          alt={alt}
          onLoad={(e) => {
            // Check if it's a 0-byte or corrupted image (naturalWidth will be 0)
            if (e.currentTarget.naturalWidth === 0) {
              setError(true);
            } else {
              setIsLoaded(true);
            }
          }}
          onError={() => setError(true)}
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`w-full h-full object-cover transition-transform duration-700 ${isLoaded ? 'scale-100' : 'scale-110'}`}
          referrerPolicy="no-referrer"
        />
      </AnimatePresence>
    </div>
  );
}
