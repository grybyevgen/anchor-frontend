// Иконки судов в игровом стиле

export function TankerIcon({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g>
        <path
          d="M8 35 L12 45 L52 45 L56 35 L52 30 L12 30 Z"
          fill="#1e3a5f"
          stroke="#0d1f3a"
          strokeWidth="1.5"
        />
        <ellipse cx="20" cy="32" rx="5" ry="4" fill="#2c5282" stroke="#1a365d" strokeWidth="1"/>
        <ellipse cx="32" cy="32" rx="5" ry="4" fill="#2c5282" stroke="#1a365d" strokeWidth="1"/>
        <ellipse cx="44" cy="32" rx="5" ry="4" fill="#2c5282" stroke="#1a365d" strokeWidth="1"/>
        <rect x="48" y="20" width="8" height="10" fill="#3b5998" stroke="#1a365d" strokeWidth="1" rx="1"/>
        <rect x="49" y="22" width="2" height="2" fill="#ffd700"/>
        <rect x="53" y="22" width="2" height="2" fill="#ffd700"/>
        <rect x="50" y="16" width="4" height="5" fill="#e63946" stroke="#c1121f" strokeWidth="1"/>
        <ellipse cx="52" cy="16" rx="2" ry="1" fill="#f77f00"/>
        <path
          d="M8 45 Q12 48 16 45 T24 45 T32 45 T40 45 T48 45 T56 45"
          stroke="#4299e1"
          strokeWidth="2"
          fill="none"
        />
      </g>
    </svg>
  );
}

export function CargoShipIcon({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g>
        <path
          d="M10 36 L14 46 L50 46 L54 36 L50 32 L14 32 Z"
          fill="#4a5568"
          stroke="#2d3748"
          strokeWidth="1.5"
        />
        <rect x="16" y="28" width="6" height="6" fill="#e53e3e" stroke="#c53030" strokeWidth="1" rx="0.5"/>
        <rect x="24" y="28" width="6" height="6" fill="#3182ce" stroke="#2c5282" strokeWidth="1" rx="0.5"/>
        <rect x="32" y="28" width="6" height="6" fill="#38a169" stroke="#2f855a" strokeWidth="1" rx="0.5"/>
        <rect x="40" y="28" width="6" height="6" fill="#d69e2e" stroke="#b7791f" strokeWidth="1" rx="0.5"/>
        <rect x="20" y="22" width="6" height="6" fill="#805ad5" stroke="#6b46c1" strokeWidth="1" rx="0.5"/>
        <rect x="28" y="22" width="6" height="6" fill="#dd6b20" stroke="#c05621" strokeWidth="1" rx="0.5"/>
        <rect x="36" y="22" width="6" height="6" fill="#319795" stroke="#2c7a7b" strokeWidth="1" rx="0.5"/>
        <rect x="46" y="22" width="8" height="10" fill="#718096" stroke="#4a5568" strokeWidth="1" rx="1"/>
        <rect x="47" y="24" width="2" height="2" fill="#ffd700"/>
        <rect x="51" y="24" width="2" height="2" fill="#ffd700"/>
        <rect x="48" y="18" width="4" height="5" fill="#e63946" stroke="#c1121f" strokeWidth="1"/>
        <ellipse cx="50" cy="18" rx="2" ry="1" fill="#90cdf4"/>
        <path
          d="M10 46 Q14 49 18 46 T26 46 T34 46 T42 46 T50 46 T54 46"
          stroke="#4299e1"
          strokeWidth="2"
          fill="none"
        />
      </g>
    </svg>
  );
}

export function SupplyShipIcon({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g>
        <path
          d="M12 38 L16 46 L48 46 L52 38 L48 34 L16 34 Z"
          fill="#48bb78"
          stroke="#2f855a"
          strokeWidth="1.5"
        />
        <rect x="18" y="30" width="28" height="6" fill="#68d391" stroke="#38a169" strokeWidth="1" rx="1"/>
        <rect x="20" y="26" width="6" height="5" fill="#f6ad55" stroke="#dd6b20" strokeWidth="1" rx="0.5"/>
        <rect x="28" y="26" width="6" height="5" fill="#fc8181" stroke="#e53e3e" strokeWidth="1" rx="0.5"/>
        <rect x="36" y="26" width="6" height="5" fill="#90cdf4" stroke="#3182ce" strokeWidth="1" rx="0.5"/>
        <rect x="42" y="24" width="8" height="10" fill="#f7fafc" stroke="#a0aec0" strokeWidth="1" rx="1"/>
        <rect x="43" y="26" width="2" height="2" fill="#4299e1"/>
        <rect x="47" y="26" width="2" height="2" fill="#4299e1"/>
        <rect x="43" y="29" width="2" height="2" fill="#4299e1"/>
        <rect x="47" y="29" width="2" height="2" fill="#4299e1"/>
        <rect x="44" y="20" width="4" height="5" fill="#e63946" stroke="#c1121f" strokeWidth="1"/>
        <ellipse cx="46" cy="20" rx="2" ry="1" fill="#90cdf4"/>
        <g transform="translate(14, 36)">
          <circle cx="0" cy="0" r="1.5" fill="#f7fafc"/>
          <rect x="-0.5" y="0" width="1" height="3" fill="#f7fafc"/>
          <path d="M-2 3 L2 3" stroke="#f7fafc" strokeWidth="1"/>
        </g>
        <path
          d="M12 46 Q16 49 20 46 T28 46 T36 46 T44 46 T52 46"
          stroke="#4299e1"
          strokeWidth="2"
          fill="none"
        />
      </g>
    </svg>
  );
}
