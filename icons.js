// SVG иконки для игры - экспорт из Figma

// Иконки судов
function getTankerIcon(size = 64) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g>
            <path d="M8 35 L12 45 L52 45 L56 35 L52 30 L12 30 Z" fill="#1e3a5f" stroke="#0d1f3a" stroke-width="1.5"/>
            <ellipse cx="20" cy="32" rx="5" ry="4" fill="#2c5282" stroke="#1a365d" stroke-width="1"/>
            <ellipse cx="32" cy="32" rx="5" ry="4" fill="#2c5282" stroke="#1a365d" stroke-width="1"/>
            <ellipse cx="44" cy="32" rx="5" ry="4" fill="#2c5282" stroke="#1a365d" stroke-width="1"/>
            <rect x="48" y="20" width="8" height="10" fill="#3b5998" stroke="#1a365d" stroke-width="1" rx="1"/>
            <rect x="49" y="22" width="2" height="2" fill="#ffd700"/>
            <rect x="53" y="22" width="2" height="2" fill="#ffd700"/>
            <rect x="50" y="16" width="4" height="5" fill="#e63946" stroke="#c1121f" stroke-width="1"/>
            <ellipse cx="52" cy="16" rx="2" ry="1" fill="#f77f00"/>
            <path d="M8 45 Q12 48 16 45 T24 45 T32 45 T40 45 T48 45 T56 45" stroke="#4299e1" stroke-width="2" fill="none"/>
        </g>
    </svg>`;
}

function getCargoShipIcon(size = 64) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g>
            <path d="M10 36 L14 46 L50 46 L54 36 L50 32 L14 32 Z" fill="#4a5568" stroke="#2d3748" stroke-width="1.5"/>
            <rect x="16" y="28" width="6" height="6" fill="#e53e3e" stroke="#c53030" stroke-width="1" rx="0.5"/>
            <rect x="24" y="28" width="6" height="6" fill="#3182ce" stroke="#2c5282" stroke-width="1" rx="0.5"/>
            <rect x="32" y="28" width="6" height="6" fill="#38a169" stroke="#2f855a" stroke-width="1" rx="0.5"/>
            <rect x="40" y="28" width="6" height="6" fill="#d69e2e" stroke="#b7791f" stroke-width="1" rx="0.5"/>
            <rect x="20" y="22" width="6" height="6" fill="#805ad5" stroke="#6b46c1" stroke-width="1" rx="0.5"/>
            <rect x="28" y="22" width="6" height="6" fill="#dd6b20" stroke="#c05621" stroke-width="1" rx="0.5"/>
            <rect x="36" y="22" width="6" height="6" fill="#319795" stroke="#2c7a7b" stroke-width="1" rx="0.5"/>
            <rect x="46" y="22" width="8" height="10" fill="#718096" stroke="#4a5568" stroke-width="1" rx="1"/>
            <rect x="47" y="24" width="2" height="2" fill="#ffd700"/>
            <rect x="51" y="24" width="2" height="2" fill="#ffd700"/>
            <rect x="48" y="18" width="4" height="5" fill="#e63946" stroke="#c1121f" stroke-width="1"/>
            <ellipse cx="50" cy="18" rx="2" ry="1" fill="#90cdf4"/>
            <path d="M10 46 Q14 49 18 46 T26 46 T34 46 T42 46 T50 46 T54 46" stroke="#4299e1" stroke-width="2" fill="none"/>
        </g>
    </svg>`;
}

function getSupplyShipIcon(size = 64) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g>
            <path d="M12 38 L16 46 L48 46 L52 38 L48 34 L16 34 Z" fill="#48bb78" stroke="#2f855a" stroke-width="1.5"/>
            <rect x="18" y="30" width="28" height="6" fill="#68d391" stroke="#38a169" stroke-width="1" rx="1"/>
            <rect x="20" y="26" width="6" height="5" fill="#f6ad55" stroke="#dd6b20" stroke-width="1" rx="0.5"/>
            <rect x="28" y="26" width="6" height="5" fill="#fc8181" stroke="#e53e3e" stroke-width="1" rx="0.5"/>
            <rect x="36" y="26" width="6" height="5" fill="#90cdf4" stroke="#3182ce" stroke-width="1" rx="0.5"/>
            <rect x="42" y="24" width="8" height="10" fill="#f7fafc" stroke="#a0aec0" stroke-width="1" rx="1"/>
            <rect x="43" y="26" width="2" height="2" fill="#4299e1"/>
            <rect x="47" y="26" width="2" height="2" fill="#4299e1"/>
            <rect x="43" y="29" width="2" height="2" fill="#4299e1"/>
            <rect x="47" y="29" width="2" height="2" fill="#4299e1"/>
            <rect x="44" y="20" width="4" height="5" fill="#e63946" stroke="#c1121f" stroke-width="1"/>
            <ellipse cx="46" cy="20" rx="2" ry="1" fill="#90cdf4"/>
            <g transform="translate(14, 36)">
                <circle cx="0" cy="0" r="1.5" fill="#f7fafc"/>
                <rect x="-0.5" y="0" width="1" height="3" fill="#f7fafc"/>
                <path d="M-2 3 L2 3" stroke="#f7fafc" stroke-width="1"/>
            </g>
            <path d="M12 46 Q16 49 20 46 T28 46 T36 46 T44 46 T52 46" stroke="#4299e1" stroke-width="2" fill="none"/>
        </g>
    </svg>`;
}

// Иконки грузов
function getOilIcon(size = 48) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g>
            <ellipse cx="24" cy="14" rx="10" ry="3" fill="#2d3748" stroke="#1a202c" stroke-width="1.5"/>
            <rect x="14" y="14" width="20" height="20" fill="#1a202c"/>
            <rect x="14" y="16" width="20" height="2" fill="#4a5568"/>
            <rect x="14" y="24" width="20" height="2" fill="#4a5568"/>
            <rect x="14" y="32" width="20" height="2" fill="#4a5568"/>
            <ellipse cx="24" cy="34" rx="10" ry="3" fill="#000000" stroke="#1a202c" stroke-width="1.5"/>
            <circle cx="24" cy="24" r="6" fill="#ffd700" opacity="0.9"/>
            <text x="24" y="28" font-size="10" font-weight="bold" fill="#1a202c" text-anchor="middle">⚠</text>
            <ellipse cx="20" cy="18" rx="2" ry="4" fill="#4a5568" opacity="0.5"/>
        </g>
    </svg>`;
}

function getMaterialsIcon(size = 48) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g>
            <path d="M12 18 L24 14 L36 18 L36 22 L24 18 L12 22 Z" fill="#d69e2e" stroke="#b7791f" stroke-width="1.5"/>
            <rect x="12" y="22" width="24" height="16" fill="#8b6f47" stroke="#6b5638" stroke-width="1.5"/>
            <line x1="20" y1="22" x2="20" y2="38" stroke="#6b5638" stroke-width="1"/>
            <line x1="28" y1="22" x2="28" y2="38" stroke="#6b5638" stroke-width="1"/>
            <rect x="12" y="26" width="24" height="1.5" fill="#718096"/>
            <rect x="12" y="34" width="24" height="1.5" fill="#718096"/>
            <circle cx="15" cy="27" r="1" fill="#4a5568"/>
            <circle cx="33" cy="27" r="1" fill="#4a5568"/>
            <circle cx="15" cy="35" r="1" fill="#4a5568"/>
            <circle cx="33" cy="35" r="1" fill="#4a5568"/>
            <text x="24" y="32" font-size="8" font-weight="bold" fill="#d69e2e" text-anchor="middle">MAT</text>
            <ellipse cx="24" cy="39" rx="10" ry="2" fill="#000000" opacity="0.2"/>
        </g>
    </svg>`;
}

function getProvisionIcon(size = 48) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g>
            <path d="M14 20 L12 38 L36 38 L34 20 Z" fill="#d69e2e" stroke="#b7791f" stroke-width="1.5"/>
            <line x1="16" y1="20" x2="14" y2="38" stroke="#8b6f47" stroke-width="1"/>
            <line x1="20" y1="20" x2="18" y2="38" stroke="#8b6f47" stroke-width="1"/>
            <line x1="24" y1="20" x2="24" y2="38" stroke="#8b6f47" stroke-width="1"/>
            <line x1="28" y1="20" x2="30" y2="38" stroke="#8b6f47" stroke-width="1"/>
            <line x1="32" y1="20" x2="34" y2="38" stroke="#8b6f47" stroke-width="1"/>
            <path d="M14 20 Q24 10 34 20" stroke="#8b6f47" stroke-width="2" fill="none"/>
            <ellipse cx="20" cy="28" rx="4" ry="3" fill="#f6ad55" stroke="#dd6b20" stroke-width="1"/>
            <ellipse cx="20" cy="27" rx="1" ry="0.5" fill="#dd6b20"/>
            <ellipse cx="22" cy="27" rx="1" ry="0.5" fill="#dd6b20"/>
            <circle cx="28" cy="28" r="3" fill="#e53e3e" stroke="#c53030" stroke-width="1"/>
            <path d="M28 25 Q28 24 27 24" stroke="#2f855a" stroke-width="1" fill="none"/>
            <ellipse cx="27" cy="26" rx="1" ry="1.5" fill="#48bb78"/>
            <path d="M18 32 L24 34 L22 36 Z" fill="#ffd700" stroke="#d69e2e" stroke-width="1"/>
            <circle cx="20" cy="34" r="0.8" fill="#d69e2e"/>
            <ellipse cx="24" cy="39" rx="10" ry="2" fill="#000000" opacity="0.2"/>
        </g>
    </svg>`;
}

// Иконки заводов
function getOilFactoryIcon(size = 80) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g>
            <rect x="15" y="45" width="50" height="30" fill="#2d3748" stroke="#1a202c" stroke-width="2" rx="2"/>
            <rect x="20" y="50" width="6" height="8" fill="#ffd700" opacity="0.8"/>
            <rect x="30" y="50" width="6" height="8" fill="#ffd700" opacity="0.8"/>
            <rect x="40" y="50" width="6" height="8" fill="#ffd700" opacity="0.6"/>
            <rect x="50" y="50" width="6" height="8" fill="#ffd700" opacity="0.8"/>
            <rect x="20" y="62" width="6" height="8" fill="#ffd700" opacity="0.6"/>
            <rect x="30" y="62" width="6" height="8" fill="#ffd700" opacity="0.8"/>
            <rect x="40" y="62" width="6" height="8" fill="#ffd700" opacity="0.8"/>
            <rect x="50" y="62" width="6" height="8" fill="#ffd700" opacity="0.6"/>
            <rect x="22" y="15" width="8" height="30" fill="#4a5568" stroke="#2d3748" stroke-width="1.5"/>
            <rect x="35" y="20" width="8" height="25" fill="#4a5568" stroke="#2d3748" stroke-width="1.5"/>
            <rect x="48" y="18" width="8" height="27" fill="#4a5568" stroke="#2d3748" stroke-width="1.5"/>
            <rect x="22" y="12" width="8" height="4" fill="#e63946" stroke="#c1121f" stroke-width="1"/>
            <rect x="35" y="17" width="8" height="4" fill="#e63946" stroke="#c1121f" stroke-width="1"/>
            <rect x="48" y="15" width="8" height="4" fill="#e63946" stroke="#c1121f" stroke-width="1"/>
            <circle cx="26" cy="10" r="3" fill="#90cdf4" opacity="0.6"/>
            <circle cx="24" cy="7" r="2.5" fill="#90cdf4" opacity="0.5"/>
            <circle cx="28" cy="8" r="2" fill="#90cdf4" opacity="0.4"/>
            <circle cx="39" cy="15" r="3" fill="#90cdf4" opacity="0.6"/>
            <circle cx="37" cy="12" r="2.5" fill="#90cdf4" opacity="0.5"/>
            <circle cx="52" cy="13" r="3" fill="#90cdf4" opacity="0.6"/>
            <circle cx="54" cy="10" r="2.5" fill="#90cdf4" opacity="0.5"/>
            <circle cx="70" cy="60" r="8" fill="#1a202c" stroke="#0d0f14" stroke-width="2"/>
            <rect x="62" y="60" width="16" height="15" fill="#1a202c"/>
            <ellipse cx="70" cy="75" rx="8" ry="2" fill="#0d0f14"/>
            <path d="M62 65 L78 65" stroke="#4a5568" stroke-width="1"/>
            <path d="M62 70 L78 70" stroke="#4a5568" stroke-width="1"/>
            <circle cx="40" cy="38" r="5" fill="#ffd700"/>
            <text x="40" y="42" font-size="8" font-weight="bold" fill="#1a202c" text-anchor="middle">⛽</text>
        </g>
    </svg>`;
}

function getProvisionFactoryIcon(size = 80) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g>
            <rect x="15" y="40" width="50" height="35" fill="#f7fafc" stroke="#cbd5e0" stroke-width="2" rx="2"/>
            <path d="M10 40 L40 25 L70 40 Z" fill="#e53e3e" stroke="#c53030" stroke-width="2"/>
            <rect x="20" y="48" width="8" height="10" fill="#4299e1" opacity="0.7"/>
            <rect x="32" y="48" width="8" height="10" fill="#4299e1" opacity="0.7"/>
            <rect x="44" y="48" width="8" height="10" fill="#4299e1" opacity="0.7"/>
            <rect x="56" y="48" width="8" height="10" fill="#4299e1" opacity="0.7"/>
            <rect x="35" y="60" width="10" height="15" fill="#8b6f47" stroke="#6b5638" stroke-width="1.5" rx="1"/>
            <circle cx="42" cy="67" r="1" fill="#ffd700"/>
            <rect x="48" y="20" width="6" height="10" fill="#718096" stroke="#4a5568" stroke-width="1"/>
            <rect x="47" y="18" width="8" height="3" fill="#e63946" stroke="#c1121f" stroke-width="1"/>
            <circle cx="51" cy="15" r="2.5" fill="#cbd5e0" opacity="0.7"/>
            <circle cx="49" cy="12" r="2" fill="#cbd5e0" opacity="0.6"/>
            <circle cx="53" cy="13" r="2" fill="#cbd5e0" opacity="0.5"/>
            <g transform="translate(20, 30)">
                <ellipse cx="0" cy="6" rx="4" ry="2" fill="#d69e2e"/>
                <rect x="-4" y="0" width="8" height="6" fill="#f6ad55" stroke="#dd6b20" stroke-width="1"/>
                <path d="M-2 0 Q0 -2 2 0" stroke="#dd6b20" stroke-width="1" fill="none"/>
            </g>
            <g transform="translate(54, 30)">
                <rect x="-4" y="0" width="8" height="6" fill="#48bb78" stroke="#2f855a" stroke-width="1"/>
                <line x1="-4" y1="2" x2="4" y2="2" stroke="#2f855a" stroke-width="0.5"/>
                <line x1="-4" y1="4" x2="4" y2="4" stroke="#2f855a" stroke-width="0.5"/>
            </g>
            <rect x="25" y="35" width="30" height="6" fill="#48bb78" stroke="#2f855a" stroke-width="1" rx="1"/>
            <text x="40" y="40" font-size="6" font-weight="bold" fill="#fff" text-anchor="middle">FOOD</text>
        </g>
    </svg>`;
}

function getMaterialFactoryIcon(size = 80) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g>
            <rect x="15" y="45" width="50" height="30" fill="#718096" stroke="#4a5568" stroke-width="2" rx="2"/>
            <rect x="25" y="35" width="30" height="12" fill="#a0aec0" stroke="#718096" stroke-width="2" rx="1"/>
            <rect x="20" y="52" width="6" height="8" fill="#ffd700" opacity="0.8"/>
            <rect x="30" y="52" width="6" height="8" fill="#ffd700" opacity="0.6"/>
            <rect x="40" y="52" width="6" height="8" fill="#ffd700" opacity="0.8"/>
            <rect x="50" y="52" width="6" height="8" fill="#ffd700" opacity="0.6"/>
            <rect x="25" y="64" width="6" height="8" fill="#ffd700" opacity="0.7"/>
            <rect x="45" y="64" width="6" height="8" fill="#ffd700" opacity="0.7"/>
            <rect x="30" y="38" width="5" height="6" fill="#ffd700" opacity="0.7"/>
            <rect x="40" y="38" width="5" height="6" fill="#ffd700" opacity="0.7"/>
            <rect x="58" y="25" width="7" height="20" fill="#4a5568" stroke="#2d3748" stroke-width="1.5"/>
            <rect x="58" y="22" width="7" height="4" fill="#e63946" stroke="#c1121f" stroke-width="1"/>
            <rect x="28" y="22" width="6" height="13" fill="#4a5568" stroke="#2d3748" stroke-width="1.5"/>
            <rect x="28" y="19" width="6" height="4" fill="#e63946" stroke="#c1121f" stroke-width="1"/>
            <circle cx="61" cy="20" r="3" fill="#cbd5e0" opacity="0.7"/>
            <circle cx="59" cy="17" r="2.5" fill="#cbd5e0" opacity="0.6"/>
            <circle cx="63" cy="18" r="2" fill="#cbd5e0" opacity="0.5"/>
            <circle cx="31" cy="17" r="2.5" fill="#cbd5e0" opacity="0.7"/>
            <circle cx="29" cy="14" r="2" fill="#cbd5e0" opacity="0.6"/>
            <line x1="10" y1="30" x2="10" y2="50" stroke="#ffd700" stroke-width="2"/>
            <rect x="8" y="28" width="4" height="4" fill="#d69e2e"/>
            <line x1="10" y1="30" x2="20" y2="30" stroke="#ffd700" stroke-width="2"/>
            <rect x="18" y="30" width="2" height="6" fill="#d69e2e"/>
            <rect x="17" y="36" width="4" height="4" fill="#8b6f47" stroke="#6b5638" stroke-width="1"/>
            <rect x="35" y="60" width="14" height="15" fill="#4a5568" stroke="#2d3748" stroke-width="1.5"/>
            <line x1="35" y1="67" x2="49" y2="67" stroke="#2d3748" stroke-width="1"/>
            <line x1="42" y1="60" x2="42" y2="75" stroke="#2d3748" stroke-width="1"/>
            <rect x="25" y="30" width="30" height="6" fill="#d69e2e" stroke="#b7791f" stroke-width="1" rx="1"/>
            <text x="40" y="34.5" font-size="5" font-weight="bold" fill="#fff" text-anchor="middle">MATERIALS</text>
        </g>
    </svg>`;
}

// Экспорт функций для использования в app.js
window.ShipIcons = {
    getTankerIcon,
    getCargoShipIcon,
    getSupplyShipIcon
};

window.CargoIcons = {
    getOilIcon,
    getMaterialsIcon,
    getProvisionIcon
};

window.FactoryIcons = {
    getOilFactoryIcon,
    getProvisionFactoryIcon,
    getMaterialFactoryIcon
};
