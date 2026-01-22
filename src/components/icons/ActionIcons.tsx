// Иконки действий в игровом стиле

export function LoadIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g>
        <rect x="4" y="14" width="16" height="8" fill="#48bb78" stroke="#2f855a" strokeWidth="1.5" rx="1"/>
        <path d="M12 2 L12 14" stroke="#2f855a" strokeWidth="2" strokeLinecap="round"/>
        <path d="M8 10 L12 14 L16 10" stroke="#2f855a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="18" r="1.5" fill="#ffd700"/>
      </g>
    </svg>
  );
}

export function UnloadIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g>
        <rect x="4" y="12" width="16" height="8" fill="#f6ad55" stroke="#dd6b20" strokeWidth="1.5" rx="1"/>
        <path d="M12 20 L12 4" stroke="#dd6b20" strokeWidth="2" strokeLinecap="round"/>
        <path d="M8 8 L12 4 L16 8" stroke="#dd6b20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="16" r="1.5" fill="#ffd700"/>
      </g>
    </svg>
  );
}

export function SendIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g>
        <path d="M3 12 L6 16 L18 16 L21 12 L18 10 L6 10 Z" fill="#4299e1" stroke="#2c5282" strokeWidth="1.5"/>
        <rect x="16" y="8" width="3" height="4" fill="#3182ce" stroke="#2c5282" strokeWidth="1"/>
        <path d="M2 17 Q4 18 6 17 T10 17 T14 17 T18 17 T22 17" stroke="#4299e1" strokeWidth="1.5" fill="none"/>
        <path d="M16 5 L20 5 L18 3 M20 5 L18 7" stroke="#2f855a" strokeWidth="1.5" strokeLinecap="round"/>
      </g>
    </svg>
  );
}

export function RefuelIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g>
        <rect x="6" y="4" width="10" height="16" fill="#48bb78" stroke="#2f855a" strokeWidth="1.5" rx="2"/>
        <rect x="8" y="6" width="6" height="6" fill="#68d391" stroke="#2f855a" strokeWidth="1" rx="1"/>
        <circle cx="11" cy="9" r="2" fill="#ffd700"/>
        <path d="M16 10 Q18 12 18 14 L18 18" stroke="#2d3748" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="18" cy="18" r="2" fill="#4a5568" stroke="#2d3748" strokeWidth="1"/>
        <path d="M11 15 Q11 17 11.5 17.5 Q11 18 10.5 17.5 Q10 17 10 15 Z" fill="#2c5282"/>
      </g>
    </svg>
  );
}

export function RepairIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g>
        <path 
          d="M14 3 L14 7 L10 11 L8 13 L6 13 L6 11 L8 9 L12 5 L16 5 L19 2 L20 3 L17 6 Z" 
          fill="#718096" 
          stroke="#4a5568" 
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle cx="7" cy="17" r="4" fill="#ffd700" stroke="#d69e2e" strokeWidth="1.5"/>
        <circle cx="7" cy="17" r="2" fill="none" stroke="#d69e2e" strokeWidth="1"/>
        <circle cx="12" cy="8" r="1" fill="#ffd700" opacity="0.8"/>
        <circle cx="15" cy="10" r="0.8" fill="#ffd700" opacity="0.6"/>
        <circle cx="10" cy="6" r="0.8" fill="#ffd700" opacity="0.7"/>
      </g>
    </svg>
  );
}

export function TowIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g>
        <path d="M2 12 L4 16 L10 16 L12 12 L10 10 L4 10 Z" fill="#e53e3e" stroke="#c53030" strokeWidth="1.5"/>
        <rect x="9" y="8" width="2" height="4" fill="#c53030" stroke="#9b2c2c" strokeWidth="1"/>
        <path 
          d="M12 12 Q15 11 18 12" 
          stroke="#4a5568" 
          strokeWidth="2" 
          strokeLinecap="round"
          strokeDasharray="1 2"
        />
        <path d="M18 12 L19 16 L23 16 L23 12 L21 11 L19 11 Z" fill="#718096" stroke="#4a5568" strokeWidth="1.5" opacity="0.7"/>
        <g transform="translate(5, 14)">
          <circle cx="0" cy="0" r="1" fill="#ffd700"/>
          <rect x="-0.5" y="0" width="1" height="2" fill="#ffd700"/>
          <path d="M-1.5 2 L1.5 2" stroke="#ffd700" strokeWidth="1"/>
        </g>
      </g>
    </svg>
  );
}
