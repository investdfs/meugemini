
import React from 'react';

interface FuturisticLogoProps {
  size?: number;
  className?: string;
  isProcessing?: boolean;
}

export const FuturisticLogo: React.FC<FuturisticLogoProps> = ({ size = 40, className = "", isProcessing = false }) => {
  return (
    <div 
      className={`relative flex items-center justify-center transition-all duration-1000 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Camada 1: Aura de Fundo (Glow Externo) */}
      <div 
        className={`absolute inset-0 rounded-full blur-[20px] opacity-30 transition-all duration-1000 ${isProcessing ? 'scale-150 opacity-60' : 'scale-100 opacity-20'}`}
        style={{ 
          background: 'radial-gradient(circle, #4e95ff 0%, #8b5cf6 50%, #06b6d4 100%)',
          animation: 'neural-pulse 4s infinite ease-in-out'
        }}
      />

      {/* Camada 2: Anéis de Processamento (Data Rings) */}
      <svg 
        viewBox="0 0 100 100" 
        className={`absolute w-[130%] h-[130%] transition-all duration-1000 ${isProcessing ? 'opacity-40' : 'opacity-10'}`}
      >
        <circle 
          cx="50" cy="50" r="45" 
          fill="none" 
          stroke="url(#ring-gradient)" 
          strokeWidth="0.5" 
          strokeDasharray="2 10"
          className={isProcessing ? 'animate-[spin_3s_linear_infinite]' : 'animate-[spin_12s_linear_infinite]'}
          style={{ transformOrigin: 'center' }}
        />
        <defs>
          <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4e95ff" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>

      {/* Camada 3: O Ícone Principal (Diamond Spark) */}
      <div className={`relative z-10 w-[85%] h-[85%] drop-shadow-[0_0_15px_rgba(78,149,255,0.5)] transition-transform duration-700 ${isProcessing ? 'scale-110' : 'scale-100'}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="main-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#4e95ff', stopOpacity: 1 }} />
              <stop offset="50%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }} />
            </linearGradient>
            <filter id="inner-glow">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
            </filter>
          </defs>
          
          {/* Corpo do Diamante */}
          <path 
            d="M50 0 L62 38 L100 50 L62 62 L50 100 L38 62 L0 50 L38 38 Z" 
            fill="url(#main-gradient)"
            className="animate-[float-gentle_5s_ease-in-out_infinite]"
            style={{ transformOrigin: 'center' }}
          />
          
          {/* Brilho Reflexivo Superior */}
          <path 
            d="M50 12 L53 47 L88 50 L53 53 L50 88 L47 53 L12 50 L47 47 Z" 
            fill="white"
            fillOpacity="0.4"
            filter="url(#inner-glow)"
          />
        </svg>
      </div>

      <style>{`
        @keyframes neural-pulse {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.15); opacity: 0.4; }
        }
        @keyframes float-gentle {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-5px) scale(1.02); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
