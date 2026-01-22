// Иконки грузов в игровом стиле

export function OilIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g>
        <ellipse cx="24" cy="14" rx="10" ry="3" fill="#2d3748" stroke="#1a202c" strokeWidth="1.5"/>
        <rect x="14" y="14" width="20" height="20" fill="#1a202c"/>
        <rect x="14" y="16" width="20" height="2" fill="#4a5568"/>
        <rect x="14" y="24" width="20" height="2" fill="#4a5568"/>
        <rect x="14" y="32" width="20" height="2" fill="#4a5568"/>
        <ellipse cx="24" cy="34" rx="10" ry="3" fill="#000000" stroke="#1a202c" strokeWidth="1.5"/>
        <circle cx="24" cy="24" r="6" fill="#ffd700" opacity="0.9"/>
        <text x="24" y="28" fontSize="10" fontWeight="bold" fill="#1a202c" textAnchor="middle">⚠</text>
        <ellipse cx="20" cy="18" rx="2" ry="4" fill="#4a5568" opacity="0.5"/>
      </g>
    </svg>
  );
}

export function MaterialsIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g>
        <path
          d="M12 18 L24 14 L36 18 L36 22 L24 18 L12 22 Z"
          fill="#d69e2e"
          stroke="#b7791f"
          strokeWidth="1.5"
        />
        <rect x="12" y="22" width="24" height="16" fill="#8b6f47" stroke="#6b5638" strokeWidth="1.5"/>
        <line x1="20" y1="22" x2="20" y2="38" stroke="#6b5638" strokeWidth="1"/>
        <line x1="28" y1="22" x2="28" y2="38" stroke="#6b5638" strokeWidth="1"/>
        <rect x="12" y="26" width="24" height="1.5" fill="#718096"/>
        <rect x="12" y="34" width="24" height="1.5" fill="#718096"/>
        <circle cx="15" cy="27" r="1" fill="#4a5568"/>
        <circle cx="33" cy="27" r="1" fill="#4a5568"/>
        <circle cx="15" cy="35" r="1" fill="#4a5568"/>
        <circle cx="33" cy="35" r="1" fill="#4a5568"/>
        <text x="24" y="32" fontSize="8" fontWeight="bold" fill="#d69e2e" textAnchor="middle">MAT</text>
        <ellipse cx="24" cy="39" rx="10" ry="2" fill="#000000" opacity="0.2"/>
      </g>
    </svg>
  );
}

export function ProvisionIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g>
        <path
          d="M14 20 L12 38 L36 38 L34 20 Z"
          fill="#d69e2e"
          stroke="#b7791f"
          strokeWidth="1.5"
        />
        <line x1="16" y1="20" x2="14" y2="38" stroke="#8b6f47" strokeWidth="1"/>
        <line x1="20" y1="20" x2="18" y2="38" stroke="#8b6f47" strokeWidth="1"/>
        <line x1="24" y1="20" x2="24" y2="38" stroke="#8b6f47" strokeWidth="1"/>
        <line x1="28" y1="20" x2="30" y2="38" stroke="#8b6f47" strokeWidth="1"/>
        <line x1="32" y1="20" x2="34" y2="38" stroke="#8b6f47" strokeWidth="1"/>
        <path
          d="M14 20 Q24 10 34 20"
          stroke="#8b6f47"
          strokeWidth="2"
          fill="none"
        />
        <ellipse cx="20" cy="28" rx="4" ry="3" fill="#f6ad55" stroke="#dd6b20" strokeWidth="1"/>
        <ellipse cx="20" cy="27" rx="1" ry="0.5" fill="#dd6b20"/>
        <ellipse cx="22" cy="27" rx="1" ry="0.5" fill="#dd6b20"/>
        <circle cx="28" cy="28" r="3" fill="#e53e3e" stroke="#c53030" strokeWidth="1"/>
        <path d="M28 25 Q28 24 27 24" stroke="#2f855a" strokeWidth="1" fill="none"/>
        <ellipse cx="27" cy="26" rx="1" ry="1.5" fill="#48bb78"/>
        <path
          d="M18 32 L24 34 L22 36 Z"
          fill="#ffd700"
          stroke="#d69e2e"
          strokeWidth="1"
        />
        <circle cx="20" cy="34" r="0.8" fill="#d69e2e"/>
        <ellipse cx="24" cy="39" rx="10" ry="2" fill="#000000" opacity="0.2"/>
      </g>
    </svg>
  );
}
