// API функции для работы с backend

const API_URL = import.meta.env.VITE_API_URL || 'https://anchor-game-production.up.railway.app/api';
// Для локальной разработки: 'http://localhost:3000/api'

export interface ApiResponse<T = any> {
  success: boolean;
  error?: string;
  [key: string]: any;
}

async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    if (!data.success && data.error) {
      throw new Error(data.error);
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Users API
export async function initUser(telegramId: number, username?: string) {
  return apiRequest<{ userId: string; coins: number }>('/users/init', {
    method: 'POST',
    body: JSON.stringify({ telegramId, username }),
  });
}

export async function getUser(userId: string | number) {
  return apiRequest<{
    userId: string;
    telegramId: number;
    username: string;
    coins: number;
    ships: any[];
  }>(`/users/${userId}`);
}

// Ships API
export async function getUserShips(userId: string | number) {
  return apiRequest<{ ships: any[] }>(`/ships/user/${userId}`);
}

export async function getShipPrice(userId: string | number, type: string) {
  return apiRequest<{
    type: string;
    typeName: string;
    basePrice: number;
    currentPrice: number;
    existingShipsCount: number;
    nextShipNumber: number;
  }>(`/ships/price/${userId}/${type}`);
}

export async function buyShip(userId: string | number, type: string) {
  return apiRequest<{ ship: any; price: number }>('/ships/buy', {
    method: 'POST',
    body: JSON.stringify({ userId, type }),
  });
}

export async function sendShipToPort(shipId: string, portId: string) {
  return apiRequest(`/ships/${shipId}/travel`, {
    method: 'POST',
    body: JSON.stringify({ portId }),
  });
}

export async function loadCargo(shipId: string, cargoType: string, amount: number) {
  return apiRequest(`/ships/${shipId}/load`, {
    method: 'POST',
    body: JSON.stringify({ cargoType, amount }),
  });
}

export async function unloadCargo(shipId: string, destination: string = 'port') {
  return apiRequest(`/ships/${shipId}/unload`, {
    method: 'POST',
    body: JSON.stringify({ destination }),
  });
}

export async function repairShip(shipId: string) {
  return apiRequest(`/ships/${shipId}/repair`, {
    method: 'POST',
  });
}

export async function refuelShip(shipId: string, amount: number) {
  return apiRequest(`/ships/${shipId}/refuel`, {
    method: 'POST',
    body: JSON.stringify({ cargoType: 'oil', amount }),
  });
}

export async function towShip(shipId: string) {
  return apiRequest(`/ships/${shipId}/tow`, {
    method: 'POST',
  });
}

export async function checkCompletedTravels() {
  return apiRequest('/ships/check-travels', {
    method: 'POST',
  });
}

export async function checkShipTravel(shipId: string) {
  return apiRequest(`/ships/${shipId}/check-travel`);
}

// Ports API
export async function getPorts() {
  return apiRequest<{ ports: any[] }>('/ports');
}

export async function getPort(portId: string) {
  return apiRequest<{ port: any }>(`/ports/${portId}`);
}

export async function getPortGenerationRules() {
  return apiRequest<{ rules: any }>('/ports/generation-rules');
}

export async function getDistanceBetweenPorts(from: string, to: string) {
  return apiRequest<{ distance: number; from: string; to: string }>(
    `/ports/distance?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
  );
}

// Market API
export async function getMarketCargo() {
  return apiRequest<{ cargo: any[] }>('/market');
}

export async function buyCargoFromMarket(cargoId: string, userId: string | number, amount: number) {
  return apiRequest(`/market/${cargoId}/buy`, {
    method: 'POST',
    body: JSON.stringify({ userId, amount }),
  });
}
