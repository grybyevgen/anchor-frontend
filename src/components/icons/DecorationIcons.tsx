// Декоративные элементы в игровом стиле

export function WavesDecoration({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 1200 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      <g>
        <path 
          d="M0 60 Q150 20 300 60 T600 60 T900 60 T1200 60 L1200 120 L0 120 Z" 
          fill="url(#wave-gradient-1)" 
          opacity="0.7"
        />
        <path 
          d="M0 75 Q200 45 400 75 T800 75 T1200 75 L1200 120 L0 120 Z" 
          fill="url(#wave-gradient-2)" 
          opacity="0.5"
        />
        <path 
          d="M0 90 Q150 70 300 90 T600 90 T900 90 T1200 90 L1200 120 L0 120 Z" 
          fill="url(#wave-gradient-3)" 
          opacity="0.3"
        />
        <defs>
          <linearGradient id="wave-gradient-1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#4299e1', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#2c5282', stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id="wave-gradient-2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#63b3ed', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#3182ce', stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id="wave-gradient-3" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#90cdf4', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#4299e1', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
      </g>
    </svg>
  );
}

export function AnchorDecoration({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      className={className}
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <g>
        <circle cx="16" cy="8" r="3" fill="none" stroke="#2c5282" strokeWidth="2"/>
        <rect x="15" y="8" width="2" height="16" fill="#2c5282"/>
        <path 
          d="M8 20 L8 24 L10 26 L16 22 L22 26 L24 24 L24 20" 
          stroke="#2c5282" 
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M6 14 L26 14" stroke="#2c5282" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="6" cy="14" r="2" fill="#2c5282"/>
        <circle cx="26" cy="14" r="2" fill="#2c5282"/>
        <circle cx="16" cy="8" r="1" fill="#90cdf4" opacity="0.6"/>
      </g>
    </svg>
  );
}

export function CloudDecoration({ size = 60, className = "" }: { size?: number; className?: string }) {
  return (
    <svg 
      width={size} 
      height={size * 0.6} 
      className={className}
      viewBox="0 0 100 60" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <g opacity="0.7">
        <ellipse cx="25" cy="35" rx="20" ry="18" fill="#ffffff"/>
        <ellipse cx="45" cy="30" rx="25" ry="20" fill="#ffffff"/>
        <ellipse cx="70" cy="35" rx="22" ry="18" fill="#ffffff"/>
        <ellipse cx="55" cy="40" rx="20" ry="15" fill="#ffffff"/>
      </g>
    </svg>
  );
}

export function SeaBackground({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 375 200" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sky-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#90cdf4', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#63b3ed', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="sea-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#4299e1', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#2c5282', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="375" height="100" fill="url(#sky-gradient)"/>
      <g opacity="0.5">
        <ellipse cx="50" cy="30" rx="25" ry="15" fill="#ffffff"/>
        <ellipse cx="70" cy="35" rx="20" ry="12" fill="#ffffff"/>
        <ellipse cx="150" cy="25" rx="30" ry="18" fill="#ffffff"/>
        <ellipse cx="280" cy="40" rx="35" ry="20" fill="#ffffff"/>
      </g>
      <rect x="0" y="100" width="375" height="100" fill="url(#sea-gradient)"/>
      <g opacity="0.3">
        <path 
          d="M0 120 Q50 110 100 120 T200 120 T300 120 T375 120" 
          stroke="#90cdf4" 
          strokeWidth="2" 
          fill="none"
        />
        <path 
          d="M0 140 Q60 130 120 140 T240 140 T375 140" 
          stroke="#90cdf4" 
          strokeWidth="2" 
          fill="none"
        />
        <path 
          d="M0 160 Q40 150 80 160 T160 160 T240 160 T320 160 T375 160" 
          stroke="#90cdf4" 
          strokeWidth="1.5" 
          fill="none"
        />
      </g>
      <circle cx="320" cy="40" r="20" fill="#ffd700" opacity="0.8"/>
      <circle cx="320" cy="40" r="25" fill="#ffd700" opacity="0.3"/>
    </svg>
  );
}

export function SplashDecoration({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      className={className}
      viewBox="0 0 40 40" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <g>
        <circle cx="20" cy="30" r="8" fill="#4299e1" opacity="0.3"/>
        <path d="M12 25 Q10 20 12 15" stroke="#63b3ed" strokeWidth="2" strokeLinecap="round"/>
        <path d="M20 22 Q20 15 20 10" stroke="#63b3ed" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M28 25 Q30 20 28 15" stroke="#63b3ed" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="15" cy="12" r="2" fill="#4299e1" opacity="0.6"/>
        <circle cx="25" cy="12" r="2" fill="#4299e1" opacity="0.6"/>
        <circle cx="20" cy="8" r="2.5" fill="#4299e1" opacity="0.7"/>
      </g>
    </svg>
  );
}
