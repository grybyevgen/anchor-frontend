// Конфигурация API
const API_URL = 'https://anchor-game-production.up.railway.app/api';
// Для локальной разработки: const API_URL = 'http://localhost:3000/api';

// Состояние приложения
let currentUser = null;
let ships = [];
let ports = [];
let marketCargo = [];
let isLoading = false;
let autoRefreshInterval = null;
let marketFilterPort = 'all'; // Фильтр порта: 'all' или ID порта
let marketGroupByPort = false; // Группировать ли грузы по портам

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
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
        await loadMarket(false);
        
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

// Показать ошибку
function showError(message) {
    // Можно использовать Telegram Web App API для показа уведомлений
    if (window.TelegramWebApp && window.TelegramWebApp.showAlert) {
        window.TelegramWebApp.showAlert(message);
    } else {
        alert(message);
    }
}

// Показать успешное сообщение
function showSuccess(message) {
    if (window.TelegramWebApp && window.TelegramWebApp.showAlert) {
        window.TelegramWebApp.showAlert(message);
    } else {
        alert(message);
    }
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

async function loadMarket(showLoading = true) {
    try {
        const data = await apiRequest(`${API_URL}/market`, {}, showLoading);
        if (data.success) {
            marketCargo = data.cargo || [];
        }
    } catch (error) {
        console.error('Ошибка загрузки рынка:', error);
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
            const tab = e.target.dataset.tab;
            switchTab(tab);
        });
    });

    // Модальные окна
    document.querySelectorAll('.close').forEach(close => {
        close.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });

    // Кнопка покупки судна
    document.getElementById('buy-ship-btn').addEventListener('click', showBuyShipModal);
}

async function switchTab(tabName) {
    // Убираем активный класс со всех вкладок
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Активируем выбранную вкладку
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Обновляем данные рынка при переключении на вкладку "Рынок"
    if (tabName === 'market') {
        try {
            await loadMarket(false); // Загружаем без индикатора загрузки
            renderMarket();
        } catch (error) {
            console.error('Ошибка загрузки рынка:', error);
        }
    }
}

function updateUI() {
    // Обновляем монеты
    document.getElementById('coins').textContent = `💰 ${currentUser.coins || 0}`;
    document.getElementById('username').textContent = currentUser.username;
    
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
    
    // Обновляем рынок
    renderMarket();
}

function renderShips() {
    const shipsList = document.getElementById('ships-list');
    
    if (ships.length === 0) {
        shipsList.innerHTML = '<div class="loading">У вас пока нет судов. Купите первое судно!</div>';
        return;
    }

    shipsList.innerHTML = ships.map(ship => `
        <div class="ship-card" onclick="openShipModal('${ship.id}')">
            <h3>${ship.name}</h3>
            <div class="ship-info">
                <div class="stat">
                    <span>Тип:</span>
                    <span>${getShipTypeName(ship.type)}</span>
                </div>
                <div class="stat">
                    <span>Порт:</span>
                    <span>${getPortName(ship.currentPortId)}</span>
                </div>
                <div class="stat">
                    <span>Нефть:</span>
                    <span>${ship.fuel}/${ship.maxFuel}</span>
                </div>
                <div class="stat">
                    <span>Здоровье:</span>
                    <span>${ship.health}/${ship.maxHealth}</span>
                </div>
                <div class="stat">
                    <span>Груз:</span>
                    <span>${ship.cargo ? getCargoName(ship.cargo.type) + ' (' + ship.cargo.amount + ')' : 'Пусто'}</span>
                </div>
                ${ship.isTraveling ? '<div class="stat"><span>⏳ В пути...</span></div>' : ''}
            </div>
        </div>
    `).join('');
}

function renderPorts() {
    const portsList = document.getElementById('ports-list');
    portsList.innerHTML = ports.map(port => `
        <div class="port-card" onclick="openPortModal('${port.id}')">
            <h3>${port.name}</h3>
            <div class="port-info">
                <div class="stat">
                    <span>Грузы доступны:</span>
                    <span>${port.availableCargo.length}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function renderMarket() {
    const marketList = document.getElementById('market-list');
    
    // Фильтруем грузы по выбранному порту
    let filteredCargo = marketCargo;
    if (marketFilterPort !== 'all') {
        filteredCargo = marketCargo.filter(cargo => cargo.portId === marketFilterPort);
    }
    
    // Сортируем/группируем грузы
    let sortedCargo = [...filteredCargo];
    if (marketGroupByPort) {
        // Группируем по портам, сортируем по названию порта
        sortedCargo.sort((a, b) => {
            const portA = getPortName(a.portId);
            const portB = getPortName(b.portId);
            if (portA !== portB) {
                return portA.localeCompare(portB, 'ru');
            }
            // Если порты одинаковые, сортируем по типу груза
            return getCargoName(a.type).localeCompare(getCargoName(b.type), 'ru');
        });
    } else {
        // Обычная сортировка по типу груза
        sortedCargo.sort((a, b) => {
            return getCargoName(a.type).localeCompare(getCargoName(b.type), 'ru');
        });
    }
    
    if (filteredCargo.length === 0) {
        const noCargoMessage = marketFilterPort !== 'all' 
            ? `<div class="loading">В выбранном порту нет грузов на рынке</div>`
            : '<div class="loading">На рынке пока нет грузов</div>';
        marketList.innerHTML = `
            <div class="market-filters" style="margin-bottom: 15px;">
                <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                    <label style="font-weight: bold;">Фильтр по порту:</label>
                    <select id="market-port-filter" 
                            onchange="setMarketFilterPort(this.value)"
                            style="padding: 5px 10px; border: 1px solid #ccc; border-radius: 4px; min-width: 150px;">
                        <option value="all">Все порты</option>
                        ${ports.map(port => `
                            <option value="${port.id}" ${marketFilterPort === port.id ? 'selected' : ''}>
                                ${port.name}
                            </option>
                        `).join('')}
                    </select>
                    <label style="margin-left: 10px; font-weight: bold;">
                        <input type="checkbox" 
                               id="market-group-by-port"
                               ${marketGroupByPort ? 'checked' : ''}
                               onchange="setMarketGroupByPort(this.checked)"
                               style="margin-right: 5px;">
                        Группировать по портам
                    </label>
                </div>
            </div>
            ${noCargoMessage}
        `;
        return;
    }

    // Группируем грузы по портам если включена группировка
    let groupedCargo = {};
    if (marketGroupByPort) {
        sortedCargo.forEach(cargo => {
            const portId = cargo.portId;
            if (!groupedCargo[portId]) {
                groupedCargo[portId] = [];
            }
            groupedCargo[portId].push(cargo);
        });
    }

    const renderCargoItem = (cargo) => {
        const pricePerUnit = Math.floor(cargo.price / cargo.amount);
        const maxAvailable = Math.min(cargo.amount, 100);
        return `
        <div class="market-item">
            <h3>${getCargoName(cargo.type)}</h3>
            <div class="port-info">
                <div class="stat">
                    <span>Количество:</span>
                    <span>${cargo.amount}</span>
                </div>
                <div class="stat">
                    <span>Цена за единицу:</span>
                    <span>💰 ${pricePerUnit}</span>
                </div>
                ${!marketGroupByPort || marketFilterPort !== 'all' ? `
                <div class="stat">
                    <span>Порт:</span>
                    <span>${getPortName(cargo.portId)}</span>
                </div>
                ` : ''}
                <div style="display: flex; gap: 10px; margin-top: 10px; align-items: center;">
                    <input type="number" 
                           id="market-cargo-amount-${cargo.id}" 
                           min="1" 
                           max="${maxAvailable}" 
                           value="${maxAvailable > 0 ? 1 : 0}" 
                           style="width: 80px; padding: 5px; border: 1px solid #ccc; border-radius: 4px;"
                           ${maxAvailable === 0 ? 'disabled' : ''}
                           onchange="updateMarketPrice('${cargo.id}', ${pricePerUnit})">
                    <span>шт. (макс. ${maxAvailable})</span>
                    <span id="market-price-${cargo.id}" style="font-weight: bold;">💰 ${pricePerUnit}</span>
                    <button class="btn-primary" 
                            onclick="confirmBuyCargo('${cargo.id}', ${cargo.amount}, ${pricePerUnit})"
                            ${maxAvailable === 0 ? 'disabled' : ''}>
                        Купить
                    </button>
                </div>
            </div>
        </div>
        `;
    };

    let cargoListHTML = '';
    if (marketGroupByPort && marketFilterPort === 'all') {
        // Группировка по портам
        const portIds = Object.keys(groupedCargo).sort((a, b) => {
            const portA = getPortName(a);
            const portB = getPortName(b);
            return portA.localeCompare(portB, 'ru');
        });
        
        portIds.forEach(portId => {
            const portCargo = groupedCargo[portId];
            cargoListHTML += `
                <div style="margin-bottom: 25px;">
                    <h3 style="background: #4a90e2; color: white; padding: 10px; border-radius: 5px 5px 0 0; margin: 0;">
                        🏭 ${getPortName(portId)} (${portCargo.length} ${portCargo.length === 1 ? 'предложение' : 'предложений'})
                    </h3>
                    <div style="border: 1px solid #4a90e2; border-top: none; border-radius: 0 0 5px 5px; padding: 10px;">
                        ${portCargo.map(renderCargoItem).join('')}
                    </div>
                </div>
            `;
        });
    } else {
        // Обычный список без группировки
        cargoListHTML = sortedCargo.map(renderCargoItem).join('');
    }

    marketList.innerHTML = `
        <div class="market-filters" style="margin-bottom: 15px; padding: 10px; background: #f5f5f5; border-radius: 5px;">
            <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                <label style="font-weight: bold;">Фильтр по порту:</label>
                <select id="market-port-filter" 
                        onchange="setMarketFilterPort(this.value)"
                        style="padding: 5px 10px; border: 1px solid #ccc; border-radius: 4px; min-width: 150px;">
                    <option value="all">Все порты</option>
                    ${ports.map(port => `
                        <option value="${port.id}" ${marketFilterPort === port.id ? 'selected' : ''}>
                            ${port.name}
                        </option>
                    `).join('')}
                </select>
                <label style="margin-left: 10px; font-weight: bold;">
                    <input type="checkbox" 
                           id="market-group-by-port"
                           ${marketGroupByPort ? 'checked' : ''}
                           onchange="setMarketGroupByPort(this.checked)"
                           style="margin-right: 5px;">
                    Группировать по портам
                </label>
                <span style="margin-left: auto; color: #666; font-size: 0.9em;">
                    Всего: ${filteredCargo.length} ${filteredCargo.length === 1 ? 'предложение' : 'предложений'}
                </span>
            </div>
        </div>
        ${cargoListHTML}
    `;
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

    title.textContent = ship.name;
    
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
        body.innerHTML = `
            <div class="ship-info">
                <div class="stat"><span>Тип:</span><span>${getShipTypeName(ship.type)}</span></div>
                <div class="stat"><span>Текущий порт:</span><span>${getPortName(ship.currentPortId)}</span></div>
                <div class="stat"><span>Нефть:</span><span>${ship.fuel}/${ship.maxFuel}</span></div>
                <div class="stat"><span>Здоровье:</span><span>${ship.health}/${ship.maxHealth}</span></div>
                <div class="stat"><span>Экипаж:</span><span>Уровень ${ship.crewLevel}</span></div>
            </div>
            
            ${ship.cargo ? `
                <div style="margin: 15px 0;">
                    <h4>Текущий груз: ${getCargoName(ship.cargo.type)} (${ship.cargo.amount})</h4>
                    <div style="margin: 10px 0;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Куда выгрузить:</label>
                        <select id="unload-destination-${ship.id}" style="padding: 5px 10px; border: 1px solid #ccc; border-radius: 4px; width: 100%; margin-bottom: 10px;">
                            <option value="market">📦 На рынок</option>
                            <option value="port">🏭 В порт</option>
                        </select>
                    </div>
                    <button class="btn-primary" onclick="unloadCargo('${ship.id}')">Выгрузить груз</button>
                </div>
            ` : `
                <div style="margin: 15px 0;">
                    <h4>Загрузить груз:</h4>
                    <div class="cargo-selector">
                        ${getAvailableCargoForPort(ship.currentPortId).map(cargo => {
                            const maxAvailable = Math.min(cargo.amount, 100); // Максимум 100 единиц или доступное количество
                            return `
                                <div class="cargo-option" style="margin-bottom: 10px;">
                                    <div><strong>${getCargoName(cargo.type)}</strong> - Доступно: ${cargo.amount} - 💰 ${cargo.price || 'Бесплатно'}/ед.</div>
                                    <div style="display: flex; gap: 10px; margin-top: 5px; align-items: center;">
                                        <input type="number" 
                                               id="cargo-amount-${cargo.type}-${ship.id}" 
                                               min="1" 
                                               max="${maxAvailable}" 
                                               value="${maxAvailable > 0 ? 1 : 0}" 
                                               style="width: 80px; padding: 5px; border: 1px solid #ccc; border-radius: 4px;"
                                               ${maxAvailable === 0 ? 'disabled' : ''}>
                                        <span>шт. (макс. ${maxAvailable})</span>
                                        <button class="btn-primary" 
                                                onclick="confirmLoadCargo('${ship.id}', '${cargo.type}', ${cargo.amount}, ${cargo.price || 0})"
                                                ${maxAvailable === 0 ? 'disabled' : ''}>
                                            Загрузить
                                        </button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `}
            
            <div style="margin: 15px 0;">
                <h4>Отправить в порт:</h4>
                <div class="port-selector">
                    ${ports.filter(p => p.id !== ship.currentPortId).map(port => `
                        <div class="port-option" onclick="confirmSendShipToPort('${ship.id}', '${port.id}', '${port.name}')">
                            ${port.name} (💰 ${calculateTravelCost(ship, port)} - рассчитывается при отправке)
                        </div>
                    `).join('')}
                </div>
            </div>
            
            ${ship.fuel < ship.maxFuel && !ship.isTraveling ? (() => {
                // Находим нефть на рынке в порту судна
                const availableOil = marketCargo.filter(cargo => 
                    cargo.type === 'oil' && 
                    cargo.portId === ship.currentPortId
                );
                const fuelNeeded = ship.maxFuel - ship.fuel;
                
                return `
                    <div style="margin: 15px 0;">
                        <h4>🛢️ Бункеровка (заправка топливом):</h4>
                        <div class="stat">
                            <span>Текущее топливо:</span>
                            <span>${ship.fuel}/${ship.maxFuel}</span>
                        </div>
                        ${availableOil.length > 0 ? `
                            ${availableOil.map(oil => {
                                const maxAvailable = Math.min(oil.amount, fuelNeeded);
                                const pricePerUnit = Math.floor(oil.price / oil.amount);
                                return `
                                    <div class="cargo-option" style="margin-bottom: 10px;">
                                        <div><strong>Нефть</strong> - Доступно: ${oil.amount} - 💰 ${pricePerUnit}/ед.</div>
                                        <div style="display: flex; gap: 10px; margin-top: 5px; align-items: center;">
                                            <input type="number" 
                                                   id="refuel-amount-${oil.id}-${ship.id}" 
                                                   min="1" 
                                                   max="${maxAvailable}" 
                                                   value="${maxAvailable > 0 ? 1 : 0}" 
                                                   style="width: 80px; padding: 5px; border: 1px solid #ccc; border-radius: 4px;"
                                                   ${maxAvailable === 0 ? 'disabled' : ''}
                                                   onchange="updateRefuelPrice('${oil.id}', '${ship.id}', ${pricePerUnit})">
                                            <span>шт. (макс. ${maxAvailable}, нужно ${fuelNeeded})</span>
                                            <span id="refuel-price-${oil.id}-${ship.id}" style="font-weight: bold;">💰 ${pricePerUnit}</span>
                                            <button class="btn-primary" 
                                                    onclick="confirmRefuel('${ship.id}', '${oil.id}', ${oil.amount}, ${fuelNeeded})"
                                                    ${maxAvailable === 0 ? 'disabled' : ''}>
                                                Заправить
                                            </button>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        ` : `
                            <div style="padding: 10px; background: #f0f0f0; border-radius: 5px;">
                                В этом порту нет нефти на рынке для заправки
                            </div>
                        `}
                    </div>
                `;
            })() : ''}
            
            ${ship.health < ship.maxHealth ? `
                <button class="btn-secondary" onclick="repairShip('${ship.id}')">Починить судно</button>
            ` : ''}
        `;
    }

    modal.style.display = 'block';
}

async function openPortModal(portId) {
    const port = ports.find(p => p.id === portId);
    if (!port) return;

    const modal = document.getElementById('port-modal');
    const title = document.getElementById('port-modal-title');
    const body = document.getElementById('port-modal-body');

    title.textContent = port.name;
    body.innerHTML = `
        <div class="port-info">
            <h4>Доступные грузы:</h4>
            ${port.availableCargo.map(cargo => `
                <div class="cargo-option">
                    ${getCargoName(cargo.type)} - ${cargo.amount} единиц
                </div>
            `).join('')}
        </div>
    `;

    modal.style.display = 'block';
}

async function confirmSendShipToPort(shipId, portId, portName) {
    const ship = ships.find(s => s.id === shipId);
    
    if (!ship) {
        showError('Судно не найдено');
        return;
    }
    
    // Сначала отправляем запрос, чтобы получить точную стоимость
    // Если недостаточно топлива - сервер вернет ошибку с деталями
    try {
        const data = await apiRequest(`${API_URL}/ships/${shipId}/travel`, {
            method: 'POST',
            body: JSON.stringify({ portId })
        });
        
        if (data.success) {
            const fuelInfo = data.fuelCost ? ` (расход топлива: ${data.fuelCost})` : '';
            const distanceInfo = data.distance ? ` (расстояние: ${data.distance} миль)` : '';
            showSuccess(`Судно отправлено в ${portName}!${fuelInfo}${distanceInfo}`);
            await loadUserData();
            updateUI();
            document.getElementById('ship-modal').style.display = 'none';
        }
    } catch (error) {
        // Ошибка уже обработана в apiRequest
    }
}

async function sendShipToPort(shipId, portId) {
    // Обертка для обратной совместимости
    const port = ports.find(p => p.id === portId);
    if (!port) return;
    await confirmSendShipToPort(shipId, portId, port.name);
}

// Функция подтверждения загрузки груза с выбором количества
async function confirmLoadCargo(shipId, cargoType, maxAvailable, pricePerUnit) {
    const inputId = `cargo-amount-${cargoType}-${shipId}`;
    const amountInput = document.getElementById(inputId);
    
    if (!amountInput) {
        showError('Ошибка: поле ввода количества не найдено');
        return;
    }
    
    const amount = parseInt(amountInput.value);
    
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
    
    await selectCargo(shipId, cargoType, amount);
}

async function selectCargo(shipId, cargoType, amount) {
    try {
        const data = await apiRequest(`${API_URL}/ships/${shipId}/load`, {
            method: 'POST',
            body: JSON.stringify({ cargoType, amount })
        });
        
        if (data.success) {
            showSuccess('Груз загружен!');
            await loadUserData();
            updateUI();
            openShipModal(shipId);
        }
    } catch (error) {
        // Ошибка уже обработана в apiRequest
    }
}

async function unloadCargo(shipId) {
    try {
        // Получаем выбранное место назначения
        const destinationSelect = document.getElementById(`unload-destination-${shipId}`);
        const destination = destinationSelect ? destinationSelect.value : 'market';
        
        const data = await apiRequest(`${API_URL}/ships/${shipId}/unload`, {
            method: 'POST',
            body: JSON.stringify({ destination })
        });
        
        if (data.success) {
            // Формируем детальное сообщение о выгрузке
            const destinationText = destination === 'market' ? 'на рынок' : 'в порт';
            let message = `Груз выгружен ${destinationText}! 💰 Получено: ${data.reward} монет`;
            
            // Добавляем детали в одну строку для совместимости с alert
            const details = [];
            if (data.grossReward && data.grossReward !== data.reward) {
                details.push(`Брутто: ${data.grossReward}`);
            }
            if (data.portFees !== undefined && data.portFees > 0) {
                details.push(`Сборы: ${data.portFees}`);
            }
            if (data.profitTax !== undefined && data.profitTax > 0) {
                details.push(`Налог: ${data.profitTax}`);
            }
            if (data.distance) {
                details.push(`Расстояние: ${data.distance} миль`);
            }
            
            if (details.length > 0) {
                message += ` (${details.join(', ')})`;
            }
            
            showSuccess(message);
            await loadUserData();
            await loadMarket();
            updateUI();
            openShipModal(shipId);
        }
    } catch (error) {
        // Ошибка уже обработана в apiRequest
    }
}

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

// Функция обновления цены заправки
function updateRefuelPrice(oilId, shipId, pricePerUnit) {
    const inputId = `refuel-amount-${oilId}-${shipId}`;
    const priceId = `refuel-price-${oilId}-${shipId}`;
    const amountInput = document.getElementById(inputId);
    const priceElement = document.getElementById(priceId);
    
    if (amountInput && priceElement) {
        const amount = parseInt(amountInput.value) || 0;
        const totalPrice = pricePerUnit * amount;
        priceElement.textContent = `💰 ${totalPrice}`;
    }
}

// Функция подтверждения заправки
async function confirmRefuel(shipId, oilId, maxAvailable, fuelNeeded) {
    const inputId = `refuel-amount-${oilId}-${shipId}`;
    const amountInput = document.getElementById(inputId);
    
    if (!amountInput) {
        showError('Ошибка: поле ввода количества не найдено');
        return;
    }
    
    const amount = parseInt(amountInput.value);
    
    if (!amount || amount <= 0) {
        showError('Количество должно быть больше 0');
        return;
    }
    
    if (amount > fuelNeeded) {
        showError(`Нельзя заправить больше, чем нужно. Нужно: ${fuelNeeded}`);
        return;
    }
    
    if (amount > maxAvailable) {
        showError(`Недостаточно нефти на рынке. Доступно: ${maxAvailable}`);
        return;
    }
    
    await refuelShip(shipId, oilId, amount);
}

// Функция заправки судна
async function refuelShip(shipId, cargoId, amount) {
    try {
        const data = await apiRequest(`${API_URL}/ships/${shipId}/refuel`, {
            method: 'POST',
            body: JSON.stringify({ cargoId, amount })
        });
        
        if (data.success) {
            showSuccess(`Судно заправлено на ${data.fueled} единиц! Стоимость: 💰 ${data.cost}`);
            await loadUserData();
            await loadMarket();
            updateUI();
            openShipModal(shipId);
        }
    } catch (error) {
        // Ошибка уже обработана в apiRequest
    }
}

// Функция подтверждения покупки груза с рынка с выбором количества
async function confirmBuyCargo(cargoId, maxAvailable, pricePerUnit) {
    const inputId = `market-cargo-amount-${cargoId}`;
    const amountInput = document.getElementById(inputId);
    
    if (!amountInput) {
        showError('Ошибка: поле ввода количества не найдено');
        return;
    }
    
    const amount = parseInt(amountInput.value);
    
    if (!amount || amount <= 0) {
        showError('Количество должно быть больше 0');
        return;
    }
    
    if (amount > 100) {
        showError('Максимальное количество груза - 100 единиц');
        return;
    }
    
    if (amount > maxAvailable) {
        showError(`Недостаточно груза на рынке. Доступно: ${maxAvailable}`);
        return;
    }
    
    await buyCargo(cargoId, amount);
}

// Функция обновления отображаемой цены при изменении количества
function updateMarketPrice(cargoId, pricePerUnit) {
    const inputId = `market-cargo-amount-${cargoId}`;
    const priceId = `market-price-${cargoId}`;
    const amountInput = document.getElementById(inputId);
    const priceElement = document.getElementById(priceId);
    
    if (amountInput && priceElement) {
        const amount = parseInt(amountInput.value) || 0;
        const totalPrice = pricePerUnit * amount;
        priceElement.textContent = `💰 ${totalPrice}`;
    }
}

async function buyCargo(cargoId, amount) {
    try {
        // Используем userId (UUID) если он есть, иначе используем telegramId
        const userId = currentUser.userId || currentUser.id;
        
        const data = await apiRequest(`${API_URL}/market/${cargoId}/buy`, {
            method: 'POST',
            body: JSON.stringify({ userId: userId, amount: amount })
        });
        
        if (data.success) {
            showSuccess(`Груз куплен! Загружено: ${data.boughtAmount || amount} единиц`);
            await loadUserData();
            await loadMarket();
            updateUI();
        }
    } catch (error) {
        // Ошибка уже обработана в apiRequest
    }
}

async function showBuyShipModal() {
    const shipTypes = [
        { type: 'tanker', name: 'Танкер', description: 'Перевозит нефть' },
        { type: 'cargo', name: 'Грузовое судно', description: 'Перевозит материалы' },
        { type: 'supply', name: 'Снабженец', description: 'Перевозит провизию' }
    ];
    
    const modal = document.getElementById('ship-modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    
    title.textContent = 'Купить судно';
    body.innerHTML = '<div class="loading">Загрузка цен...</div>';
    modal.style.display = 'block';
    
    try {
        const userId = currentUser.userId || currentUser.id;
        
        // Запрашиваем актуальные цены с сервера
        const pricePromises = shipTypes.map(st => 
            apiRequest(`${API_URL}/ships/price/${userId}/${st.type}`, {}, false)
                .then(data => ({ ...st, ...data }))
                .catch(error => ({ ...st, error: error.message }))
        );
        
        const shipsWithPrices = await Promise.all(pricePromises);
        
        body.innerHTML = `
            <div class="cargo-selector">
                ${shipsWithPrices.map(st => `
                    <div class="cargo-option" onclick="purchaseShip('${st.type}')">
                        <h4>${st.typeName || st.name}</h4>
                        <p>${st.description}</p>
                        ${st.error ? `
                            <p style="color: red;">Ошибка: ${st.error}</p>
                        ` : `
                            <p>💰 ${st.currentPrice || 'N/A'}</p>
                            ${st.existingShipsCount > 0 ? `
                                <p style="font-size: 0.9em; color: #666;">
                                    У вас уже ${st.existingShipsCount} ${st.existingShipsCount === 1 ? 'судно' : st.existingShipsCount < 5 ? 'судна' : 'судов'} этого типа
                                </p>
                                <p style="font-size: 0.85em; color: #999;">
                                    Базовая цена: ${st.basePrice} (это ${st.nextShipNumber}-е судно)
                                </p>
                            ` : ''}
                        `}
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        body.innerHTML = `
            <div class="loading" style="color: red;">
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
            document.getElementById('ship-modal').style.display = 'none';
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

// Функции для фильтрации и группировки рынка
function setMarketFilterPort(portId) {
    marketFilterPort = portId;
    renderMarket();
}

function setMarketGroupByPort(group) {
    marketGroupByPort = group;
    renderMarket();
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
window.refuelShip = refuelShip;
window.confirmRefuel = confirmRefuel;
window.updateRefuelPrice = updateRefuelPrice;
window.buyCargo = buyCargo;
window.confirmBuyCargo = confirmBuyCargo;
window.updateMarketPrice = updateMarketPrice;
window.setMarketFilterPort = setMarketFilterPort;
window.setMarketGroupByPort = setMarketGroupByPort;
window.purchaseShip = purchaseShip;
window.showBuyShipModal = showBuyShipModal;