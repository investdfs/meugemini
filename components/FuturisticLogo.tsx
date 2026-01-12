import React from 'react';

interface FuturisticLogoProps {
  size?: number;
  className?: string;
  isProcessing?: boolean;
}

export const FuturisticLogo: React.FC<FuturisticLogoProps> = ({ size = 40, className = "", isProcessing = false }) => {
  return (
    <div 
      className={`relative flex items-center justify-center transition-all duration-700 ${className} ${isProcessing ? 'scale-110' : 'hover:scale-110'}`}
      style={{ width: size, height: size }}
    >
      {/* Outer Orbit */}
      <svg 
        viewBox="0 0 100 100" 
        className={`absolute w-full h-full neural-orbit opacity-40 transition-all duration-500 ${isProcessing ? 'text-cyan-400 brightness-150' : ''}`}
        style={{ animationDuration: isProcessing ? '2s' : '10s' }}
      >
        <circle 
          cx="50" cy="50" r="45" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth={isProcessing ? "2" : "1"} 
          strokeDasharray="15 10"
        />
      </svg>

      {/* Inner Orbit (Reverse) */}
      <svg 
        viewBox="0 0 100 100" 
        className="absolute w-full h-full neural-orbit-reverse opacity-60"
        style={{ padding: '15%', animationDuration: isProcessing ? '1s' : '15s' }}
      >
        <circle 
          cx="50" cy="50" r="45" 
          fill="none" 
          stroke="url(#grad-inner)" 
          strokeWidth="2" 
          strokeDasharray="5 5"
        />
      </svg>

      {/* Core Node */}
      <div 
        className={`relative z-10 rounded-full neural-core transition-all duration-500 ${isProcessing ? 'shadow-[0_0_30px_rgba(6,182,212,0.8)]' : ''}`}
        style={{ 
          width: '50%', 
          height: '50%',
          background: isProcessing 
            ? 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)' 
            : 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)'
        }}
      >
        <div className="absolute inset-0 bg-white/30 rounded-full blur-[1px]"></div>
      </div>

      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="grad-inner" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};