import { Factory, Package } from 'lucide-react';
import { OilFactoryIcon, ProvisionFactoryIcon, MaterialFactoryIcon } from './icons/FactoryIcons';
import { OilIcon, MaterialsIcon, ProvisionIcon } from './icons/CargoIcons';

interface PortData {
  id: string;
  name: string;
  availableCargo?: { type: string; name?: string; amount: number; price?: number }[];
  requiredCargo?: { type: string; name?: string; amount: number }[];
}

export function PortCard({ port, onClick }: { port: PortData; onClick: () => void }) {
  const getFactoryIcon = () => {
    if (port.name.includes('Нефтяной')) {
      return <OilFactoryIcon size={80} />;
    } else if (port.name.includes('Провизионный')) {
      return <ProvisionFactoryIcon size={80} />;
    } else if (port.name.includes('Материалов')) {
      return <MaterialFactoryIcon size={80} />;
    }
    return <Factory className="w-16 h-16 text-blue-600" />;
  };

  const getCargoName = (type: string) => {
    const names: { [key: string]: string } = {
      'oil': 'Нефть',
      'materials': 'Материалы',
      'provisions': 'Провизия'
    };
    return names[type] || type;
  };

  const getCargoIcon = (type: string) => {
    if (type === 'oil') return <OilIcon size={20} />;
    if (type === 'materials') return <MaterialsIcon size={20} />;
    if (type === 'provisions') return <ProvisionIcon size={20} />;
    return null;
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow border border-gray-100"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-20 h-20 flex items-center justify-center flex-shrink-0">
          {getFactoryIcon()}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{port.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">Морской порт</p>
        </div>
      </div>

      <div className="space-y-3">
        {port.availableCargo && port.availableCargo.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Package className="w-4 h-4 text-green-600" />
              <span className="text-xs font-semibold text-gray-700">Доступные грузы:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {port.availableCargo.map((cargo, idx) => (
                <div key={idx} className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg">
                  <div className="w-5 h-5">
                    {getCargoIcon(cargo.type)}
                  </div>
                  <span className="text-sm font-medium">{getCargoName(cargo.type)}</span>
                  <span className="text-xs bg-green-200 px-2 py-0.5 rounded-full font-semibold">{cargo.amount}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {port.requiredCargo && port.requiredCargo.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Package className="w-4 h-4 text-orange-600" />
              <span className="text-xs font-semibold text-gray-700">Требуемые грузы:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {port.requiredCargo.map((cargo, idx) => (
                <div key={idx} className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-700 px-3 py-2 rounded-lg">
                  <div className="w-5 h-5">
                    {getCargoIcon(cargo.type)}
                  </div>
                  <span className="text-sm font-medium">{getCargoName(cargo.type)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
