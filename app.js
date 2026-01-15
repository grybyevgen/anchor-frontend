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

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupEventListeners();
});

async function initApp() {
    // Получаем данные пользователя из Telegram
    currentUser = {
        id: window.TelegramWebApp.userId,
        username: window.TelegramWebApp.username
    };

    if (!currentUser.id) {
        alert('Ошибка: не удалось получить данные пользователя');
        return;
    }

    // Инициализируем пользователя на сервере
    await initUser();
    
    // Загружаем данные
    await loadUserData();
    await loadPorts();
    await loadMarket();
    
    // Обновляем UI
    updateUI();
    
    // Запускаем автообновление данных каждые 30 секунд
    startAutoRefresh();
}

// Автообновление данных
function startAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
    
    autoRefreshInterval = setInterval(async () => {
        try {
            // Фоновое обновление без показа индикатора загрузки
            await checkCompletedTravels(false);
            await loadUserData(false);
            await loadMarket(false);
            updateUI();
        } catch (error) {
            console.error('Ошибка автообновления:', error);
        }
    }, 30000); // 30 секунд
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

async function initUser() {
    try {
        const data = await apiRequest(`${API_URL}/users/init`, {
            method: 'POST',
            body: JSON.stringify({
                telegramId: currentUser.id,
                username: currentUser.username
            })
        });
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

function switchTab(tabName) {
    // Убираем активный класс со всех вкладок
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Активируем выбранную вкладку
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

function updateUI() {
    // Обновляем монеты
    document.getElementById('coins').textContent = `💰 ${currentUser.coins || 0}`;
    document.getElementById('username').textContent = currentUser.username;

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
    
    if (marketCargo.length === 0) {
        marketList.innerHTML = '<div class="loading">На рынке пока нет грузов</div>';
        return;
    }

    marketList.innerHTML = marketCargo.map(cargo => `
        <div class="market-item">
            <h3>${getCargoName(cargo.type)}</h3>
            <div class="port-info">
                <div class="stat">
                    <span>Количество:</span>
                    <span>${cargo.amount}</span>
                </div>
                <div class="stat">
                    <span>Цена:</span>
                    <span>💰 ${cargo.price}</span>
                </div>
                <div class="stat">
                    <span>Порт:</span>
                    <span>${getPortName(cargo.portId)}</span>
                </div>
                <button class="btn-primary" onclick="buyCargo('${cargo.id}')">Купить</button>
            </div>
        </div>
    `).join('');
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
                    <button class="btn-primary" onclick="unloadCargo('${ship.id}')">Выгрузить груз</button>
                </div>
            ` : `
                <div style="margin: 15px 0;">
                    <h4>Загрузить груз:</h4>
                    <div class="cargo-selector">
                        ${getAvailableCargoForPort(ship.currentPortId).map(cargo => `
                            <div class="cargo-option" onclick="selectCargo('${ship.id}', '${cargo.type}', ${cargo.amount})">
                                ${getCargoName(cargo.type)} (${cargo.amount}) - 💰 ${cargo.price || 'Бесплатно'}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `}
            
            <div style="margin: 15px 0;">
                <h4>Отправить в порт:</h4>
                <div class="port-selector">
                    ${ports.filter(p => p.id !== ship.currentPortId).map(port => `
                        <div class="port-option" onclick="sendShipToPort('${ship.id}', '${port.id}')">
                            ${port.name} (💰 ${calculateTravelCost(ship, port)})
                        </div>
                    `).join('')}
                </div>
            </div>
            
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

async function sendShipToPort(shipId, portId) {
    const ship = ships.find(s => s.id === shipId);
    const port = ports.find(p => p.id === portId);
    
    if (!ship || !port) return;
    
    const cost = calculateTravelCost(ship, port);
    
    if (ship.fuel < cost) {
        showError('Недостаточно топлива!');
        return;
    }
    
    try {
        const data = await apiRequest(`${API_URL}/ships/${shipId}/travel`, {
            method: 'POST',
            body: JSON.stringify({ portId })
        });
        
        if (data.success) {
            showSuccess(`Судно отправлено в ${port.name}!`);
            await loadUserData();
            updateUI();
            document.getElementById('ship-modal').style.display = 'none';
        }
    } catch (error) {
        // Ошибка уже обработана в apiRequest
    }
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
        const data = await apiRequest(`${API_URL}/ships/${shipId}/unload`, {
            method: 'POST'
        });
        
        if (data.success) {
            showSuccess(`Груз выгружен! Получено: 💰 ${data.reward}`);
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

async function buyCargo(cargoId) {
    try {
        // Используем userId (UUID) если он есть, иначе используем telegramId
        const userId = currentUser.userId || currentUser.id;
        
        const data = await apiRequest(`${API_URL}/market/${cargoId}/buy`, {
            method: 'POST',
            body: JSON.stringify({ userId: userId })
        });
        
        if (data.success) {
            showSuccess('Груз куплен!');
            await loadUserData();
            await loadMarket();
            updateUI();
        }
    } catch (error) {
        // Ошибка уже обработана в apiRequest
    }
}

function showBuyShipModal() {
    const shipTypes = [
        { type: 'tanker', name: 'Танкер', price: 1000, description: 'Перевозит нефть' },
        { type: 'cargo', name: 'Грузовое судно', price: 1500, description: 'Перевозит материалы' },
        { type: 'supply', name: 'Снабженец', price: 1200, description: 'Перевозит провизию' }
    ];
    
    const modal = document.getElementById('ship-modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    
    title.textContent = 'Купить судно';
    body.innerHTML = `
        <div class="cargo-selector">
            ${shipTypes.map(st => `
                <div class="cargo-option" onclick="purchaseShip('${st.type}')">
                    <h4>${st.name}</h4>
                    <p>${st.description}</p>
                    <p>💰 ${st.price}</p>
                </div>
            `).join('')}
        </div>
    `;
    
    modal.style.display = 'block';
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
    // Простая формула: расстояние * базовый расход
    return 10; // Упрощенно
}

// Экспорт функций для использования в HTML
window.openShipModal = openShipModal;
window.openPortModal = openPortModal;
window.sendShipToPort = sendShipToPort;
window.selectCargo = selectCargo;
window.unloadCargo = unloadCargo;
window.repairShip = repairShip;
window.buyCargo = buyCargo;
window.purchaseShip = purchaseShip;