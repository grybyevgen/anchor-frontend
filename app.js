// Конфигурация API
const API_URL = 'https://anchor-game-production.up.railway.app/api';
// Для локальной разработки: const API_URL = 'http://localhost:3000/api';

// Состояние приложения
let currentUser = null;
let ships = [];
let ports = [];
let isLoading = false;
let autoRefreshInterval = null;

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем загрузку иконок
    setTimeout(() => {
        if (!window.ShipIcons || !window.CargoIcons || !window.FactoryIcons) {
            console.warn('Иконки не загружены, используем fallback');
        }
    }, 100);
    
    initApp();
    setupEventListeners();
});

async function initApp() {
    // Получаем данные пользователя из Telegram
    currentUser = {
        id: window.TelegramWebApp.userId,
        username: window.TelegramWebApp.username,
        photoUrl: window.TelegramWebApp.photoUrl
    };

    if (!currentUser.id) {
        alert('Ошибка: не удалось получить данные пользователя');
        return;
    }

    // Показываем индикатор загрузки один раз для всей инициализации
    setLoading(true);
    
    try {
        // Инициализируем пользователя на сервере (без своего индикатора)
        await initUser(false);
        
        // Загружаем данные (без своих индикаторов)
        await loadUserData(false);
        await loadPorts(false);
        await loadPortGenerationRules(false);
        
        // Обновляем UI
        updateUI();
        
        // Запускаем автообновление данных каждые 60 секунд
        startAutoRefresh();
    } finally {
        // Скрываем индикатор загрузки после всех операций
        setLoading(false);
    }
}

// Автообновление данных
function startAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
    
    autoRefreshInterval = setInterval(async () => {
        try {
            // Фоновое обновление без показа индикатора загрузки
            // Обновляем только критичные данные: проверка путешествий и данные пользователя
            await checkCompletedTravels(false);
            await loadUserData(false);
            // Рынок обновляем только при ручном обновлении или переключении вкладки для экономии запросов
            // await loadMarket(false); // убрано из автообновления
            updateUI();
        } catch (error) {
            console.error('Ошибка автообновления:', error);
        }
    }, 60000); // 60 секунд (увеличено с 30 для снижения нагрузки)
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
}

// Универсальная функция для обработки API запросов
// showLoading: показывать ли индикатор загрузки (по умолчанию true)
async function apiRequest(url, options = {}, showLoading = true) {
    try {
        if (showLoading) {
            setLoading(true);
        }
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
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
        // Показываем ошибку только если это не фоновый запрос
        if (showLoading) {
            showError(error.message || 'Ошибка соединения с сервером');
        }
        throw error;
    } finally {
        if (showLoading) {
            setLoading(false);
        }
    }
}

// Показать/скрыть индикатор загрузки
function setLoading(loading) {
    isLoading = loading;
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = loading ? 'block' : 'none';
    }
}

// Показать ошибку (кастомное уведомление без подписи домена)
function showError(message) {
    showToast(message, 'error');
}

// Показать успешное сообщение (кастомное уведомление без подписи домена)
function showSuccess(message) {
    showToast(message, 'success');
}

// Показать кастомное toast-уведомление
function showToast(message, type = 'success') {
    // Удаляем предыдущее уведомление, если есть
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Создаем новое уведомление
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    // Добавляем в DOM
    document.body.appendChild(toast);
    
    // Автоматически удаляем через 3 секунды
    setTimeout(() => {
        toast.style.animation = 'slideUp 0.3s ease-out';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, 3000);
}

async function initUser(showLoading = true) {
    try {
        const data = await apiRequest(`${API_URL}/users/init`, {
            method: 'POST',
            body: JSON.stringify({
                telegramId: currentUser.id,
                username: currentUser.username
            })
        }, showLoading);
        currentUser.coins = data.coins || 0;
        currentUser.userId = data.userId; // Сохраняем UUID пользователя
    } catch (error) {
        console.error('Ошибка инициализации пользователя:', error);
    }
}

async function loadUserData(showLoading = true) {
    try {
        // Сначала проверяем завершенные путешествия (без индикатора)
        await checkCompletedTravels(false);
        
        const data = await apiRequest(`${API_URL}/users/${currentUser.id}`, {}, showLoading);
        if (data.success) {
            currentUser.coins = data.coins;
            currentUser.userId = data.userId; // Сохраняем UUID пользователя
            ships = data.ships || [];
        }
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    }
}

async function loadPorts(showLoading = true) {
    try {
        const data = await apiRequest(`${API_URL}/ports`, {}, showLoading);
        if (data.success) {
            ports = data.ports || [];
        }
    } catch (error) {
        console.error('Ошибка загрузки портов:', error);
    }
}

// Загрузить правила генерации ресурсов для портов
async function loadPortGenerationRules(showLoading = true) {
    try {
        const data = await apiRequest(`${API_URL}/ports/generation-rules`, {}, showLoading);
        if (data.success && data.rules) {
            PORT_GENERATION_RULES = data.rules;
        }
    } catch (error) {
        console.error('Ошибка загрузки правил генерации портов:', error);
    }
}

// Проверить завершенные путешествия
async function checkCompletedTravels(showLoading = false) {
    try {
        await apiRequest(`${API_URL}/ships/check-travels`, {
            method: 'POST'
        }, showLoading);
    } catch (error) {
        // Игнорируем ошибки проверки
        console.error('Ошибка проверки путешествий:', error);
    }
}

// Проверить конкретное судно
async function checkShipTravelStatus(shipId) {
    try {
        const data = await apiRequest(`${API_URL}/ships/${shipId}/check-travel`, {}, false);
        return data.completed || false;
    } catch (error) {
        return false;
    }
}

function setupEventListeners() {
    // Переключение вкладок
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.currentTarget.dataset.tab || e.target.closest('.tab-btn')?.dataset.tab;
            if (tab) {
                switchTab(tab);
            }
        });
    });

    // Модальные окна - обработчики закрытия
    document.querySelectorAll('.modal-close, .close').forEach(close => {
        close.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.remove('active');
            });
        });
    });
    
    // Закрытие модальных окон при клике вне их
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Кнопка покупки судна
    const buyShipBtn = document.getElementById('buy-ship-btn');
    if (buyShipBtn) {
        buyShipBtn.addEventListener('click', showBuyShipModal);
    }
}

async function switchTab(tabName) {
    // Убираем активный класс со всех вкладок
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Активируем выбранную вкладку
    const tabBtn = document.querySelector(`[data-tab="${tabName}"]`);
    const tabContent = document.getElementById(`${tabName}-tab`);
    
    if (tabBtn) tabBtn.classList.add('active');
    if (tabContent) tabContent.classList.add('active');
    
    // Показываем/скрываем кнопку покупки судна
    const buyShipFixed = document.getElementById('buy-ship-fixed');
    if (buyShipFixed) {
        if (tabName === 'ships') {
            buyShipFixed.style.display = 'block';
        } else {
            buyShipFixed.style.display = 'none';
        }
    }
}

function updateUI() {
    // Обновляем монеты
    const coinsEl = document.getElementById('coins');
    if (coinsEl) {
        coinsEl.textContent = (currentUser.coins || 0).toLocaleString();
    }
    
    // Обновляем имя пользователя
    const usernameEl = document.getElementById('username');
    if (usernameEl) {
        usernameEl.textContent = currentUser.username || 'Игрок';
    }
    
    // Обновляем фото профиля
    const userPhotoElement = document.getElementById('user-photo');
    if (currentUser.photoUrl && userPhotoElement) {
        userPhotoElement.src = currentUser.photoUrl;
        userPhotoElement.style.display = 'block';
    } else if (userPhotoElement) {
        userPhotoElement.style.display = 'none';
    }

    // Обновляем список судов
    renderShips();
    
    // Обновляем список портов
    renderPorts();

    // Обновляем статистику флота
    renderFleetStats();
    
    // Показываем/скрываем кнопку покупки судна
    const buyShipFixed = document.getElementById('buy-ship-fixed');
    if (buyShipFixed) {
        const activeTab = document.querySelector('.tab-btn.active');
        if (activeTab && activeTab.dataset.tab === 'ships') {
            buyShipFixed.style.display = 'block';
        } else {
            buyShipFixed.style.display = 'none';
        }
    }
}

function renderShips() {
    const shipsList = document.getElementById('ships-list');
    if (!shipsList) return;
    
    if (ships.length === 0) {
        shipsList.innerHTML = '<div class="loading">У вас пока нет судов. Купите первое судно!</div>';
        return;
    }

    shipsList.innerHTML = ships.map(ship => {
        const shipTypeName = getShipTypeName(ship.type);
        let shipIcon = '';
        
        // Получаем иконку судна
        try {
            if (ship.type === 'tanker' && window.ShipIcons && window.ShipIcons.getTankerIcon) {
                shipIcon = window.ShipIcons.getTankerIcon(56);
            } else if (ship.type === 'cargo' && window.ShipIcons && window.ShipIcons.getCargoShipIcon) {
                shipIcon = window.ShipIcons.getCargoShipIcon(56);
            } else if (ship.type === 'supply' && window.ShipIcons && window.ShipIcons.getSupplyShipIcon) {
                shipIcon = window.ShipIcons.getSupplyShipIcon(56);
            }
        } catch (e) {
            console.error('Ошибка загрузки иконки судна:', e);
            shipIcon = '🚢';
        }
        
        // Определяем цвет прогресс-бара для топлива
        const fuelPercent = (ship.fuel / ship.maxFuel) * 100;
        let fuelColor = 'green';
        if (fuelPercent < 20) fuelColor = 'red';
        else if (fuelPercent < 50) fuelColor = 'orange';
        
        // Определяем цвет прогресс-бара для здоровья
        const healthPercent = (ship.health / ship.maxHealth) * 100;
        let healthColor = 'green';
        if (healthPercent < 30) healthColor = 'red';
        else if (healthPercent < 70) healthColor = 'orange';
        
        // Иконка груза
        let cargoIcon = '';
        if (ship.cargo) {
            const cargoType = ship.cargo.type;
            try {
                if (cargoType === 'oil' && window.CargoIcons && window.CargoIcons.getOilIcon) {
                    cargoIcon = window.CargoIcons.getOilIcon(32);
                } else if (cargoType === 'materials' && window.CargoIcons && window.CargoIcons.getMaterialsIcon) {
                    cargoIcon = window.CargoIcons.getMaterialsIcon(32);
                } else if (cargoType === 'provisions' && window.CargoIcons && window.CargoIcons.getProvisionIcon) {
                    cargoIcon = window.CargoIcons.getProvisionIcon(32);
                }
            } catch (e) {
                console.error('Ошибка загрузки иконки груза:', e);
                cargoIcon = '📦';
            }
        }
        
        return `
            <div class="ship-card" onclick="openShipModal('${ship.id}')">
                <div class="ship-card-header">
                    <div class="ship-card-info">
                        <div class="ship-icon-wrapper">
                            ${shipIcon}
                        </div>
                        <div class="ship-card-title">
                            <h3>${ship.name}</h3>
                            <span class="ship-type">${shipTypeName}</span>
                        </div>
                    </div>
                    ${ship.cargo ? '<div class="cargo-badge">Загружен</div>' : ''}
                </div>
                <div class="ship-card-body">
                    <div class="ship-location">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1rem; height: 1rem;">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                        </svg>
                        <span>${getPortName(ship.currentPortId)}</span>
                    </div>
                    <div class="progress-section">
                        <div class="progress-label">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1rem; height: 1rem;">
                                <path d="M3 3h18v18H3zM12 8v8m-4-4h8"/>
                            </svg>
                            <span>Топливо</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill ${fuelColor}" style="width: ${fuelPercent}%"></div>
                        </div>
                        <div class="progress-text">${ship.fuel}/${ship.maxFuel}</div>
                    </div>
                    <div class="progress-section">
                        <div class="progress-label">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1rem; height: 1rem;">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                            </svg>
                            <span>Здоровье</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill ${healthColor}" style="width: ${healthPercent}%"></div>
                        </div>
                        <div class="progress-text">${ship.health}/${ship.maxHealth}</div>
                    </div>
                    ${ship.cargo ? `
                        <div class="ship-cargo">
                            <div class="cargo-icon-wrapper">
                                ${cargoIcon}
                            </div>
                            <div class="cargo-info">
                                Груз: <span class="cargo-name">${getCargoName(ship.cargo.type)}</span> (${ship.cargo.amount} ед.)
                            </div>
                        </div>
                    ` : ''}
                    ${ship.isTraveling ? '<div style="margin-top: 0.5rem; padding: 0.5rem; background: var(--orange-50); border-radius: var(--radius-lg); text-align: center; color: var(--orange-700); font-size: 0.875rem;">⏳ В пути...</div>' : ''}
                </div>
            </div>
        `;
    }).join('');
}

function renderPorts() {
    const portsList = document.getElementById('ports-list');
    if (!portsList) return;
    
    portsList.innerHTML = ports.map(port => {
        // Получаем иконку завода
        let factoryIcon = '';
        try {
            if (port.name.includes('Нефтяной') && window.FactoryIcons && window.FactoryIcons.getOilFactoryIcon) {
                factoryIcon = window.FactoryIcons.getOilFactoryIcon(80);
            } else if (port.name.includes('Провизионный') && window.FactoryIcons && window.FactoryIcons.getProvisionFactoryIcon) {
                factoryIcon = window.FactoryIcons.getProvisionFactoryIcon(80);
            } else if (port.name.includes('Материалов') && window.FactoryIcons && window.FactoryIcons.getMaterialFactoryIcon) {
                factoryIcon = window.FactoryIcons.getMaterialFactoryIcon(80);
            }
        } catch (e) {
            console.error('Ошибка загрузки иконки завода:', e);
            factoryIcon = '🏭';
        }
        
        // Получаем правила генерации
        const rules = PORT_GENERATION_RULES[port.name];
        
        // Грузы, доступные для погрузки (генерируемые)
        const loadableCargo = port.availableCargo.filter(cargo => 
            rules && rules.generates === cargo.type
        );
        
        // Грузы, которые требуются для генерации
        const requiredCargo = rules ? Object.keys(rules.requires || {}) : [];
        
        // Функция для получения иконки груза
        const getCargoIconHTML = (cargoType) => {
            try {
                if (cargoType === 'oil' && window.CargoIcons && window.CargoIcons.getOilIcon) {
                    return window.CargoIcons.getOilIcon(20);
                } else if (cargoType === 'materials' && window.CargoIcons && window.CargoIcons.getMaterialsIcon) {
                    return window.CargoIcons.getMaterialsIcon(20);
                } else if (cargoType === 'provisions' && window.CargoIcons && window.CargoIcons.getProvisionIcon) {
                    return window.CargoIcons.getProvisionIcon(20);
                }
            } catch (e) {
                console.error('Ошибка загрузки иконки груза:', e);
            }
            return '📦';
        };
        
        return `
            <div class="port-card" onclick="openPortModal('${port.id}')">
                <div class="port-card-header">
                    <div class="port-icon-wrapper">
                        ${factoryIcon}
                    </div>
                    <div class="port-info">
                        <h3>${port.name}</h3>
                        <p>Морской порт</p>
                    </div>
                </div>
                ${loadableCargo.length > 0 ? `
                    <div class="port-cargo-section">
                        <div class="port-cargo-label green">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                                <line x1="12" y1="22.08" x2="12" y2="12"/>
                            </svg>
                            <span>Доступные грузы:</span>
                        </div>
                        <div class="port-cargo-list">
                            ${loadableCargo.map(cargo => `
                                <div class="cargo-chip available">
                                    <div class="cargo-chip-icon">
                                        ${getCargoIconHTML(cargo.type)}
                                    </div>
                                    <span>${getCargoName(cargo.type)}</span>
                                    <span class="cargo-chip-amount">${cargo.amount}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                ${requiredCargo.length > 0 ? `
                    <div class="port-cargo-section">
                        <div class="port-cargo-label orange">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                                <line x1="12" y1="22.08" x2="12" y2="12"/>
                            </svg>
                            <span>Требуемые грузы:</span>
                        </div>
                        <div class="port-cargo-list">
                            ${requiredCargo.map(cargoType => {
                                const cargo = port.availableCargo.find(c => c.type === cargoType);
                                return `
                                    <div class="cargo-chip required">
                                        <div class="cargo-chip-icon">
                                            ${getCargoIconHTML(cargoType)}
                                        </div>
                                        <span>${getCargoName(cargoType)}</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// Статистика во вкладке "Флот"
function renderFleetStats() {
    const fleetStatsEl = document.getElementById('fleet-stats');
    if (!fleetStatsEl) return;

    if (!ships || ships.length === 0) {
        fleetStatsEl.innerHTML = '<div class="loading">У вас пока нет судов. Купите первое судно, чтобы видеть статистику.</div>';
        return;
    }

    // Считаем суммарные показатели по флоту
    let totalDistance = 0;
    let totalTrips = 0;
    let totalProfit = 0;
    let totalFuelCost = 0;
    let totalCargoMoved = 0;
    let totalShipCosts = 0;

    const cardsHtml = ships.map(ship => {
        const purchasePrice = ship.purchasePrice || 0;
        const totalDistanceNm = ship.totalDistanceNm || 0;
        const totalTripsShip = ship.totalTrips || 0;
        const totalCargoMovedShip = ship.totalCargoMoved || 0;
        const totalProfitShip = ship.totalProfit || 0;
        const totalFuelCostShip = ship.totalFuelCost || 0;
        const totalCargoCostShip = ship.totalCargoCost || 0;
        const totalRepairCostShip = ship.totalRepairCost || 0;
        const totalTowCostShip = ship.totalTowCost || 0;

        const totalCostsShip = purchasePrice + totalFuelCostShip + totalCargoCostShip + totalRepairCostShip + totalTowCostShip;

        totalDistance += totalDistanceNm;
        totalTrips += totalTripsShip;
        totalProfit += totalProfitShip;
        totalFuelCost += totalFuelCostShip;
        totalCargoMoved += totalCargoMovedShip;
        totalShipCosts += totalCostsShip;

        // Получаем иконку судна
        let shipIcon = '';
        try {
            if (ship.type === 'tanker' && window.ShipIcons && window.ShipIcons.getTankerIcon) {
                shipIcon = window.ShipIcons.getTankerIcon(48);
            } else if (ship.type === 'cargo' && window.ShipIcons && window.ShipIcons.getCargoShipIcon) {
                shipIcon = window.ShipIcons.getCargoShipIcon(48);
            } else if (ship.type === 'supply' && window.ShipIcons && window.ShipIcons.getSupplyShipIcon) {
                shipIcon = window.ShipIcons.getSupplyShipIcon(48);
            }
        } catch (e) {
            console.error('Ошибка загрузки иконки судна:', e);
            shipIcon = '🚢';
        }

        return `
            <div class="fleet-ship-card">
                <div class="fleet-ship-header">
                    <div class="fleet-ship-icon">
                        ${shipIcon}
                    </div>
                    <div class="fleet-ship-info">
                        <h4>${ship.name}</h4>
                        <p>${getShipTypeName(ship.type)}</p>
                    </div>
                </div>
                <div class="fleet-ship-stats">
                    <div class="fleet-stat-row">
                        <span class="fleet-stat-label">Расстояние пройдено:</span>
                        <span class="fleet-stat-value">${totalDistanceNm.toLocaleString()} км</span>
                    </div>
                    <div class="fleet-stat-row">
                        <span class="fleet-stat-label">Количество рейсов:</span>
                        <span class="fleet-stat-value">${totalTripsShip}</span>
                    </div>
                    <div class="fleet-stat-row">
                        <span class="fleet-stat-label">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                            </svg>
                            Груза перевезено:
                        </span>
                        <span class="fleet-stat-value">${totalCargoMovedShip} ед.</span>
                    </div>
                    <div class="fleet-stat-row fleet-stat-divider">
                        <span class="fleet-stat-label">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="12" y1="1" x2="12" y2="23"/>
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                            </svg>
                            Прибыль:
                        </span>
                        <span class="fleet-stat-value" style="color: #16a34a;">💰 ${totalProfitShip.toLocaleString()}</span>
                    </div>
                </div>
                <div class="fleet-expenses">
                    <div class="fleet-expenses-title">Затраты:</div>
                    <div class="fleet-expenses-grid">
                        <div class="fleet-expense-item">
                            <div class="fleet-expense-label">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M3 3h18v18H3zM12 8v8m-4-4h8"/>
                                </svg>
                                Топливо:
                            </div>
                            <div class="fleet-expense-value">💰 ${totalFuelCostShip}</div>
                        </div>
                        <div class="fleet-expense-item">
                            <div class="fleet-expense-label">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                                </svg>
                                Груз:
                            </div>
                            <div class="fleet-expense-value">💰 ${totalCargoCostShip}</div>
                        </div>
                        <div class="fleet-expense-item">
                            <div class="fleet-expense-label">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                                </svg>
                                Ремонт:
                            </div>
                            <div class="fleet-expense-value">💰 ${totalRepairCostShip}</div>
                        </div>
                        <div class="fleet-expense-item">
                            <div class="fleet-expense-label">Буксировка:</div>
                            <div class="fleet-expense-value">💰 ${totalTowCostShip}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    const summaryHtml = `
        <div class="fleet-summary-card">
            <div class="fleet-summary-title">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 21h18"/>
                    <path d="M5 21V7l8-4v18"/>
                    <path d="M19 21V11l-6-4"/>
                </svg>
                Общая статистика флота
            </div>
            <div class="fleet-summary-grid">
                <div class="fleet-summary-item">
                    <div class="fleet-summary-label">Дистанция</div>
                    <div class="fleet-summary-value">${totalDistance.toLocaleString()} км</div>
                </div>
                <div class="fleet-summary-item">
                    <div class="fleet-summary-label">Рейсов</div>
                    <div class="fleet-summary-value">${totalTrips}</div>
                </div>
                <div class="fleet-summary-item">
                    <div class="fleet-summary-label">Груза перевезено</div>
                    <div class="fleet-summary-value">${totalCargoMoved} ед.</div>
                </div>
                <div class="fleet-summary-item">
                    <div class="fleet-summary-label">Прибыль</div>
                    <div class="fleet-summary-value" style="color: #86efac;">💰 ${totalProfit.toLocaleString()}</div>
                </div>
            </div>
            <div class="fleet-summary-total">
                <div class="fleet-summary-total-label">Общие затраты</div>
                <div class="fleet-summary-total-value">💰 ${totalShipCosts.toLocaleString()}</div>
            </div>
        </div>
    `;

    fleetStatsEl.innerHTML = summaryHtml + cardsHtml;
}


async function openShipModal(shipId) {
    const ship = ships.find(s => s.id === shipId);
    if (!ship) return;

    // Проверяем статус путешествия перед открытием модального окна
    const travelCompleted = await checkShipTravelStatus(shipId);
    if (travelCompleted) {
        // Обновляем данные если путешествие завершено
        await loadUserData();
        const updatedShip = ships.find(s => s.id === shipId);
        if (updatedShip) {
            showSuccess('Судно прибыло в порт!');
        }
    }

    const modal = document.getElementById('ship-modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');

    if (!modal || !title || !body) return;

    title.textContent = ship.name;
    modal.classList.add('active');
    
    if (ship.isTraveling) {
        const endTime = ship.travelEndTime ? new Date(ship.travelEndTime) : null;
        const now = new Date();
        const remaining = endTime && endTime > now ? Math.ceil((endTime - now) / 1000) : 0;
        
        body.innerHTML = `
            <div class="loading">
                <p>⏳ Судно в пути...</p>
                ${remaining > 0 ? `<p>Прибытие через: ${remaining} сек</p>` : '<p>Проверяем статус...</p>'}
            </div>
        `;
        
        // Автоматически обновляем статус каждые 5 секунд
        const statusInterval = setInterval(async () => {
            const completed = await checkShipTravelStatus(shipId);
            if (completed) {
                clearInterval(statusInterval);
                await loadUserData(false); // Фоновое обновление без индикатора
                openShipModal(shipId); // Переоткрываем модальное окно с обновленными данными
            }
        }, 5000);
    } else {
        // Определяем цвет прогресс-бара для топлива
        const fuelPercent = (ship.fuel / ship.maxFuel) * 100;
        let fuelColor = 'green';
        if (fuelPercent < 20) fuelColor = 'red';
        else if (fuelPercent < 50) fuelColor = 'orange';
        
        // Определяем цвет прогресс-бара для здоровья
        const healthPercent = (ship.health / ship.maxHealth) * 100;
        let healthColor = 'green';
        if (healthPercent < 30) healthColor = 'red';
        else if (healthPercent < 70) healthColor = 'orange';
        
        body.innerHTML = `
            <div class="modal-section">
                <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.875rem; margin-bottom: 0.5rem;">
                    <span style="color: var(--gray-600);">Тип судна:</span>
                    <span style="font-weight: 600; color: var(--gray-900);">${getShipTypeName(ship.type)}</span>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.875rem; margin-bottom: 0.5rem;">
                    <span style="color: var(--gray-600); display: flex; align-items: center; gap: 0.25rem;">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1rem; height: 1rem;">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                        </svg>
                        Текущий порт:
                    </span>
                    <span style="font-weight: 600; color: var(--gray-900);">${getPortName(ship.currentPortId)}</span>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.875rem;">
                    <span style="color: var(--gray-600); display: flex; align-items: center; gap: 0.25rem;">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1rem; height: 1rem;">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        Экипаж:
                    </span>
                    <span style="font-weight: 600; color: var(--gray-900);">20 чел.</span>
                </div>
            </div>

            <div class="progress-section">
                <div class="progress-label">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1rem; height: 1rem;">
                        <path d="M3 3h18v18H3zM12 8v8m-4-4h8"/>
                    </svg>
                    <span>Топливо</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${fuelColor}" style="width: ${fuelPercent}%"></div>
                </div>
                <div class="progress-text">${ship.fuel}/${ship.maxFuel}</div>
            </div>

            <div class="progress-section">
                <div class="progress-label">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1rem; height: 1rem;">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    <span>Здоровье</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${healthColor}" style="width: ${healthPercent}%"></div>
                </div>
                <div class="progress-text">${ship.health}/${ship.maxHealth}</div>
            </div>
            
            ${ship.cargo ? `
                <div class="modal-section" style="border: 1px solid var(--gray-200);">
                    <div class="modal-section-title">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1rem; height: 1rem;">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                        </svg>
                        <span>Текущий груз</span>
                    </div>
                    <div style="background: var(--orange-50); padding: 0.75rem; border-radius: var(--radius-lg); margin-bottom: 0.5rem;">
                        <div style="font-size: 0.875rem; color: var(--gray-700);">
                            <strong>${getCargoName(ship.cargo.type)}</strong> (${ship.cargo.amount} ед.)
                        </div>
                    </div>
                    <button class="btn-primary btn-orange" onclick="unloadCargo('${ship.id}')">Выгрузить груз</button>
                </div>
            ` : (() => {
                // Получаем порт и правила генерации
                const port = ports.find(p => p.id === ship.currentPortId);
                if (!port) return '';
                
                const rules = PORT_GENERATION_RULES[port.name];
                if (!rules) return '';
                
                // Фильтруем только грузы, которые порт генерирует (можно загрузить)
                const loadableCargo = getAvailableCargoForPort(ship.currentPortId).filter(cargo => 
                    rules.generates === cargo.type
                );
                
                // Если нет грузов для погрузки, не показываем секцию
                if (loadableCargo.length === 0) return '';
                
                // Функция для получения иконки груза
                const getCargoIconHTML = (cargoType) => {
                    if (cargoType === 'oil' && window.CargoIcons) {
                        return window.CargoIcons.getOilIcon(24);
                    } else if (cargoType === 'materials' && window.CargoIcons) {
                        return window.CargoIcons.getMaterialsIcon(24);
                    } else if (cargoType === 'provisions' && window.CargoIcons) {
                        return window.CargoIcons.getProvisionIcon(24);
                    }
                    return '';
                };
                
                return `
                    <div class="modal-section" style="border: 1px solid var(--gray-200);">
                        <div class="modal-section-title">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1rem; height: 1rem;">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                            </svg>
                            <span>Загрузить груз</span>
                        </div>
                        <div class="cargo-selection-list">
                            ${loadableCargo.map(cargo => {
                                const maxAvailable = Math.min(cargo.amount, 100);
                                const cargoIcon = getCargoIconHTML(cargo.type);
                                return `
                                    <button class="cargo-selection-item" onclick="selectCargoForLoading('${ship.id}', '${cargo.type}', ${cargo.amount}, ${cargo.price || 0}, ${maxAvailable})">
                                        <span>${getCargoName(cargo.type)}</span>
                                        <span class="cargo-selection-amount">${cargo.amount} ед.</span>
                                    </button>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            })()}
            
            <div class="modal-section" style="border: 1px solid var(--gray-200);">
                <div class="modal-section-title">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1rem; height: 1rem;">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span>Отправить в порт</span>
                </div>
                <div class="port-selection-list" id="port-selector-${ship.id}">
                    ${ports.filter(p => p.id !== ship.currentPortId).map(port => `
                        <button class="port-selection-item" 
                             data-ship-id="${ship.id}" 
                             data-port-id="${port.id}" 
                             data-port-name="${port.name.replace(/"/g, '&quot;')}">
                            ${port.name}
                        </button>
                    `).join('')}
                </div>
            </div>
            
            ${ship.fuel < ship.maxFuel && !ship.isTraveling ? (() => {
                // Находим порт судна
                const port = ports.find(p => p.id === ship.currentPortId);
                if (!port) return '';
                
                // Проверяем, генерирует ли порт нефть (бункеровка возможна только в таких портах)
                const rules = PORT_GENERATION_RULES[port.name];
                const canRefuel = rules && rules.generates === 'oil';
                
                if (!canRefuel) {
                    return `
                        <div class="modal-section" style="border: 1px solid var(--orange-200); background: var(--orange-50);">
                            <div class="modal-section-title">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1rem; height: 1rem;">
                                    <path d="M3 3h18v18H3zM12 8v8m-4-4h8"/>
                                </svg>
                                <span>Бункеровка (заправка топливом)</span>
                            </div>
                            <p style="color: var(--orange-700); font-size: 0.875rem; margin-bottom: 0.5rem;">Бункеровка возможна только в портах, где генерируется нефть.</p>
                            <p style="font-size: 0.75rem; color: var(--gray-600);">Текущий порт: ${port.name}</p>
                        </div>
                    `;
                }
                
                const availableOil = port.availableCargo.find(cargo => cargo.type === 'oil');
                const fuelNeeded = ship.maxFuel - ship.fuel;
                
                return `
                    <button class="btn-primary" onclick="openRefuelModal('${ship.id}')" style="width: 100%;">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1.25rem; height: 1.25rem;">
                            <path d="M3 3h18v18H3zM12 8v8m-4-4h8"/>
                        </svg>
                        Букеровка (заправить топливом)
                    </button>
                `;
            })() : ''}
            
            ${ship.fuel < 5 && !ship.isTraveling ? (() => {
                // Проверяем, не в порту "Нефтяной завод" ли судно
                const port = ports.find(p => p.id === ship.currentPortId);
                const isInVladivostok = port && port.name === 'Порт "Нефтяной завод"';
                
                if (isInVladivostok) {
                    return `
                        <div class="modal-section" style="border: 1px solid var(--red-200); background: var(--red-50);">
                            <div class="modal-section-title">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1rem; height: 1rem;">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                    <line x1="12" y1="9" x2="12" y2="13"/>
                                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                                </svg>
                                <span>Низкий уровень топлива</span>
                            </div>
                            <p style="color: var(--red-700); font-size: 0.875rem;">Топливо на исходе (${ship.fuel}/${ship.maxFuel}). Заправьте судно нефтью в порту "Нефтяной завод".</p>
                        </div>
                    `;
                }
                
                // Рассчитываем примерную стоимость буксировки
                const vladivostokPort = ports.find(p => p.name === 'Порт "Нефтяной завод"');
                if (!vladivostokPort) return '';
                
                // Простая оценка расстояния (будет уточнена на сервере)
                const estimatedCost = 500 + 1000; // Базовая + примерная доплата за расстояние
                
                return `
                    <button class="btn-primary btn-red" 
                            data-ship-id="${ship.id}" 
                            data-port-name="${port ? port.name.replace(/"/g, '&quot;') : 'неизвестный порт'}" 
                            data-estimated-cost="${estimatedCost}"
                            id="tow-ship-btn-${ship.id}"
                            style="width: 100%;">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1.25rem; height: 1.25rem;">
                            <circle cx="12" cy="5" r="3"/>
                            <line x1="12" y1="8" x2="12" y2="16"/>
                            <path d="M5 12h14"/>
                            <path d="M8 12l-2 2 2 2"/>
                            <path d="M16 12l2 2-2 2"/>
                        </svg>
                        Буксировка (💰 1000)
                    </button>
                `;
            })() : ''}
            
            ${ship.health < ship.maxHealth ? `
                <button class="btn-primary btn-green" onclick="repairShip('${ship.id}')" style="width: 100%;">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1.25rem; height: 1.25rem;">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                    </svg>
                    Починить судно (💰 500)
                </button>
            ` : ''}
        `;
    }

    // Добавляем обработчики событий для кнопок отправки в порт (через небольшую задержку, чтобы DOM успел обновиться)
    setTimeout(() => {
        const portSelector = document.getElementById(`port-selector-${ship.id}`);
        if (portSelector) {
            // Удаляем старые обработчики (если есть) - клонируем элементы для удаления обработчиков
            const oldOptions = portSelector.querySelectorAll('.port-selection-item, .port-option');
            oldOptions.forEach(option => {
                const newOption = option.cloneNode(true);
                option.parentNode.replaceChild(newOption, option);
            });
            
            // Добавляем новые обработчики
            const portOptions = portSelector.querySelectorAll('.port-selection-item, .port-option');
            portOptions.forEach(option => {
                option.addEventListener('click', handlePortOptionClick);
            });
        }
        
        // Добавляем обработчик для кнопки буксировки
        const towButton = document.getElementById(`tow-ship-btn-${ship.id}`);
        if (towButton) {
            towButton.addEventListener('click', () => {
                const shipId = towButton.getAttribute('data-ship-id');
                const portName = towButton.getAttribute('data-port-name');
                const estimatedCost = parseInt(towButton.getAttribute('data-estimated-cost') || '0');
                if (shipId && portName) {
                    confirmTowShip(shipId, portName, estimatedCost);
                }
            });
        }
    }, 0);
}

// Функция открытия модального окна бункеровки
function openRefuelModal(shipId) {
    const ship = ships.find(s => s.id === shipId);
    if (!ship) return;
    
    const port = ports.find(p => p.id === ship.currentPortId);
    if (!port) return;
    
    const rules = PORT_GENERATION_RULES[port.name];
    const canRefuel = rules && rules.generates === 'oil';
    
    if (!canRefuel) {
        showError('Бункеровка возможна только в портах, где генерируется нефть');
        return;
    }
    
    const availableOil = port.availableCargo.find(cargo => cargo.type === 'oil');
    const fuelNeeded = ship.maxFuel - ship.fuel;
    
    if (!availableOil || availableOil.amount === 0) {
        showError('В этом порту нет нефти для заправки');
        return;
    }
    
    const maxAvailable = Math.min(availableOil.amount, fuelNeeded);
    const pricePerUnit = availableOil.price || 0;
    const initialAmount = maxAvailable;
    const initialCost = initialAmount * pricePerUnit;
    
    // Создаем модальное окно для бункеровки
    const refuelModal = document.createElement('div');
    refuelModal.className = 'modal active';
    refuelModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <div class="modal-header-title">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1.5rem; height: 1.5rem;">
                        <path d="M3 3h18v18H3zM12 8v8m-4-4h8"/>
                    </svg>
                    <span>Бункеровка топлива</span>
                </div>
                <span class="modal-close" onclick="closeRefuelModal()">&times;</span>
            </div>
            <div class="modal-body">
                <div class="modal-section">
                    <div class="stat" style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span style="color: var(--gray-600);">Текущее топливо:</span>
                        <span style="font-weight: 600; color: var(--gray-900);">${ship.fuel}/${ship.maxFuel}</span>
                    </div>
                    <div class="stat" style="display: flex; justify-content: space-between;">
                        <span style="color: var(--gray-600);">Нужно топлива:</span>
                        <span style="font-weight: 600; color: var(--primary-blue);">${fuelNeeded}</span>
                    </div>
                </div>
                <div class="modal-section">
                    <label style="display: block; font-size: 0.875rem; font-weight: 500; color: var(--gray-700); margin-bottom: 0.5rem;">
                        Количество топлива: <span style="color: var(--primary-blue); font-weight: bold; font-size: 1.125rem;" id="refuel-amount-display-${shipId}">${initialAmount}</span>
                    </label>
                    <input type="range" 
                           class="cargo-slider" 
                           id="refuel-slider-${shipId}"
                           min="0" 
                           max="${maxAvailable}" 
                           value="${initialAmount}"
                           oninput="updateRefuelAmount('${shipId}', ${pricePerUnit}, ${maxAvailable})">
                    <div class="cargo-slider-labels">
                        <span>0</span>
                        <span>${maxAvailable}</span>
                    </div>
                </div>
                <div class="modal-section" style="background: var(--primary-blue); background: linear-gradient(to right, #dbeafe, #bfdbfe); border: 1px solid var(--primary-blue-light);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 0.875rem; color: var(--gray-700);">Стоимость:</span>
                        <span style="font-size: 1.125rem; font-weight: bold; color: var(--primary-blue);" id="refuel-price-display-${shipId}">💰 ${initialCost}</span>
                    </div>
                    <div style="font-size: 0.75rem; color: var(--gray-500); margin-top: 0.25rem;">
                        ${pricePerUnit} монет за единицу топлива
                    </div>
                </div>
                <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                    <button class="btn-secondary" onclick="closeRefuelModal()" style="flex: 1;">Отмена</button>
                    <button class="btn-primary" 
                            onclick="confirmRefuelFromPort('${ship.id}', ${availableOil.amount}, ${fuelNeeded}, ${pricePerUnit})"
                            ${maxAvailable === 0 ? 'disabled' : ''}
                            style="flex: 1;">
                        Заправить
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(refuelModal);
    
    // Сохраняем ссылку на модальное окно для закрытия
    window.currentRefuelModal = refuelModal;
}

// Обновление количества топлива при изменении слайдера
function updateRefuelAmount(shipId, pricePerUnit, maxAmount) {
    const slider = document.getElementById(`refuel-slider-${shipId}`);
    const display = document.getElementById(`refuel-amount-display-${shipId}`);
    const priceDisplay = document.getElementById(`refuel-price-display-${shipId}`);
    
    if (slider && display && priceDisplay) {
        const amount = parseInt(slider.value);
        const cost = amount * pricePerUnit;
        display.textContent = amount;
        priceDisplay.textContent = `💰 ${cost}`;
    }
}

// Закрытие модального окна бункеровки
function closeRefuelModal() {
    if (window.currentRefuelModal) {
        window.currentRefuelModal.remove();
        window.currentRefuelModal = null;
    }
}

window.openRefuelModal = openRefuelModal;
window.updateRefuelAmount = updateRefuelAmount;
window.closeRefuelModal = closeRefuelModal;

async function openPortModal(portId) {
    const port = ports.find(p => p.id === portId);
    if (!port) return;

    const modal = document.getElementById('port-modal');
    const title = document.getElementById('port-modal-title');
    const body = document.getElementById('port-modal-body');

    if (!modal || !title || !body) return;

    title.textContent = port.name;
    modal.classList.add('active');
    
    // Получаем правила генерации для порта
    const rules = PORT_GENERATION_RULES[port.name];
    
    // Грузы, доступные для погрузки (генерируемые)
    const loadableCargo = port.availableCargo.filter(cargo => 
        rules && rules.generates === cargo.type
    );
    
    // Грузы, которые требуются для генерации (можно выгрузить)
    const requiredCargo = rules ? Object.keys(rules.requires || {}) : [];
    const requiredCargoInfo = requiredCargo.map(cargoType => {
        const cargo = port.availableCargo.find(c => c.type === cargoType);
        return {
            type: cargoType,
            amount: cargo ? cargo.amount : 0,
            required: rules.requires[cargoType]
        };
    });
    
    // Функция для получения иконки груза
    const getCargoIconHTML = (cargoType) => {
        if (cargoType === 'oil' && window.CargoIcons) {
            return window.CargoIcons.getOilIcon(24);
        } else if (cargoType === 'materials' && window.CargoIcons) {
            return window.CargoIcons.getMaterialsIcon(24);
        } else if (cargoType === 'provisions' && window.CargoIcons) {
            return window.CargoIcons.getProvisionIcon(24);
        }
        return '';
    };
    
    body.innerHTML = `
        ${loadableCargo.length > 0 ? `
            <div class="modal-section" style="border: 1px solid var(--green-200);">
                <div class="modal-section-title">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1rem; height: 1rem; color: var(--green-600);">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    </svg>
                    <span>Доступные грузы для погрузки</span>
                </div>
                <div class="space-y-2">
                    ${loadableCargo.map(cargo => `
                        <div class="cargo-chip available" style="justify-content: space-between;">
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <div class="cargo-chip-icon">
                                    ${getCargoIconHTML(cargo.type)}
                                </div>
                                <span style="font-weight: 500;">${getCargoName(cargo.type)}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <span class="cargo-chip-amount">${cargo.amount}</span>
                                ${cargo.price ? `
                                    <span style="background: var(--green-600); color: white; font-size: 0.75rem; padding: 0.125rem 0.5rem; border-radius: 9999px; font-weight: 600; display: flex; align-items: center; gap: 0.25rem;">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 0.75rem; height: 0.75rem;">
                                            <circle cx="12" cy="12" r="10"/>
                                            <path d="M12 6v12M15 9a3 3 0 1 0-6 0"/>
                                        </svg>
                                        ${cargo.price}
                                    </span>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
        
        ${requiredCargoInfo.length > 0 ? `
            <div class="modal-section" style="border: 1px solid var(--orange-200);">
                <div class="modal-section-title">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1rem; height: 1rem; color: var(--orange-600);">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    </svg>
                    <span>Требуемые грузы для генерации</span>
                </div>
                <div class="space-y-2">
                    ${requiredCargoInfo.map(cargo => `
                        <div class="cargo-chip required" style="flex-direction: column; align-items: flex-start; gap: 0.5rem;">
                            <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                                <div style="display: flex; align-items: center; gap: 0.5rem;">
                                    <div class="cargo-chip-icon">
                                        ${getCargoIconHTML(cargo.type)}
                                    </div>
                                    <span style="font-weight: 600; font-size: 1rem;">${getCargoName(cargo.type)}</span>
                                </div>
                                ${cargo.amount > 0 ? `
                                    <span style="background: var(--orange-600); color: white; font-size: 0.75rem; padding: 0.125rem 0.5rem; border-radius: 9999px; font-weight: 600; display: flex; align-items: center; gap: 0.25rem;">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 0.75rem; height: 0.75rem;">
                                            <circle cx="12" cy="12" r="10"/>
                                            <path d="M12 6v12M15 9a3 3 0 1 0-6 0"/>
                                        </svg>
                                        ${port.availableCargo.find(c => c.type === cargo.type)?.price || 0}
                                    </span>
                                ` : ''}
                            </div>
                            <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem;">
                                <span style="color: var(--orange-700);">В порту:</span>
                                <span style="font-weight: bold; background: var(--orange-200); padding: 0.125rem 0.5rem; border-radius: 0.25rem; color: var(--orange-900);">
                                    ${cargo.amount} единиц
                                </span>
                            </div>
                            <div style="font-size: 0.75rem; color: var(--orange-600);">
                                (требуется: ${cargo.required} ед. для генерации)
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
        
        ${rules ? `
            <div class="modal-section" style="background: var(--primary-blue); background: linear-gradient(to right, #dbeafe, #bfdbfe); border: 1px solid var(--primary-blue-light);">
                <div class="modal-section-title" style="color: var(--primary-blue);">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1rem; height: 1rem;">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 16v-4M12 8h.01"/>
                    </svg>
                    <span>Правила генерации ресурсов</span>
                </div>
                <div style="background: white; padding: 0.75rem; border-radius: var(--radius-lg); font-size: 0.875rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                        ${Object.entries(rules.requires).map(([type, amount]) => `
                            <span style="color: var(--gray-700);">${getCargoName(type)} (${amount})</span>
                        `).join('<span style="color: var(--gray-400);">+</span>')}
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1rem; height: 1rem; color: var(--gray-400);">
                            <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        <span style="font-weight: 600; color: var(--gray-900);">${getCargoName(rules.generates)} (3)</span>
                    </div>
                </div>
                <p style="font-size: 0.75rem; color: var(--primary-blue); margin-top: 0.75rem;">
                    Доставьте требуемые грузы для генерации новых ресурсов в этом порту
                </p>
            </div>
        ` : ''}
        
        <div class="modal-section" style="background: var(--gray-50);">
            <p style="font-size: 0.75rem; color: var(--gray-600); line-height: 1.6;">
                В этом порту вы можете загружать и выгружать грузы. Перевозите грузы между портами,
                чтобы зарабатывать деньги и развивать свой флот.
            </p>
        </div>
    `;
    
    // Обработчики уже добавлены в openShipModal
}

// Обработчик клика по опции порта
function handlePortOptionClick(event) {
    const option = event.currentTarget;
    const shipId = option.getAttribute('data-ship-id');
    const portId = option.getAttribute('data-port-id');
    const portName = option.getAttribute('data-port-name');
    
    if (shipId && portId && portName) {
        // Декодируем имя порта из HTML-экранированного формата
        const decodedPortName = portName.replace(/&quot;/g, '"');
        confirmSendShipToPort(shipId, portId, decodedPortName);
    }
}

async function confirmSendShipToPort(shipId, portId, portName) {
    const ship = ships.find(s => s.id === shipId);
    const destinationPort = ports.find(p => p.id === portId);
    
    if (!ship || !destinationPort) {
        showError('Судно или порт не найдены');
        return;
    }
    
    // Получаем расстояние и расход топлива
    const currentPort = ports.find(p => p.id === ship.currentPortId);
    if (!currentPort) return;
    
    // Вычисляем расстояние (используем функцию из Port модели или приблизительно)
    const distance = await getDistanceBetweenPorts(currentPort.name, destinationPort.name);
    const fuelConsumption = Math.ceil(distance * 0.5); // 1 миля = 0.5 топлива
    
    // Проверяем достаточно ли топлива
    const hasEnoughFuel = ship.fuel >= fuelConsumption;
    const isInOilPort = currentPort.name === 'Порт "Нефтяной завод"';
    
    // Показываем модальное окно подтверждения
    showConfirmSendModal(ship, destinationPort, distance, fuelConsumption, hasEnoughFuel, isInOilPort);
}

// Функция получения расстояния между портами
async function getDistanceBetweenPorts(fromPort, toPort) {
    try {
        const response = await fetch(`${API_URL}/ports/distance?from=${encodeURIComponent(fromPort)}&to=${encodeURIComponent(toPort)}`);
        const data = await response.json();
        if (data.success && data.distance) {
            return data.distance;
        }
    } catch (e) {
        console.error('Ошибка получения расстояния:', e);
    }
    
    // Fallback - используем приблизительные значения
    const distances = {
        'Порт "Нефтяной завод"': {
            'Порт "Провизионный завод"': 150,
            'Порт "Завод Материалов"': 200
        },
        'Порт "Провизионный завод"': {
            'Порт "Нефтяной завод"': 150,
            'Порт "Завод Материалов"': 1959
        },
        'Порт "Завод Материалов"': {
            'Порт "Нефтяной завод"': 200,
            'Порт "Провизионный завод"': 1959
        }
    };
    return distances[fromPort]?.[toPort] || 0;
}

// Показать модальное окно подтверждения отправки
function showConfirmSendModal(ship, destinationPort, distance, fuelConsumption, hasEnoughFuel, isInOilPort) {
    const modal = document.getElementById('confirm-send-modal');
    const body = document.getElementById('confirm-send-body');
    
    if (!modal || !body) return;
    
    // Получаем иконки
    const getShipIcon = (type) => {
        if (type === 'tanker' && window.ShipIcons) return window.ShipIcons.getTankerIcon(24);
        if (type === 'cargo' && window.ShipIcons) return window.ShipIcons.getCargoShipIcon(24);
        if (type === 'supply' && window.ShipIcons) return window.ShipIcons.getSupplyShipIcon(24);
        return '';
    };
    
    const getPortIcon = (portName) => {
        if (portName.includes('Нефтяной') && window.FactoryIcons) return window.FactoryIcons.getOilFactoryIcon(24);
        if (portName.includes('Материалов') && window.FactoryIcons) return window.FactoryIcons.getMaterialFactoryIcon(24);
        if (portName.includes('Провизионный') && window.FactoryIcons) return window.FactoryIcons.getProvisionFactoryIcon(24);
        return '';
    };
    
    body.innerHTML = `
        <div class="modal-section">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <div style="width: 1.5rem; height: 1.5rem;">${getShipIcon(ship.type)}</div>
                <div>
                    <p style="font-size: 0.875rem; color: var(--gray-600);">Судно</p>
                    <p style="font-weight: 600; color: var(--gray-900);">${ship.name}</p>
                </div>
            </div>
        </div>
        
        <div class="modal-section" style="background: var(--blue-50); border: 1px solid var(--blue-200);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1.25rem; height: 1.25rem; color: var(--gray-600);">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <div>
                        <p style="font-size: 0.75rem; color: var(--gray-600);">Откуда</p>
                        <p style="font-size: 0.875rem; font-weight: 500; color: var(--gray-900);">${getPortName(ship.currentPortId).replace(/Порт "/g, '').replace(/"$/g, '')}</p>
                    </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1.25rem; height: 1.25rem; color: var(--blue-600);">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                </svg>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="width: 1.25rem; height: 1.25rem;">${getPortIcon(destinationPort.name)}</div>
                    <div>
                        <p style="font-size: 0.75rem; color: var(--gray-600);">Куда</p>
                        <p style="font-size: 0.875rem; font-weight: 500; color: var(--gray-900);">${destinationPort.name.replace(/Порт "/g, '').replace(/"$/g, '')}</p>
                    </div>
                </div>
            </div>
            
            <div style="border-top: 1px solid var(--blue-200); padding-top: 0.75rem; display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem;">
                <div style="background: var(--white); border-radius: var(--radius-md); padding: 0.5rem;">
                    <p style="font-size: 0.75rem; color: var(--gray-600);">Расстояние</p>
                    <p style="font-size: 0.875rem; font-weight: 600; color: var(--gray-900);">${distance} миль</p>
                </div>
                <div style="background: var(--white); border-radius: var(--radius-md); padding: 0.5rem;">
                    <p style="font-size: 0.75rem; color: var(--gray-600);">Расход топлива</p>
                    <p style="font-size: 0.875rem; font-weight: 600; color: var(--gray-900);">⛽ ${fuelConsumption}</p>
                </div>
            </div>
            
            ${!hasEnoughFuel ? `
                <div style="margin-top: 0.75rem; background: var(--red-100); border: 1px solid var(--red-300); border-radius: var(--radius-lg); padding: 0.75rem; display: flex; align-items: start; gap: 0.5rem;">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1.25rem; height: 1.25rem; color: var(--red-600); flex-shrink: 0; margin-top: 0.125rem;">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <div>
                        <p style="font-size: 0.875rem; font-weight: 600; color: var(--red-800);">Недостаточно топлива!</p>
                        <p style="font-size: 0.75rem; color: var(--red-700); margin-top: 0.25rem;">
                            Требуется: ⛽ ${fuelConsumption}, Доступно: ⛽ ${ship.fuel}
                        </p>
                    </div>
                </div>
            ` : ''}
        </div>
        
        ${hasEnoughFuel ? `
            <div style="display: flex; gap: 0.75rem;">
                <button class="btn-secondary" onclick="closeConfirmSendModal()" style="flex: 1;">Отмена</button>
                <button class="btn-primary" onclick="executeSendShip('${ship.id}', '${destinationPort.id}')" style="flex: 1; background: var(--blue-600);">Отправить</button>
            </div>
        ` : isInOilPort ? `
            <div style="background: var(--blue-50); border: 1px solid var(--blue-200); border-radius: var(--radius-lg); padding: 0.75rem; margin-bottom: 0.75rem;">
                <p style="font-size: 0.875rem; color: var(--blue-800); text-align: center; margin-bottom: 0.5rem;">
                    ⛽️ Недостаточно топлива для отправки
                </p>
                <p style="font-size: 0.75rem; color: var(--gray-600); text-align: center;">
                    Вы находитесь в Нефтяном заводе. Заправьте судно перед отправкой!
                </p>
            </div>
            <button class="btn-primary" onclick="openRefuelFromSendModal('${ship.id}')" style="width: 100%; margin-bottom: 0.5rem;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1.25rem; height: 1.25rem;">
                    <path d="M3 3h18v18H3zM12 8v8m-4-4h8"/>
                </svg>
                Заправить судно
            </button>
            <button class="btn-secondary" onclick="closeConfirmSendModal()" style="width: 100%;">Отмена</button>
        ` : `
            <div style="background: var(--yellow-50); border: 1px solid var(--yellow-200); border-radius: var(--radius-lg); padding: 0.75rem; margin-bottom: 0.75rem;">
                <p style="font-size: 0.875rem; color: var(--yellow-800); text-align: center; margin-bottom: 0.5rem;">
                    ⛽️ Для отправки требуется больше топлива
                </p>
                <p style="font-size: 0.75rem; color: var(--gray-600); text-align: center;">
                    Вы можете отбуксировать судно в Нефтяной завод для бункеровки
                </p>
            </div>
            <button class="btn-primary btn-orange" onclick="towFromSendModal('${ship.id}')" style="width: 100%; margin-bottom: 0.5rem; ${(currentUser.coins || 0) < 1000 ? 'opacity: 0.5; cursor: not-allowed;' : ''}" ${(currentUser.coins || 0) < 1000 ? 'disabled' : ''}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1.25rem; height: 1.25rem;">
                    <circle cx="12" cy="5" r="3"/>
                    <line x1="12" y1="8" x2="12" y2="16"/>
                    <path d="M5 12h14"/>
                </svg>
                Буксировка в Нефтяной завод (💰 1000)
            </button>
            ${(currentUser.coins || 0) < 1000 ? '<p style="font-size: 0.75rem; color: var(--red-600); text-align: center;">Недостаточно средств для буксировки</p>' : ''}
            <button class="btn-secondary" onclick="closeConfirmSendModal()" style="width: 100%;">Отмена</button>
        `}
    `;
    
    modal.classList.add('active');
}

// Выполнить отправку судна
async function executeSendShip(shipId, portId) {
    const port = ports.find(p => p.id === portId);
    if (!port) return;
    
    try {
        const data = await apiRequest(`${API_URL}/ships/${shipId}/travel`, {
            method: 'POST',
            body: JSON.stringify({ portId })
        });
        
        if (data.success) {
            closeConfirmSendModal();
            showSuccess(`Судно отправлено в ${port.name}!`);
            await loadUserData();
            updateUI();
            const shipModal = document.getElementById('ship-modal');
            if (shipModal) {
                shipModal.classList.remove('active');
            }
        }
    } catch (error) {
        // Ошибка уже обработана в apiRequest
    }
}

// Закрыть модальное окно подтверждения отправки
function closeConfirmSendModal() {
    const modal = document.getElementById('confirm-send-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Открыть бункеровку из модального окна отправки
function openRefuelFromSendModal(shipId) {
    closeConfirmSendModal();
    const shipModal = document.getElementById('ship-modal');
    if (shipModal) {
        shipModal.classList.remove('active');
    }
    setTimeout(() => {
        openShipModal(shipId);
        setTimeout(() => {
            const refuelBtn = document.querySelector('[onclick*="openRefuelModal"]');
            if (refuelBtn) {
                refuelBtn.click();
            }
        }, 100);
    }, 100);
}

// Буксировка из модального окна отправки
async function towFromSendModal(shipId) {
    closeConfirmSendModal();
    const ship = ships.find(s => s.id === shipId);
    const currentPort = ports.find(p => p.id === ship.currentPortId);
    if (ship && currentPort) {
        await towShip(shipId);
    }
}

window.executeSendShip = executeSendShip;
window.closeConfirmSendModal = closeConfirmSendModal;
window.openRefuelFromSendModal = openRefuelFromSendModal;
window.towFromSendModal = towFromSendModal;

async function sendShipToPort(shipId, portId) {
    // Обертка для обратной совместимости
    const port = ports.find(p => p.id === portId);
    if (!port) return;
    await confirmSendShipToPort(shipId, portId, port.name);
}

// Функция подтверждения загрузки груза с выбором количества
async function confirmLoadCargo(shipId, cargoType, maxAvailable, pricePerUnit) {
    // Пытаемся получить значение из слайдера
    const sliderId = `cargo-slider-${shipId}-${cargoType}`;
    const slider = document.getElementById(sliderId);
    
    let amount;
    if (slider) {
        amount = parseInt(slider.value);
    } else {
        // Fallback на старое поле ввода
        const inputId = `cargo-amount-${cargoType}-${shipId}`;
        const amountInput = document.getElementById(inputId);
        if (!amountInput) {
            showError('Ошибка: поле ввода количества не найдено');
            return;
        }
        amount = parseInt(amountInput.value);
    }
    
    if (!amount || amount <= 0) {
        showError('Количество должно быть больше 0');
        return;
    }
    
    if (amount > 100) {
        showError('Максимальное количество груза - 100 единиц');
        return;
    }
    
    if (amount > maxAvailable) {
        showError(`Недостаточно груза в порту. Доступно: ${maxAvailable}`);
        return;
    }
    
    // Показываем модальное окно подтверждения загрузки
    const ship = ships.find(s => s.id === shipId);
    if (ship) {
        showConfirmLoadCargoModal(ship, cargoType, amount, pricePerUnit);
    }
}

// Показать модальное окно подтверждения загрузки
function showConfirmLoadCargoModal(ship, cargoName, cargoAmount, pricePerUnit) {
    const modal = document.getElementById('confirm-load-modal');
    const body = document.getElementById('confirm-load-body');
    
    if (!modal || !body) return;
    
    const totalCost = pricePerUnit * cargoAmount;
    const hasEnoughMoney = (currentUser.coins || 0) >= totalCost;
    
    // Получаем иконки
    const getShipIcon = (type) => {
        if (type === 'tanker' && window.ShipIcons) return window.ShipIcons.getTankerIcon(24);
        if (type === 'cargo' && window.ShipIcons) return window.ShipIcons.getCargoShipIcon(24);
        if (type === 'supply' && window.ShipIcons) return window.ShipIcons.getSupplyShipIcon(24);
        return '';
    };
    
    const getCargoIcon = (name) => {
        if (name === 'oil' && window.CargoIcons) return window.CargoIcons.getOilIcon(32);
        if (name === 'materials' && window.CargoIcons) return window.CargoIcons.getMaterialsIcon(32);
        if (name === 'provisions' && window.CargoIcons) return window.CargoIcons.getProvisionIcon(32);
        return '';
    };
    
    body.innerHTML = `
        <div class="modal-section">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <div style="width: 1.5rem; height: 1.5rem;">${getShipIcon(ship.type)}</div>
                <div>
                    <p style="font-size: 0.875rem; color: var(--gray-600);">Судно</p>
                    <p style="font-weight: 600; color: var(--gray-900);">${ship.name}</p>
                </div>
            </div>
        </div>
        
        <div class="modal-section" style="background: var(--green-50); border: 2px solid var(--green-200);">
            <div style="display: flex; align-items: center; justify-content: center; gap: 0.75rem; margin-bottom: 1rem;">
                <div style="width: 2.5rem; height: 2.5rem;">${getCargoIcon(cargoName)}</div>
                <div style="text-align: center;">
                    <p style="font-weight: bold; color: var(--gray-900); font-size: 1.125rem;">${getCargoName(cargoName)}</p>
                    <p style="font-size: 0.875rem; color: var(--gray-600);">${cargoAmount} единиц</p>
                </div>
            </div>
            
            <div style="background: var(--white); border-radius: var(--radius-lg); padding: 0.75rem;">
                <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.875rem; margin-bottom: 0.5rem;">
                    <span style="color: var(--gray-600);">Цена за единицу:</span>
                    <span style="font-weight: 600; color: var(--gray-900); display: flex; align-items: center; gap: 0.25rem;">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1rem; height: 1rem; color: var(--yellow-500);">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 6v12M15 9a3 3 0 1 0-6 0"/>
                        </svg>
                        ${pricePerUnit}
                    </span>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.875rem; margin-bottom: 0.5rem;">
                    <span style="color: var(--gray-600);">Количество:</span>
                    <span style="font-weight: 600; color: var(--gray-900);">${cargoAmount} ед.</span>
                </div>
                <div style="border-top: 1px solid var(--gray-200); padding-top: 0.5rem; margin-top: 0.5rem;">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <span style="font-weight: 600; color: var(--gray-700);">Стоимость:</span>
                        <span style="font-size: 1.25rem; font-weight: bold; color: var(--red-600); display: flex; align-items: center; gap: 0.25rem;">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1.25rem; height: 1.25rem; color: var(--yellow-500);">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M12 6v12M15 9a3 3 0 1 0-6 0"/>
                            </svg>
                            ${totalCost}
                        </span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="modal-section" style="${hasEnoughMoney ? 'background: var(--blue-50); border: 1px solid var(--blue-200);' : 'background: var(--red-50); border: 1px solid var(--red-200);'}">
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <span style="font-size: 0.875rem; color: var(--gray-600);">Ваш баланс:</span>
                <span style="font-weight: bold; display: flex; align-items: center; gap: 0.25rem; ${hasEnoughMoney ? 'color: var(--green-600);' : 'color: var(--red-600);'}">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1.25rem; height: 1.25rem; color: var(--yellow-500);">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v12M15 9a3 3 0 1 0-6 0"/>
                    </svg>
                    ${(currentUser.coins || 0).toLocaleString()}
                </span>
            </div>
            ${!hasEnoughMoney ? '<p style="font-size: 0.75rem; color: var(--red-600); margin-top: 0.5rem; text-align: center;">⚠️ Недостаточно средств для покупки груза</p>' : ''}
        </div>
        
        <div style="display: flex; gap: 0.75rem;">
            <button class="btn-secondary" onclick="closeConfirmLoadModal()" style="flex: 1;">Отмена</button>
            <button class="btn-primary btn-green" onclick="executeLoadCargo('${ship.id}', '${cargoName}', ${cargoAmount})" ${!hasEnoughMoney ? 'disabled' : ''} style="flex: 1; ${!hasEnoughMoney ? 'opacity: 0.5; cursor: not-allowed;' : ''}">Загрузить</button>
        </div>
    `;
    
    modal.classList.add('active');
}

// Выполнить загрузку груза
async function executeLoadCargo(shipId, cargoType, amount) {
    try {
        const data = await apiRequest(`${API_URL}/ships/${shipId}/load`, {
            method: 'POST',
            body: JSON.stringify({ cargoType, amount })
        });
        
        if (data.success) {
            closeConfirmLoadModal();
            showSuccess('Груз загружен!');
            await loadUserData();
            await loadPorts();
            updateUI();
            openShipModal(shipId);
        }
    } catch (error) {
        // Ошибка уже обработана в apiRequest
    }
}

// Закрыть модальное окно подтверждения загрузки
function closeConfirmLoadModal() {
    const modal = document.getElementById('confirm-load-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

window.executeLoadCargo = executeLoadCargo;
window.closeConfirmLoadModal = closeConfirmLoadModal;

async function selectCargo(shipId, cargoType, amount) {
    try {
        const data = await apiRequest(`${API_URL}/ships/${shipId}/load`, {
            method: 'POST',
            body: JSON.stringify({ cargoType, amount })
        });
        
        if (data.success) {
            showSuccess('Груз загружен!');
            await loadUserData();
            await loadPorts();
            updateUI();
            openShipModal(shipId);
        }
    } catch (error) {
        // Ошибка уже обработана в apiRequest
    }
}

async function unloadCargo(shipId) {
    const ship = ships.find(s => s.id === shipId);
    if (!ship || !ship.cargo) {
        showError('Судно или груз не найдены');
        return;
    }
    
    try {
        // Всегда продаем в порт
        const data = await apiRequest(`${API_URL}/ships/${shipId}/unload`, {
            method: 'POST',
            body: JSON.stringify({ destination: 'port' })
        });
        
        if (data.success) {
            // Показываем модальное окно успешной выгрузки
            showUnloadSuccessModal(ship.cargo.type, ship.cargo.amount, data.reward, data.grossProfit, data.profitTax, data.portFees);
            
            await loadUserData();
            await loadPorts();
            updateUI();
            
            // Закрываем модальное окно судна
            const shipModal = document.getElementById('ship-modal');
            if (shipModal) {
                shipModal.classList.remove('active');
            }
        }
    } catch (error) {
        // Проверяем, является ли ошибка связанной с неправильным портом
        if (error && error.message && (error.message.includes('нельзя выгружать') || error.message.includes('можно выгрузить только'))) {
            // Показываем модальное окно ошибки выгрузки
            const validPorts = getValidUnloadPorts(ship.cargo.type);
            showUnloadErrorModal(ship.cargo.type, validPorts);
        }
        // Ошибка уже обработана в apiRequest
    }
}

// Получить валидные порты для выгрузки
function getValidUnloadPorts(cargoType) {
    // Система производства 1+1=3:
    // Нефтяной завод: Материалы + Провизия → Нефть
    // Завод Материалов: Нефть + Провизия → Материалы
    // Провизионный завод: Нефть + Материалы → Провизия
    
    if (cargoType === 'oil') {
        return ['Порт "Завод Материалов"', 'Порт "Провизионный завод"'];
    } else if (cargoType === 'materials') {
        return ['Порт "Нефтяной завод"', 'Порт "Провизионный завод"'];
    } else if (cargoType === 'provisions') {
        return ['Порт "Нефтяной завод"', 'Порт "Завод Материалов"'];
    }
    return [];
}

// Показать модальное окно успешной выгрузки
function showUnloadSuccessModal(cargoName, amount, profit, grossProfit, tax, portFees) {
    const modal = document.getElementById('unload-success-modal');
    const body = document.getElementById('unload-success-body');
    
    if (!modal || !body) return;
    
    const getCargoIcon = (name) => {
        if (name === 'oil' && window.CargoIcons) return window.CargoIcons.getOilIcon(20);
        if (name === 'materials' && window.CargoIcons) return window.CargoIcons.getMaterialsIcon(20);
        if (name === 'provisions' && window.CargoIcons) return window.CargoIcons.getProvisionIcon(20);
        return '';
    };
    
    body.innerHTML = `
        <div class="modal-section">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
                <span style="font-size: 0.875rem; color: var(--gray-600);">Груз:</span>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="width: 1.25rem; height: 1.25rem;">${getCargoIcon(cargoName)}</div>
                    <span style="font-weight: 600; color: var(--gray-900);">${getCargoName(cargoName)}</span>
                </div>
            </div>
            
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
                <span style="font-size: 0.875rem; color: var(--gray-600);">Количество:</span>
                <span style="font-weight: 600; color: var(--gray-900);">${amount} ед.</span>
            </div>
            
            ${grossProfit ? `
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span style="font-size: 0.875rem; color: var(--gray-600);">Цена за единицу:</span>
                    <span style="font-weight: 600; color: var(--gray-900); display: flex; align-items: center; gap: 0.25rem;">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1rem; height: 1rem; color: var(--yellow-500);">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 6v12M15 9a3 3 0 1 0-6 0"/>
                        </svg>
                        ${Math.floor(grossProfit / amount)}
                    </span>
                </div>
                
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span style="font-size: 0.875rem; color: var(--gray-600);">Валовая прибыль:</span>
                    <span style="font-weight: 600; color: var(--gray-900); display: flex; align-items: center; gap: 0.25rem;">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1rem; height: 1rem; color: var(--yellow-500);">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 6v12M15 9a3 3 0 1 0-6 0"/>
                        </svg>
                        ${grossProfit}
                    </span>
                </div>
                
                <div style="border-top: 1px solid var(--gray-200); padding-top: 0.5rem; margin-top: 0.5rem; margin-bottom: 0.5rem;">
                    <div style="font-size: 0.75rem; font-weight: 600; color: var(--gray-700); margin-bottom: 0.5rem;">Вычеты:</div>
                    ${tax !== undefined && tax > 0 ? `
                        <div style="display: flex; align-items: center; justify-content: space-between; background: var(--red-50); border-radius: var(--radius-sm); padding: 0.5rem; margin-bottom: 0.25rem;">
                            <span style="font-size: 0.75rem; color: var(--gray-600);">📋 Налог (15%):</span>
                            <span style="font-size: 0.875rem; font-weight: 600; color: var(--red-600);">- ${tax}</span>
                        </div>
                    ` : ''}
                    ${portFees !== undefined && portFees > 0 ? `
                        <div style="display: flex; align-items: center; justify-content: space-between; background: var(--red-50); border-radius: var(--radius-sm); padding: 0.5rem;">
                            <span style="font-size: 0.75rem; color: var(--gray-600);">⚓ Портовые сборы:</span>
                            <span style="font-size: 0.875rem; font-weight: 600; color: var(--red-600);">- ${portFees}</span>
                        </div>
                    ` : ''}
                </div>
            ` : ''}
            
            <div style="border-top: 2px solid var(--gray-300); padding-top: 0.75rem; margin-top: 0.75rem;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <span style="font-size: 1rem; font-weight: 600; color: var(--gray-700);">Чистая прибыль:</span>
                    <span style="font-size: 1.25rem; font-weight: bold; color: var(--green-600); display: flex; align-items: center; gap: 0.25rem;">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1.25rem; height: 1.25rem; color: var(--yellow-500);">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 6v12M15 9a3 3 0 1 0-6 0"/>
                        </svg>
                        ${profit}
                    </span>
                </div>
            </div>
        </div>
        
        <button class="btn-primary btn-green" onclick="closeUnloadSuccessModal()" style="width: 100%;">Отлично!</button>
    `;
    
    modal.classList.add('active');
}

// Показать модальное окно ошибки выгрузки
function showUnloadErrorModal(cargoName, validPorts) {
    const modal = document.getElementById('unload-error-modal');
    const body = document.getElementById('unload-error-body');
    
    if (!modal || !body) return;
    
    const getCargoIcon = (name) => {
        if (name === 'oil' && window.CargoIcons) return window.CargoIcons.getOilIcon(20);
        if (name === 'materials' && window.CargoIcons) return window.CargoIcons.getMaterialsIcon(20);
        if (name === 'provisions' && window.CargoIcons) return window.CargoIcons.getProvisionIcon(20);
        return '';
    };
    
    const getPortIcon = (portName) => {
        if (portName.includes('Нефтяной') && window.FactoryIcons) return window.FactoryIcons.getOilFactoryIcon(20);
        if (portName.includes('Материалов') && window.FactoryIcons) return window.FactoryIcons.getMaterialFactoryIcon(20);
        if (portName.includes('Провизионный') && window.FactoryIcons) return window.FactoryIcons.getProvisionFactoryIcon(20);
        return '';
    };
    
    body.innerHTML = `
        <div class="modal-section" style="background: var(--red-50); border: 1px solid var(--red-200);">
            <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-bottom: 0.75rem;">
                <div style="width: 1.25rem; height: 1.25rem;">${getCargoIcon(cargoName)}</div>
                <span style="font-weight: 600; color: var(--gray-900);">${getCargoName(cargoName)}</span>
            </div>
            
            <p style="font-size: 0.875rem; color: var(--gray-700); line-height: 1.6; text-align: center; margin-bottom: 0.75rem;">
                Этот груз можно выгрузить только в следующих портах:
            </p>
            
            <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.75rem;">
                ${validPorts.map(port => `
                    <div style="background: var(--white); border-radius: var(--radius-lg); padding: 0.75rem; display: flex; align-items: center; gap: 0.5rem; border: 1px solid var(--gray-200);">
                        <div style="width: 1.25rem; height: 1.25rem; flex-shrink: 0;">${getPortIcon(port)}</div>
                        <span style="font-size: 0.875rem; font-weight: 500; color: var(--gray-900);">${port.replace(/Порт "/g, '').replace(/"$/g, '')}</span>
                    </div>
                `).join('')}
            </div>
            
            <p style="font-size: 0.875rem; font-weight: 600; color: var(--red-700); margin-top: 0.75rem; text-align: center; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1rem; height: 1rem;">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                </svg>
                Отправьтесь в нужный порт!
            </p>
        </div>
        
        <button class="btn-primary btn-red" onclick="closeUnloadErrorModal()" style="width: 100%;">Понятно</button>
    `;
    
    modal.classList.add('active');
}

// Закрыть модальное окно успешной выгрузки
function closeUnloadSuccessModal() {
    const modal = document.getElementById('unload-success-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Закрыть модальное окно ошибки выгрузки
function closeUnloadErrorModal() {
    const modal = document.getElementById('unload-error-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

window.closeUnloadSuccessModal = closeUnloadSuccessModal;
window.closeUnloadErrorModal = closeUnloadErrorModal;

async function repairShip(shipId) {
    try {
        const data = await apiRequest(`${API_URL}/ships/${shipId}/repair`, {
            method: 'POST'
        });
        
        if (data.success) {
            showSuccess(`Судно отремонтировано! Стоимость: 💰 ${data.cost}`);
            await loadUserData();
            updateUI();
            openShipModal(shipId);
        }
    } catch (error) {
        // Ошибка уже обработана в apiRequest
    }
}

// Функция обновления цены заправки из порта
function updateRefuelPriceFromPort(shipId, pricePerUnit) {
    const inputId = `refuel-amount-${shipId}`;
    const priceId = `refuel-price-${shipId}`;
    const amountInput = document.getElementById(inputId);
    const priceElement = document.getElementById(priceId);
    
    if (amountInput && priceElement) {
        const amount = parseInt(amountInput.value) || 0;
        const totalPrice = pricePerUnit * amount;
        priceElement.textContent = `💰 ${totalPrice}`;
    }
}

// Функция подтверждения заправки из порта
async function confirmRefuelFromPort(shipId, maxAvailable, fuelNeeded, pricePerUnit) {
    // Пытаемся получить значение из слайдера
    const sliderId = `refuel-slider-${shipId}`;
    const slider = document.getElementById(sliderId);
    
    let amount;
    if (slider) {
        amount = parseInt(slider.value);
    } else {
        // Fallback на старое поле ввода
        const inputId = `refuel-amount-${shipId}`;
        const amountInput = document.getElementById(inputId);
        if (!amountInput) {
            showError('Ошибка: поле ввода количества не найдено');
            return;
        }
        amount = parseInt(amountInput.value);
    }
    
    if (!amount || amount <= 0) {
        showError('Количество должно быть больше 0');
        return;
    }
    
    if (amount > fuelNeeded) {
        showError(`Нельзя заправить больше, чем нужно. Нужно: ${fuelNeeded}`);
        return;
    }
    
    if (amount > maxAvailable) {
        showError(`Недостаточно нефти в порту. Доступно: ${maxAvailable}`);
        return;
    }
    
    // Показываем модальное окно подтверждения оплаты
    const ship = ships.find(s => s.id === shipId);
    if (ship) {
        showRefuelConfirmModal(ship, amount, pricePerUnit);
    }
}

// Показать модальное окно подтверждения оплаты бункеровки
function showRefuelConfirmModal(ship, refuelAmount, pricePerUnit) {
    const refuelCost = Math.ceil(refuelAmount * pricePerUnit);
    const hasEnoughMoney = (currentUser.coins || 0) >= refuelCost;
    
    // Создаем модальное окно подтверждения оплаты
    const confirmModal = document.createElement('div');
    confirmModal.className = 'modal active';
    confirmModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <div class="modal-header-title">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1.5rem; height: 1.5rem;">
                        <path d="M3 3h18v18H3zM12 8v8m-4-4h8"/>
                    </svg>
                    <span>Подтверждение оплаты</span>
                </div>
                <span class="modal-close" onclick="closeRefuelConfirmModal()">&times;</span>
            </div>
            <div class="modal-body">
                <div class="modal-section" style="background: var(--yellow-50); border: 1px solid var(--yellow-200);">
                    <div style="display: flex; align-items: start; gap: 0.75rem;">
                        <div style="font-size: 1.5rem;">⚠️</div>
                        <div style="flex: 1;">
                            <p style="font-size: 0.875rem; color: var(--gray-700); margin-bottom: 0.5rem;">
                                С вашего баланса будет списано:
                            </p>
                            <p style="font-size: 1.5rem; font-weight: bold; color: var(--primary-blue); margin-bottom: 0.5rem;">
                                💰 ${refuelCost}
                            </p>
                            <p style="font-size: 0.875rem; color: var(--gray-600);">
                                За бункеровку ${refuelAmount} единиц топлива в Нефтяном заводе
                            </p>
                        </div>
                    </div>
                </div>
                
                <div class="modal-section">
                    <div style="display: flex; justify-content: space-between; font-size: 0.875rem; margin-bottom: 0.5rem;">
                        <span style="color: var(--gray-600);">Количество топлива:</span>
                        <span style="font-weight: 600; color: var(--gray-900);">${refuelAmount}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.875rem; margin-bottom: 0.5rem;">
                        <span style="color: var(--gray-600);">Цена за единицу:</span>
                        <span style="font-weight: 600; color: var(--gray-900);">💰 ${pricePerUnit}</span>
                    </div>
                    <div style="border-top: 1px solid var(--gray-200); padding-top: 0.5rem; margin-top: 0.5rem;">
                        <div style="display: flex; justify-content: space-between;">
                            <span style="font-weight: 600; color: var(--gray-700);">Итого к оплате:</span>
                            <span style="font-weight: bold; color: var(--primary-blue);">💰 ${refuelCost}</span>
                        </div>
                    </div>
                </div>
                
                ${!hasEnoughMoney ? `
                    <div class="modal-section" style="background: var(--red-50); border: 1px solid var(--red-200);">
                        <p style="font-size: 0.875rem; color: var(--red-600);">
                            ⚠️ Недостаточно средств на балансе
                        </p>
                    </div>
                ` : ''}
                
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn-secondary" onclick="closeRefuelConfirmModal()" style="flex: 1;">Отмена</button>
                    <button class="btn-primary" onclick="executeRefuel('${ship.id}', ${refuelAmount})" ${!hasEnoughMoney ? 'disabled' : ''} style="flex: 1; ${!hasEnoughMoney ? 'opacity: 0.5; cursor: not-allowed;' : ''}">Подтвердить</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(confirmModal);
    window.currentRefuelConfirmModal = confirmModal;
}

// Выполнить заправку
async function executeRefuel(shipId, amount) {
    closeRefuelConfirmModal();
    closeRefuelModal();
    await refuelShipFromPort(shipId, amount);
}

// Закрыть модальное окно подтверждения бункеровки
function closeRefuelConfirmModal() {
    if (window.currentRefuelConfirmModal) {
        window.currentRefuelConfirmModal.remove();
        window.currentRefuelConfirmModal = null;
    }
}

window.executeRefuel = executeRefuel;
window.closeRefuelConfirmModal = closeRefuelConfirmModal;

// Функция заправки судна из порта
async function refuelShipFromPort(shipId, amount) {
    try {
        const data = await apiRequest(`${API_URL}/ships/${shipId}/refuel`, {
            method: 'POST',
            body: JSON.stringify({ cargoType: 'oil', amount })
        });
        
        if (data.success) {
            closeRefuelModal();
            closeRefuelConfirmModal();
            showSuccess(`Судно заправлено на ${data.fueled} единиц! Стоимость: 💰 ${data.cost}`);
            await loadUserData();
            await loadPorts(false);
            updateUI();
            openShipModal(shipId);
        }
    } catch (error) {
        // Ошибка уже обработана в apiRequest
        closeRefuelConfirmModal();
    }
}

// Подтверждение буксировки судна
async function confirmTowShip(shipId, currentPortName, estimatedCost) {
    const ship = ships.find(s => s.id === shipId);
    if (!ship) return;
    if (!currentUser) return;
    
    const userCoins = currentUser.coins || 0;
    
    if (estimatedCost && userCoins < estimatedCost) {
        showError(`Недостаточно монет. Требуется примерно 💰 ${estimatedCost}, доступно: 💰 ${userCoins}`);
        return;
    }
    
    // Показываем кастомное модальное окно вместо confirm()
    const modal = document.getElementById('confirm-tow-modal');
    const body = document.getElementById('confirm-tow-body');
    const cancelBtn = document.getElementById('confirm-tow-cancel');
    const okBtn = document.getElementById('confirm-tow-ok');
    
    if (!modal || !body || !cancelBtn || !okBtn) {
        showError('Ошибка: модальное окно буксировки не найдено');
        return;
    }
    
    body.innerHTML = `
        <p style="font-size: 0.875rem; color: var(--gray-700); margin-bottom: 1rem;">
            Отбуксировать судно <strong>"${ship.name}"</strong> из порта <strong>"${currentPortName}"</strong> в порт <strong>"Нефтяной завод"</strong>?
        </p>
        <div class="modal-section" style="background: var(--yellow-50); border: 1px solid var(--yellow-200);">
            <div style="display: flex; align-items: start; gap: 0.75rem;">
                <div style="font-size: 1.5rem;">⚠️</div>
                <div style="flex: 1;">
                    <p style="font-size: 0.875rem; color: var(--gray-700); margin-bottom: 0.5rem;">
                        С вашего баланса будет списано:
                    </p>
                    <p style="font-size: 1.5rem; font-weight: bold; color: var(--primary-blue); margin-bottom: 0.5rem;">
                        💰 ${estimatedCost}
                    </p>
                    <p style="font-size: 0.75rem; color: var(--gray-600);">
                        За буксировку судна в Нефтяной завод
                    </p>
                </div>
            </div>
        </div>
        <div class="modal-section" style="background: var(--gray-50);">
            <div style="font-size: 0.75rem; color: var(--gray-600);">
                После буксировки судно окажется в порту "Нефтяной завод" с нулевым топливом. Вам нужно будет заправить судно нефтью для продолжения работы.
            </div>
        </div>
        ${userCoins < estimatedCost ? `
            <div style="background: var(--red-50); border: 1px solid var(--red-200); border-radius: var(--radius-lg); padding: 0.75rem;">
                <p style="font-size: 0.875rem; color: var(--red-600);">
                    ⚠️ Недостаточно средств на балансе
                </p>
            </div>
        ` : ''}
    `;
    
    modal.classList.add('active');
    
    // Обработчики событий
    const handleConfirm = async () => {
        modal.classList.remove('active');
        cancelBtn.removeEventListener('click', handleCancel);
        okBtn.removeEventListener('click', handleConfirm);
        await towShip(shipId);
    };
    
    const handleCancel = () => {
        modal.classList.remove('active');
        cancelBtn.removeEventListener('click', handleCancel);
        okBtn.removeEventListener('click', handleConfirm);
    };
    
    // Удаляем старые обработчики и добавляем новые
    cancelBtn.replaceWith(cancelBtn.cloneNode(true));
    okBtn.replaceWith(okBtn.cloneNode(true));
    
    const newCancelBtn = document.getElementById('confirm-tow-cancel');
    const newOkBtn = document.getElementById('confirm-tow-ok');
    
    newCancelBtn.addEventListener('click', handleCancel);
    newOkBtn.addEventListener('click', handleConfirm);
    
    // Закрытие по клику вне модального окна
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            handleCancel();
        }
    });
}

// Функция буксировки судна
async function towShip(shipId) {
    try {
        const data = await apiRequest(`${API_URL}/ships/${shipId}/tow`, {
            method: 'POST'
        });
        
        if (data.success) {
            showSuccess(
                `Судно отбуксировано в порт "Нефтяной завод"!\n` +
                `Стоимость: 💰 ${data.cost} монет\n` +
                `Расстояние: ${data.distance.toFixed(1)} миль\n\n` +
                `${data.message || 'Заправьте судно нефтью для продолжения работы.'}`
            );
            await loadUserData();
            await loadPorts(false);
            updateUI();
            openShipModal(shipId);
        }
    } catch (error) {
        // Ошибка уже обработана в apiRequest
    }
}


async function showBuyShipModal() {
    const shipTypes = [
        { type: 'tanker', name: 'Танкер', description: 'Специализированное судно для перевозки нефти и нефтепродуктов', specs: { fuel: 100, capacity: 70 } },
        { type: 'cargo', name: 'Грузовое', description: 'Универсальное грузовое судно для перевозки различных товаров', specs: { fuel: 100, capacity: 50 } },
        { type: 'supply', name: 'Снабженец', description: 'Судно снабжения для доставки провизии и материалов', specs: { fuel: 80, capacity: 40 } }
    ];
    
    const modal = document.getElementById('ship-modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    
    if (!modal || !title || !body) return;
    
    title.textContent = 'Купить судно';
    body.innerHTML = '<div class="loading">Загрузка цен...</div>';
    modal.classList.add('active');
    
    try {
        const userId = currentUser.userId || currentUser.id;
        
        // Запрашиваем актуальные цены с сервера
        const pricePromises = shipTypes.map(st => 
            apiRequest(`${API_URL}/ships/price/${userId}/${st.type}`, {}, false)
                .then(data => ({ ...st, ...data }))
                .catch(error => ({ ...st, error: error.message }))
        );
        
        const shipsWithPrices = await Promise.all(pricePromises);
        
        // Функция для получения иконки судна
        const getShipIcon = (type) => {
            try {
                if (type === 'tanker' && window.ShipIcons && window.ShipIcons.getTankerIcon) {
                    return window.ShipIcons.getTankerIcon(64);
                } else if (type === 'cargo' && window.ShipIcons && window.ShipIcons.getCargoShipIcon) {
                    return window.ShipIcons.getCargoShipIcon(64);
                } else if (type === 'supply' && window.ShipIcons && window.ShipIcons.getSupplyShipIcon) {
                    return window.ShipIcons.getSupplyShipIcon(64);
                }
            } catch (e) {
                console.error('Ошибка загрузки иконки судна:', e);
            }
            return '🚢';
        };
        
        body.innerHTML = `
            <p style="font-size: 0.875rem; color: var(--gray-600); margin-bottom: 1rem;">
                Выберите тип судна для покупки:
            </p>
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                ${shipsWithPrices.map(st => `
                    <div onclick="purchaseShip('${st.type}')" style="background: var(--white); border: 2px solid var(--gray-200); border-radius: var(--radius-xl); padding: 1rem; cursor: pointer; transition: all 0.2s; hover:border-color: var(--primary-blue); hover:box-shadow: var(--shadow-md);">
                        <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
                            <div style="width: 4rem; height: 4rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                ${getShipIcon(st.type)}
                            </div>
                            <div style="flex: 1;">
                                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.25rem;">
                                    <h3 style="font-size: 1rem; font-weight: 600; color: var(--gray-900); margin: 0;">${st.typeName || st.name}</h3>
                                    ${!st.error ? `
                                        <div style="display: flex; align-items: center; gap: 0.25rem; background: var(--primary-blue); color: white; padding: 0.25rem 0.75rem; border-radius: 9999px;">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1rem; height: 1rem;">
                                                <circle cx="12" cy="12" r="10"/>
                                                <path d="M12 6v12M15 9a3 3 0 1 0-6 0"/>
                                            </svg>
                                            <span style="font-weight: 600;">${(st.currentPrice || 0).toLocaleString()}</span>
                                        </div>
                                    ` : ''}
                                </div>
                                <p style="font-size: 0.75rem; color: var(--gray-600); margin-bottom: 0.75rem;">${st.description}</p>
                                <div style="display: flex; gap: 0.75rem; font-size: 0.75rem;">
                                    <div style="display: flex; align-items: center; gap: 0.25rem; color: var(--gray-600);">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 0.875rem; height: 0.875rem;">
                                            <path d="M3 3h18v18H3zM12 8v8m-4-4h8"/>
                                        </svg>
                                        <span>Топливо: ${st.specs.fuel}</span>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 0.25rem; color: var(--gray-600);">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 0.875rem; height: 0.875rem;">
                                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                                        </svg>
                                        <span>Вместимость: ${st.specs.capacity}</span>
                                    </div>
                                </div>
                                ${st.error ? `
                                    <p style="color: var(--red-600); font-size: 0.875rem; margin-top: 0.5rem;">Ошибка: ${st.error}</p>
                                ` : st.existingShipsCount > 0 ? `
                                    <p style="font-size: 0.75rem; color: var(--gray-500); margin-top: 0.5rem;">
                                        У вас уже ${st.existingShipsCount} ${st.existingShipsCount === 1 ? 'судно' : st.existingShipsCount < 5 ? 'судна' : 'судов'} этого типа
                                    </p>
                                    <p style="font-size: 0.7rem; color: var(--gray-400);">
                                        Базовая цена: ${st.basePrice} (это ${st.nextShipNumber}-е судно)
                                    </p>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        body.innerHTML = `
            <div class="loading" style="color: var(--red-600);">
                Ошибка загрузки цен: ${error.message}
            </div>
        `;
    }
}

async function purchaseShip(shipType) {
    try {
        // Используем userId (UUID) если он есть, иначе используем telegramId
        const userId = currentUser.userId || currentUser.id;
        
        const data = await apiRequest(`${API_URL}/ships/buy`, {
            method: 'POST',
            body: JSON.stringify({ userId: userId, type: shipType })
        });
        
        if (data.success) {
            showSuccess('Судно куплено!');
            await loadUserData();
            updateUI();
            const shipModal = document.getElementById('ship-modal');
            if (shipModal) {
                shipModal.classList.remove('active');
            }
        }
    } catch (error) {
        // Ошибка уже обработана в apiRequest
    }
}

// Вспомогательные функции
function getShipTypeName(type) {
    const names = {
        'tanker': 'Танкер',
        'cargo': 'Грузовое',
        'supply': 'Снабженец'
    };
    return names[type] || type;
}

function getCargoName(type) {
    const names = {
        'oil': 'Нефть',
        'materials': 'Материалы',
        'provisions': 'Провизия'
    };
    return names[type] || type;
}

// Правила генерации ресурсов для каждого порта
// Теперь грузятся с backend, чтобы не было дублирования логики
let PORT_GENERATION_RULES = {};

function getPortName(portId) {
    const port = ports.find(p => p.id === portId);
    return port ? port.name : 'Неизвестно';
}

function getAvailableCargoForPort(portId) {
    const port = ports.find(p => p.id === portId);
    return port ? port.availableCargo : [];
}

function calculateTravelCost(ship, port) {
    // Стоимость путешествия рассчитывается на сервере на основе расстояния и типа судна
    // Не можем точно рассчитать на фронтенде без данных о расстоянии
    // Показываем "?" - точная стоимость будет показана при отправке
    return '?';
}

// Функция для выбора груза для загрузки (показывает детали с слайдером)
function selectCargoForLoading(shipId, cargoType, maxAvailable, pricePerUnit, maxAmount) {
    const ship = ships.find(s => s.id === shipId);
    if (!ship) return;
    
    const modalBody = document.getElementById('modal-body');
    if (!modalBody) return;
    
    // Находим секцию загрузки груза и заменяем её на детали
    const cargoSection = modalBody.querySelector('.cargo-selection-list')?.closest('.modal-section');
    if (!cargoSection) return;
    
    let cargoIcon = '';
    try {
        if (cargoType === 'oil' && window.CargoIcons && window.CargoIcons.getOilIcon) {
            cargoIcon = window.CargoIcons.getOilIcon(24);
        } else if (cargoType === 'materials' && window.CargoIcons && window.CargoIcons.getMaterialsIcon) {
            cargoIcon = window.CargoIcons.getMaterialsIcon(24);
        } else if (cargoType === 'provisions' && window.CargoIcons && window.CargoIcons.getProvisionIcon) {
            cargoIcon = window.CargoIcons.getProvisionIcon(24);
        }
    } catch (e) {
        console.error('Ошибка загрузки иконки груза:', e);
        cargoIcon = '📦';
    }
    
    const initialAmount = Math.min(10, maxAmount);
    const totalCost = initialAmount * pricePerUnit;
    
    cargoSection.innerHTML = `
        <div class="modal-section-title">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1rem; height: 1rem;">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
            <span>Загрузить груз</span>
        </div>
        <div class="cargo-selection-details">
            <div class="cargo-selection-header">
                <div class="cargo-selection-info">
                    <div class="cargo-selection-icon">
                        ${cargoIcon}
                    </div>
                    <span class="cargo-selection-name">${getCargoName(cargoType)}</span>
                </div>
                <span class="cargo-selection-max">Макс: ${maxAmount} ед.</span>
            </div>
            <div class="cargo-amount-control">
                <div class="cargo-amount-display">
                    <span>Количество:</span>
                    <span class="cargo-amount-value" id="cargo-amount-display-${shipId}-${cargoType}">${initialAmount} ед.</span>
                </div>
                <input type="range" 
                       class="cargo-slider" 
                       id="cargo-slider-${shipId}-${cargoType}"
                       min="1" 
                       max="${maxAmount}" 
                       value="${initialAmount}"
                       oninput="updateCargoAmount('${shipId}', '${cargoType}', ${pricePerUnit}, ${maxAmount})">
                <div class="cargo-slider-labels">
                    <span>1</span>
                    <span>${maxAmount}</span>
                </div>
            </div>
            <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
                <button class="btn-secondary" onclick="cancelCargoSelection('${shipId}')" style="flex: 1;">Отмена</button>
                <button class="btn-primary btn-green" onclick="confirmLoadCargo('${shipId}', '${cargoType}', ${maxAvailable}, ${pricePerUnit})" style="flex: 1;">Загрузить</button>
            </div>
        </div>
    `;
}

// Обновление количества груза при изменении слайдера
function updateCargoAmount(shipId, cargoType, pricePerUnit, maxAmount) {
    const slider = document.getElementById(`cargo-slider-${shipId}-${cargoType}`);
    const display = document.getElementById(`cargo-amount-display-${shipId}-${cargoType}`);
    if (slider && display) {
        const amount = parseInt(slider.value);
        display.textContent = `${amount} ед.`;
    }
}

// Отмена выбора груза
function cancelCargoSelection(shipId) {
    openShipModal(shipId);
}

// Экспорт функций для использования в HTML
window.openShipModal = openShipModal;
window.openPortModal = openPortModal;
window.sendShipToPort = sendShipToPort;
window.confirmSendShipToPort = confirmSendShipToPort;
window.selectCargo = selectCargo;
window.confirmLoadCargo = confirmLoadCargo;
window.unloadCargo = unloadCargo;
window.repairShip = repairShip;
window.refuelShipFromPort = refuelShipFromPort;
window.confirmRefuelFromPort = confirmRefuelFromPort;
window.updateRefuelPriceFromPort = updateRefuelPriceFromPort;
window.purchaseShip = purchaseShip;
window.showBuyShipModal = showBuyShipModal;
window.confirmTowShip = confirmTowShip;
window.towShip = towShip;
window.selectCargoForLoading = selectCargoForLoading;
window.updateCargoAmount = updateCargoAmount;
window.cancelCargoSelection = cancelCargoSelection;
window.openRefuelModal = openRefuelModal;
window.updateRefuelAmount = updateRefuelAmount;
window.closeRefuelModal = closeRefuelModal;