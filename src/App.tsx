import { useState, useEffect } from 'react';
import { 
  Anchor, 
  Coins, 
  User, 
  Ship, 
  Factory, 
  Fuel, 
  Heart, 
  MapPin, 
  Package, 
  Plus, 
  X, 
  Users, 
  Wrench, 
  TrendingUp, 
  DollarSign, 
  ArrowRight,
  AlertCircle,
  Send 
} from 'lucide-react';

// Импорт иконок из Figma
import { TankerIcon, CargoShipIcon, SupplyShipIcon } from './components/icons/ShipIcons';
import { OilIcon, MaterialsIcon, ProvisionIcon } from './components/icons/CargoIcons';
import { OilFactoryIcon, ProvisionFactoryIcon, MaterialFactoryIcon } from './components/icons/FactoryIcons';
import { LoadIcon, UnloadIcon, SendIcon, RefuelIcon, RepairIcon, TowIcon } from './components/icons/ActionIcons';
import { AnchorDecoration } from './components/icons/DecorationIcons';

// Импорт компонентов
import { PortCard } from './components/PortCard';

// Импорт API функций
import * as api from './api';

// Types
interface ShipData {
  id: string;
  name: string;
  type: 'tanker' | 'cargo' | 'supply';
  currentPortId?: string;
  currentPort?: string;
  fuel: number;
  maxFuel: number;
  health: number;
  maxHealth: number;
  cargo?: { type: string; amount: number };
  loadingPort?: string;
  totalDistanceNm?: number;
  totalTrips?: number;
  isTraveling?: boolean;
}

interface PortData {
  id: string;
  name: string;
  availableCargo?: { type: string; name?: string; amount: number; price?: number }[];
  requiredCargo?: { type: string; name?: string; amount: number }[];
}

interface ShipStats {
  shipName: string;
  shipType: 'tanker' | 'cargo' | 'supply';
  distance: number;
  trips: number;
  cargoDelivered: number;
  profit: number;
  expenses: {
    fuel: number;
    cargo: number;
    repair: number;
    tow: number;
  };
}

// Utility functions для преобразования типов
const getShipTypeName = (type: string): string => {
  const types: { [key: string]: string } = {
    'tanker': 'Танкер',
    'cargo': 'Грузовое',
    'supply': 'Снабженец'
  };
  return types[type] || type;
};

const getShipTypeFromName = (name: string): 'tanker' | 'cargo' | 'supply' => {
  const types: { [key: string]: 'tanker' | 'cargo' | 'supply' } = {
    'Танкер': 'tanker',
    'Грузовое': 'cargo',
    'Снабженец': 'supply'
  };
  return types[name] || 'cargo';
};

const getCargoName = (type: string): string => {
  const names: { [key: string]: string } = {
    'oil': 'Нефть',
    'materials': 'Материалы',
    'provisions': 'Провизия'
  };
  return names[type] || type;
};

const getCargoType = (name: string): string => {
  const types: { [key: string]: string } = {
    'Нефть': 'oil',
    'Материалы': 'materials',
    'Провизия': 'provisions'
  };
  return types[name] || name;
};

// ProgressBar Component
function ProgressBar({ 
  value, 
  max, 
  color = 'blue', 
  showLabel = true 
}: { 
  value: number; 
  max: number; 
  color?: 'blue' | 'green' | 'orange' | 'red'; 
  showLabel?: boolean;
}) {
  const percentage = (value / max) * 100;
  
  const colorClasses = {
    blue: 'bg-[#2481cc]',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
  };

  return (
    <div className="w-full">
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${colorClasses[color]}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-gray-600 mt-1">
          {value}/{max}
        </span>
      )}
    </div>
  );
}

// Header Component
function Header({ balance, userName }: { balance: number; userName: string }) {
  return (
    <header className="bg-[#2481cc] text-white px-4 py-4 shadow-lg sticky top-0 z-50">
      <div className="flex items-center justify-between max-w-md mx-auto">
        <div className="flex items-center gap-2">
          <Anchor className="w-6 h-6" />
          <h1 className="text-lg">Морское Судоходство</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white/20 px-3 py-1.5 rounded-full">
            <Coins className="w-4 h-4" />
            <span className="text-sm">{balance.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 bg-white/20 px-2 py-1.5 rounded-full">
            <div className="w-6 h-6 bg-white/40 rounded-full flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <span className="text-sm">{userName}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

// Navigation Component
function Navigation({ 
  activeTab, 
  onTabChange 
}: { 
  activeTab: 'ships' | 'ports' | 'fleet'; 
  onTabChange: (tab: 'ships' | 'ports' | 'fleet') => void;
}) {
  const tabs = [
    { id: 'ships' as const, label: 'Судна', icon: Ship },
    { id: 'ports' as const, label: 'Порты', icon: Factory },
    { id: 'fleet' as const, label: 'Флот', icon: Anchor },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-[72px] z-40">
      <div className="max-w-md mx-auto flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 transition-colors ${
                activeTab === tab.id
                  ? 'text-[#2481cc] border-b-2 border-[#2481cc]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ShipCard Component
function ShipCard({ ship, onClick, ports }: { ship: ShipData; onClick: () => void; ports?: PortData[] }) {
  const getFuelColor = (fuel: number, maxFuel: number) => {
    const percentage = (fuel / maxFuel) * 100;
    if (percentage < 20) return 'red';
    if (percentage < 50) return 'orange';
    return 'green';
  };

  const getHealthColor = (health: number) => {
    if (health < 30) return 'red';
    if (health < 70) return 'orange';
    return 'green';
  };

  const ShipIconComponent = ship.type === 'tanker' ? TankerIcon : ship.type === 'cargo' ? CargoShipIcon : SupplyShipIcon;
  
  // Получаем название порта
  const port = ports?.find(p => p.id === ship.currentPortId || p.name === ship.currentPort);
  const portName = port?.name || ship.currentPort || (ship.isTraveling ? 'В пути...' : 'Неизвестный порт');

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow border border-gray-100"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-14 h-14 flex items-center justify-center">
            <ShipIconComponent size={56} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{ship.name}</h3>
            <span className="text-xs text-gray-500">{getShipTypeName(ship.type)}</span>
          </div>
        </div>
        {ship.cargo && (
          <div className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full">
            Загружен
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4" />
          <span>{portName}</span>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 text-sm text-gray-700">
              <Fuel className="w-4 h-4" />
              <span>Топливо</span>
            </div>
          </div>
          <ProgressBar
            value={ship.fuel}
            max={ship.maxFuel}
            color={getFuelColor(ship.fuel, ship.maxFuel)}
            showLabel={true}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 text-sm text-gray-700">
              <Heart className="w-4 h-4" />
              <span>Здоровье</span>
            </div>
          </div>
          <ProgressBar
            value={ship.health}
            max={ship.maxHealth || 100}
            color={getHealthColor(ship.health)}
            showLabel={true}
          />
        </div>

        {ship.cargo && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8">
                {ship.cargo.type === 'oil' && <OilIcon size={32} />}
                {ship.cargo.type === 'materials' && <MaterialsIcon size={32} />}
                {ship.cargo.type === 'provisions' && <ProvisionIcon size={32} />}
              </div>
              <div className="text-xs text-gray-600">
                Груз: <span className="font-semibold text-gray-800">
                  {getCargoName(ship.cargo.type)}
                </span> ({ship.cargo.amount} ед.)
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ShipModal Component (упрощенная версия - полная версия слишком большая, добавим основные функции)
function ShipModal({
  ship,
  ports,
  balance,
  onClose,
  onLoadCargo,
  onUnloadCargo,
  onSendToPort,
  onRefuel,
  onRepair,
  onTow,
}: {
  ship: ShipData;
  ports: PortData[];
  balance: number;
  onClose: () => void;
  onLoadCargo: (cargoType: string, amount: number) => void;
  onUnloadCargo: () => void;
  onSendToPort: (portId: string) => void;
  onRefuel: (amount: number) => void;
  onRepair: () => void;
  onTow: () => void;
}) {
  // Находим порт по ID или по названию (для обратной совместимости)
  const currentPort = ports.find((p) => 
    p.id === ship.currentPortId || p.name === ship.currentPort
  );
  const portName = currentPort?.name || ship.currentPort || 'В пути...';
  const isInOilPort = portName.includes('Нефтяной');
  const canRefuel = ship.fuel < ship.maxFuel && isInOilPort;
  const needsRepair = ship.health < 100;
  const needsTow = ship.fuel < 5 && !isInOilPort;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#2481cc] text-white p-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ship className="w-6 h-6" />
            <h2 className="text-lg font-semibold">{ship.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Тип судна:</span>
              <span className="font-semibold text-gray-900">{getShipTypeName(ship.type)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                Текущий порт:
              </span>
              <span className="font-semibold text-gray-900">{portName}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Fuel className="w-4 h-4 text-gray-700" />
                <span className="text-sm font-semibold text-gray-700">Топливо</span>
              </div>
              <ProgressBar value={ship.fuel} max={ship.maxFuel} color="green" />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-4 h-4 text-gray-700" />
                <span className="text-sm font-semibold text-gray-700">Здоровье</span>
              </div>
              <ProgressBar value={ship.health} max={ship.maxHealth || 100} color="green" />
            </div>
          </div>

          {ship.cargo ? (
            <div className="border border-gray-200 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Текущий груз
              </h3>
              <div className="bg-orange-50 p-3 rounded-lg mb-2">
                <div className="text-sm text-gray-700">
                  <strong>{getCargoName(ship.cargo.type)}</strong> ({ship.cargo.amount} ед.)
                </div>
              </div>
              <button
                onClick={onUnloadCargo}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-3 rounded-lg transition-colors text-sm"
              >
                Выгрузить груз
              </button>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Загрузить груз
              </h3>
              <p className="text-xs text-gray-600 mb-2">Выберите груз для загрузки</p>
              {currentPort?.availableCargo?.map((cargo, idx) => (
                <button
                  key={idx}
                  onClick={() => onLoadCargo(cargo.type, 10)}
                  className="w-full bg-green-50 hover:bg-green-100 text-green-700 py-2 px-3 rounded-lg transition-colors text-sm mb-2"
                >
                  {getCargoName(cargo.type)} ({cargo.amount} ед.)
                </button>
              ))}
            </div>
          )}

          <div className="border border-gray-200 rounded-lg p-3">
            <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Отправить в порт
            </h3>
            <div className="space-y-2">
              {ports
                .filter((p) => p.id !== ship.currentPortId && p.name !== ship.currentPort)
                .map((port) => (
                  <button
                    key={port.id}
                    onClick={() => onSendToPort(port.id)}
                    className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 px-3 rounded-lg transition-colors text-sm text-left"
                  >
                    {port.name}
                  </button>
                ))}
            </div>
          </div>

          {canRefuel && (
            <button
              onClick={() => onRefuel(ship.maxFuel - ship.fuel)}
              className="w-full bg-[#2481cc] hover:bg-[#1d6ba8] text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Fuel className="w-5 h-5" />
              Бункеровка (заправить топливом)
            </button>
          )}

          {needsRepair && (
            <button
              onClick={onRepair}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Wrench className="w-5 h-5" />
              Починить судно (💰 500)
            </button>
          )}

          {needsTow && (
            <button
              onClick={onTow}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Anchor className="w-5 h-5" />
              Буксировка (💰 1000)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// PortModal Component
function PortModal({ port, onClose }: { port: PortData; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#2481cc] text-white p-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Factory className="w-6 h-6" />
            <h2 className="text-lg font-semibold">{port.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {port.availableCargo && port.availableCargo.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-green-600" />
                Доступные грузы для погрузки
              </h3>
              <div className="space-y-2">
                {port.availableCargo.map((cargo, idx) => (
                  <div
                    key={idx}
                    className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6">
                          {cargo.type === 'oil' && <OilIcon size={24} />}
                          {cargo.type === 'materials' && <MaterialsIcon size={24} />}
                          {cargo.type === 'provisions' && <ProvisionIcon size={24} />}
                        </div>
                        <span className="font-medium">{getCargoName(cargo.type)}</span>
                      </div>
                      <span className="text-xs bg-green-200 px-2 py-1 rounded-full font-semibold">{cargo.amount} ед.</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {port.requiredCargo && port.requiredCargo.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-orange-600" />
                Требуемые грузы для генерации
              </h3>
              <div className="space-y-2">
                {port.requiredCargo.map((cargo, idx) => (
                  <div
                    key={idx}
                    className="bg-orange-50 border border-orange-200 text-orange-900 px-4 py-3 rounded-lg"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6">
                          {cargo.type === 'oil' && <OilIcon size={24} />}
                          {cargo.type === 'materials' && <MaterialsIcon size={24} />}
                          {cargo.type === 'provisions' && <ProvisionIcon size={24} />}
                        </div>
                        <span className="font-semibold text-base">{getCargoName(cargo.type)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// BuyShipModal Component
function BuyShipModal({ 
  onClose, 
  onBuyShip 
}: { 
  onClose: () => void; 
  onBuyShip: (type: 'tanker' | 'cargo' | 'supply') => void;
}) {
  const shipTypes = [
    {
      type: 'cargo' as const,
      price: 5000,
      description: 'Универсальное грузовое судно для перевозки различных товаров',
    },
    {
      type: 'tanker' as const,
      price: 7000,
      description: 'Специализированное судно для перевозки нефти и нефтепродуктов',
    },
    {
      type: 'supply' as const,
      price: 6000,
      description: 'Судно снабжения для доставки провизии и материалов',
    },
  ];

  const getShipIcon = (type: string) => {
    if (type === 'tanker') return TankerIcon;
    if (type === 'cargo') return CargoShipIcon;
    return SupplyShipIcon;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#2481cc] text-white p-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ship className="w-6 h-6" />
            <h2 className="text-lg font-semibold">Купить судно</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {shipTypes.map((ship) => {
            const ShipIconComponent = getShipIcon(ship.type);
            return (
              <div
                key={ship.type}
                onClick={() => onBuyShip(ship.type)}
                className="bg-white border-2 border-gray-200 hover:border-[#2481cc] rounded-xl p-4 cursor-pointer transition-all hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
                    <ShipIconComponent size={64} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900">{getShipTypeName(ship.type)}</h3>
                      <div className="flex items-center gap-1 bg-[#2481cc] text-white px-3 py-1 rounded-full">
                        <Coins className="w-4 h-4" />
                        <span className="font-semibold">{ship.price.toLocaleString()}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">{ship.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Main App Component
function App() {
  const [activeTab, setActiveTab] = useState<'ships' | 'ports' | 'fleet'>('ships');
  const [balance, setBalance] = useState(0);
  const [userName, setUserName] = useState('Игрок');
  const [selectedShip, setSelectedShip] = useState<ShipData | null>(null);
  const [selectedPort, setSelectedPort] = useState<PortData | null>(null);
  const [showBuyShipModal, setShowBuyShipModal] = useState(false);
  const [ships, setShips] = useState<ShipData[]>([]);
  const [ports, setPorts] = useState<PortData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | number | null>(null);

  // Функция для преобразования ship данных с currentPortId в currentPort
  const enrichShipData = (ship: any, portsList: PortData[]): ShipData => {
    const port = portsList.find(p => p.id === ship.currentPortId);
    return {
      ...ship,
      currentPort: port?.name || (ship.isTraveling ? 'В пути...' : 'Неизвестный порт'),
      currentPortId: ship.currentPortId,
    };
  };

  // Функция обновления данных
  const refreshData = async () => {
    if (!userId) return;
    try {
      // Сначала загружаем порты
      const portsData = await api.getPorts();
      const portsList = portsData.ports || [];
      setPorts(portsList);
      
      // Затем загружаем суда и обогащаем их данными о портах
      const userData = await api.getUser(userId);
      setBalance(userData.coins || 0);
      
      const enrichedShips = (userData.ships || []).map((ship: any) => 
        enrichShipData(ship, portsList)
      );
      setShips(enrichedShips);
    } catch (err: any) {
      console.error('Ошибка обновления данных:', err);
    }
  };

  // Инициализация приложения
  useEffect(() => {
    initApp();
  }, []);

  async function initApp() {
    try {
      setLoading(true);
      
      // Получаем данные пользователя из Telegram
      const telegramUser = (window as any).TelegramWebApp;
      if (!telegramUser?.userId) {
        setError('Telegram Web App не доступен');
        setLoading(false);
        return;
      }

      const id = telegramUser.userId;
      setUserId(id);
      const username = telegramUser.username || 'Игрок';
      setUserName(username);

      // Инициализируем пользователя
      await api.initUser(id, username);

      // Загружаем порты сначала
      const portsData = await api.getPorts();
      const portsList = portsData.ports || [];
      setPorts(portsList);

      // Загружаем данные пользователя
      const userData = await api.getUser(id);
      setBalance(userData.coins || 0);
      
      // Обогащаем суда данными о портах
      const enrichedShips = (userData.ships || []).map((ship: any) => 
        enrichShipData(ship, portsList)
      );
      setShips(enrichedShips);

      // Проверяем завершенные путешествия
      await api.checkCompletedTravels();

      setLoading(false);
    } catch (err: any) {
      console.error('Ошибка инициализации:', err);
      setError(err.message || 'Ошибка загрузки данных');
      setLoading(false);
    }
  }

  // Обработчики действий
  const handleLoadCargo = async (cargoType: string, amount: number) => {
    if (!selectedShip || !userId) return;
    try {
      await api.loadCargo(selectedShip.id, cargoType, amount);
      await refreshData();
      setSelectedShip(null);
    } catch (err: any) {
      alert(err.message || 'Ошибка загрузки груза');
    }
  };

  const handleUnloadCargo = async () => {
    if (!selectedShip || !userId) return;
    try {
      await api.unloadCargo(selectedShip.id);
      await refreshData();
      setSelectedShip(null);
    } catch (err: any) {
      alert(err.message || 'Ошибка выгрузки груза');
    }
  };

  const handleSendToPort = async (portId: string) => {
    if (!selectedShip || !userId) return;
    try {
      await api.sendShipToPort(selectedShip.id, portId);
      await refreshData();
      setSelectedShip(null);
    } catch (err: any) {
      alert(err.message || 'Ошибка отправки судна');
    }
  };

  const handleRefuel = async (amount: number) => {
    if (!selectedShip || !userId) return;
    try {
      await api.refuelShip(selectedShip.id, amount);
      await refreshData();
      setSelectedShip(null);
    } catch (err: any) {
      alert(err.message || 'Ошибка заправки');
    }
  };

  const handleRepair = async () => {
    if (!selectedShip || !userId) return;
    try {
      await api.repairShip(selectedShip.id);
      await refreshData();
      setSelectedShip(null);
    } catch (err: any) {
      alert(err.message || 'Ошибка ремонта');
    }
  };

  const handleTow = async () => {
    if (!selectedShip || !userId) return;
    try {
      await api.towShip(selectedShip.id);
      await refreshData();
      setSelectedShip(null);
    } catch (err: any) {
      alert(err.message || 'Ошибка буксировки');
    }
  };

  const handleBuyShip = async (type: 'tanker' | 'cargo' | 'supply') => {
    if (!userId) return;
    try {
      await api.buyShip(userId, type);
      await refreshData();
      setShowBuyShipModal(false);
    } catch (err: any) {
      alert(err.message || 'Ошибка покупки судна');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2481cc] mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
          <h2 className="text-red-800 font-semibold mb-2">Ошибка</h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={initApp}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header balance={balance} userName={userName} />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="max-w-md mx-auto p-4 pb-24">
        {activeTab === 'ships' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Ship className="w-8 h-8 text-[#2481cc]" />
              Ваши суда
            </h2>
            {ships.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>У вас пока нет судов</p>
                <button
                  onClick={() => setShowBuyShipModal(true)}
                  className="mt-4 bg-[#2481cc] text-white px-4 py-2 rounded-lg hover:bg-[#1d6ba8]"
                >
                  Купить первое судно
                </button>
              </div>
            ) : (
              ships.map((ship) => (
                <ShipCard
                  key={ship.id}
                  ship={ship}
                  ports={ports}
                  onClick={() => setSelectedShip(ship)}
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'ports' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Factory className="w-8 h-8 text-[#2481cc]" />
              Порты
            </h2>
            {ports.map((port) => (
              <PortCard
                key={port.id}
                port={port}
                onClick={() => setSelectedPort(port)}
              />
            ))}
          </div>
        )}

        {activeTab === 'fleet' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <AnchorDecoration size={32} />
              Статистика флота
            </h2>
            <div className="bg-gradient-to-br from-[#2481cc] to-[#1d6ba8] text-white rounded-xl p-4 shadow-lg">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Ship className="w-5 h-5" />
                Общая статистика
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/10 rounded-lg p-3">
                  <div className="text-xs opacity-80 mb-1">Судов</div>
                  <div className="text-xl font-bold">{ships.length}</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <div className="text-xs opacity-80 mb-1">Баланс</div>
                  <div className="text-xl font-bold">💰 {balance.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {selectedShip && (
        <ShipModal
          ship={selectedShip}
          ports={ports}
          balance={balance}
          onClose={() => setSelectedShip(null)}
          onLoadCargo={handleLoadCargo}
          onUnloadCargo={handleUnloadCargo}
          onSendToPort={handleSendToPort}
          onRefuel={handleRefuel}
          onRepair={handleRepair}
          onTow={handleTow}
        />
      )}

      {selectedPort && (
        <PortModal
          port={selectedPort}
          onClose={() => setSelectedPort(null)}
        />
      )}

      {showBuyShipModal && (
        <BuyShipModal
          onClose={() => setShowBuyShipModal(false)}
          onBuyShip={handleBuyShip}
        />
      )}

      {activeTab === 'ships' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
          <div className="max-w-md mx-auto">
            <button
              onClick={() => setShowBuyShipModal(true)}
              className="w-full bg-[#2481cc] hover:bg-[#1d6ba8] text-white py-4 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              <Plus className="w-5 h-5" />
              Купить судно
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
