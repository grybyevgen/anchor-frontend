// Иконки заводов/портов в игровом стиле

export function OilFactoryIcon({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g>
        <rect x="15" y="45" width="50" height="30" fill="#2d3748" stroke="#1a202c" strokeWidth="2" rx="2"/>
        <rect x="20" y="50" width="6" height="8" fill="#ffd700" opacity="0.8"/>
        <rect x="30" y="50" width="6" height="8" fill="#ffd700" opacity="0.8"/>
        <rect x="40" y="50" width="6" height="8" fill="#ffd700" opacity="0.6"/>
        <rect x="50" y="50" width="6" height="8" fill="#ffd700" opacity="0.8"/>
        <rect x="20" y="62" width="6" height="8" fill="#ffd700" opacity="0.6"/>
        <rect x="30" y="62" width="6" height="8" fill="#ffd700" opacity="0.8"/>
        <rect x="40" y="62" width="6" height="8" fill="#ffd700" opacity="0.8"/>
        <rect x="50" y="62" width="6" height="8" fill="#ffd700" opacity="0.6"/>
        <rect x="22" y="15" width="8" height="30" fill="#4a5568" stroke="#2d3748" strokeWidth="1.5"/>
        <rect x="35" y="20" width="8" height="25" fill="#4a5568" stroke="#2d3748" strokeWidth="1.5"/>
        <rect x="48" y="18" width="8" height="27" fill="#4a5568" stroke="#2d3748" strokeWidth="1.5"/>
        <rect x="22" y="12" width="8" height="4" fill="#e63946" stroke="#c1121f" strokeWidth="1"/>
        <rect x="35" y="17" width="8" height="4" fill="#e63946" stroke="#c1121f" strokeWidth="1"/>
        <rect x="48" y="15" width="8" height="4" fill="#e63946" stroke="#c1121f" strokeWidth="1"/>
        <circle cx="26" cy="10" r="3" fill="#90cdf4" opacity="0.6"/>
        <circle cx="24" cy="7" r="2.5" fill="#90cdf4" opacity="0.5"/>
        <circle cx="28" cy="8" r="2" fill="#90cdf4" opacity="0.4"/>
        <circle cx="39" cy="15" r="3" fill="#90cdf4" opacity="0.6"/>
        <circle cx="37" cy="12" r="2.5" fill="#90cdf4" opacity="0.5"/>
        <circle cx="52" cy="13" r="3" fill="#90cdf4" opacity="0.6"/>
        <circle cx="54" cy="10" r="2.5" fill="#90cdf4" opacity="0.5"/>
        <circle cx="70" cy="60" r="8" fill="#1a202c" stroke="#0d0f14" strokeWidth="2"/>
        <rect x="62" y="60" width="16" height="15" fill="#1a202c"/>
        <ellipse cx="70" cy="75" rx="8" ry="2" fill="#0d0f14"/>
        <path d="M62 65 L78 65" stroke="#4a5568" strokeWidth="1"/>
        <path d="M62 70 L78 70" stroke="#4a5568" strokeWidth="1"/>
        <circle cx="40" cy="38" r="5" fill="#ffd700"/>
        <text x="40" y="42" fontSize="8" fontWeight="bold" fill="#1a202c" textAnchor="middle">⛽</text>
      </g>
    </svg>
  );
}

export function ProvisionFactoryIcon({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g>
        <rect x="15" y="40" width="50" height="35" fill="#f7fafc" stroke="#cbd5e0" strokeWidth="2" rx="2"/>
        <path
          d="M10 40 L40 25 L70 40 Z"
          fill="#e53e3e"
          stroke="#c53030"
          strokeWidth="2"
        />
        <rect x="20" y="48" width="8" height="10" fill="#4299e1" opacity="0.7"/>
        <rect x="32" y="48" width="8" height="10" fill="#4299e1" opacity="0.7"/>
        <rect x="44" y="48" width="8" height="10" fill="#4299e1" opacity="0.7"/>
        <rect x="56" y="48" width="8" height="10" fill="#4299e1" opacity="0.7"/>
        <rect x="35" y="60" width="10" height="15" fill="#8b6f47" stroke="#6b5638" strokeWidth="1.5" rx="1"/>
        <circle cx="42" cy="67" r="1" fill="#ffd700"/>
        <rect x="48" y="20" width="6" height="10" fill="#718096" stroke="#4a5568" strokeWidth="1"/>
        <rect x="47" y="18" width="8" height="3" fill="#e63946" stroke="#c1121f" strokeWidth="1"/>
        <circle cx="51" cy="15" r="2.5" fill="#cbd5e0" opacity="0.7"/>
        <circle cx="49" cy="12" r="2" fill="#cbd5e0" opacity="0.6"/>
        <circle cx="53" cy="13" r="2" fill="#cbd5e0" opacity="0.5"/>
        <g transform="translate(20, 30)">
          <ellipse cx="0" cy="6" rx="4" ry="2" fill="#d69e2e"/>
          <rect x="-4" y="0" width="8" height="6" fill="#f6ad55" stroke="#dd6b20" strokeWidth="1"/>
          <path d="M-2 0 Q0 -2 2 0" stroke="#dd6b20" strokeWidth="1" fill="none"/>
        </g>
        <g transform="translate(54, 30)">
          <rect x="-4" y="0" width="8" height="6" fill="#48bb78" stroke="#2f855a" strokeWidth="1"/>
          <line x1="-4" y1="2" x2="4" y2="2" stroke="#2f855a" strokeWidth="0.5"/>
          <line x1="-4" y1="4" x2="4" y2="4" stroke="#2f855a" strokeWidth="0.5"/>
        </g>
        <rect x="25" y="35" width="30" height="6" fill="#48bb78" stroke="#2f855a" strokeWidth="1" rx="1"/>
        <text x="40" y="40" fontSize="6" fontWeight="bold" fill="#fff" textAnchor="middle">FOOD</text>
      </g>
    </svg>
  );
}

export function MaterialFactoryIcon({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g>
        <rect x="15" y="45" width="50" height="30" fill="#718096" stroke="#4a5568" strokeWidth="2" rx="2"/>
        <rect x="25" y="35" width="30" height="12" fill="#a0aec0" stroke="#718096" strokeWidth="2" rx="1"/>
        <rect x="20" y="52" width="6" height="8" fill="#ffd700" opacity="0.8"/>
        <rect x="30" y="52" width="6" height="8" fill="#ffd700" opacity="0.6"/>
        <rect x="40" y="52" width="6" height="8" fill="#ffd700" opacity="0.8"/>
        <rect x="50" y="52" width="6" height="8" fill="#ffd700" opacity="0.6"/>
        <rect x="25" y="64" width="6" height="8" fill="#ffd700" opacity="0.7"/>
        <rect x="45" y="64" width="6" height="8" fill="#ffd700" opacity="0.7"/>
        <rect x="30" y="38" width="5" height="6" fill="#ffd700" opacity="0.7"/>
        <rect x="40" y="38" width="5" height="6" fill="#ffd700" opacity="0.7"/>
        <rect x="58" y="25" width="7" height="20" fill="#4a5568" stroke="#2d3748" strokeWidth="1.5"/>
        <rect x="58" y="22" width="7" height="4" fill="#e63946" stroke="#c1121f" strokeWidth="1"/>
        <rect x="28" y="22" width="6" height="13" fill="#4a5568" stroke="#2d3748" strokeWidth="1.5"/>
        <rect x="28" y="19" width="6" height="4" fill="#e63946" stroke="#c1121f" strokeWidth="1"/>
        <circle cx="61" cy="20" r="3" fill="#cbd5e0" opacity="0.7"/>
        <circle cx="59" cy="17" r="2.5" fill="#cbd5e0" opacity="0.6"/>
        <circle cx="63" cy="18" r="2" fill="#cbd5e0" opacity="0.5"/>
        <circle cx="31" cy="17" r="2.5" fill="#cbd5e0" opacity="0.7"/>
        <circle cx="29" cy="14" r="2" fill="#cbd5e0" opacity="0.6"/>
        <line x1="10" y1="30" x2="10" y2="50" stroke="#ffd700" strokeWidth="2"/>
        <rect x="8" y="28" width="4" height="4" fill="#d69e2e"/>
        <line x1="10" y1="30" x2="20" y2="30" stroke="#ffd700" strokeWidth="2"/>
        <rect x="18" y="30" width="2" height="6" fill="#d69e2e"/>
        <rect x="17" y="36" width="4" height="4" fill="#8b6f47" stroke="#6b5638" strokeWidth="1"/>
        <rect x="35" y="60" width="14" height="15" fill="#4a5568" stroke="#2d3748" strokeWidth="1.5"/>
        <line x1="35" y1="67" x2="49" y2="67" stroke="#2d3748" strokeWidth="1"/>
        <line x1="42" y1="60" x2="42" y2="75" stroke="#2d3748" strokeWidth="1"/>
        <rect x="25" y="30" width="30" height="6" fill="#d69e2e" stroke="#b7791f" strokeWidth="1" rx="1"/>
        <text x="40" y="34.5" fontSize="5" fontWeight="bold" fill="#fff" textAnchor="middle">MATERIALS</text>
      </g>
    </svg>
  );
}
