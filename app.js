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

    // Обновляем статистику флота
    renderFleetStats();
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
    let totalProfit = 0;
    let totalFuelCost = 0;
    let totalCargoMoved = 0;
    let totalShipCosts = 0;

    const cardsHtml = ships.map(ship => {
        const purchasePrice = ship.purchasePrice || 0;
        const totalDistanceNm = ship.totalDistanceNm || 0;
        const totalTrips = ship.totalTrips || 0;
        const totalCargoMovedShip = ship.totalCargoMoved || 0;
        const totalProfitShip = ship.totalProfit || 0;
        const totalFuelCostShip = ship.totalFuelCost || 0;
        const totalCargoCostShip = ship.totalCargoCost || 0;
        const totalRepairCostShip = ship.totalRepairCost || 0;
        const totalTowCostShip = ship.totalTowCost || 0;

        const totalCostsShip = purchasePrice + totalFuelCostShip + totalCargoCostShip + totalRepairCostShip + totalTowCostShip;

        totalDistance += totalDistanceNm;
        totalProfit += totalProfitShip;
        totalFuelCost += totalFuelCostShip;
        totalCargoMoved += totalCargoMovedShip;
        totalShipCosts += totalCostsShip;

        return `
            <div class="fleet-card">
                <h3>${ship.name} (${getShipTypeName(ship.type)})</h3>
                <div class="stat-row"><span>Текущий порт:</span><span>${getPortName(ship.currentPortId)}</span></div>
                <div class="stat-row"><span>Пройдено миль:</span><span>${totalDistanceNm}</span></div>
                <div class="stat-row"><span>Рейсов совершено:</span><span>${totalTrips}</span></div>
                <div class="stat-row"><span>Перевезено груза (ед.):</span><span>${totalCargoMovedShip}</span></div>
                <div class="stat-row"><span>Доход от рейсов (чистая прибыль):</span><span>💰 ${totalProfitShip}</span></div>
                <div class="stat-row"><span>Потрачено на топливо:</span><span>💰 ${totalFuelCostShip}</span></div>
                <div class="stat-row"><span>Потрачено на ремонт:</span><span>💰 ${totalRepairCostShip}</span></div>
                <div class="stat-row"><span>Потрачено на буксировку:</span><span>💰 ${totalTowCostShip}</span></div>
                <div class="stat-row"><span>Покупка + все расходы:</span><span>💰 ${totalCostsShip}</span></div>
            </div>
        `;
    }).join('');

    const summaryHtml = `
        <div class="fleet-summary">
            <div><strong>Всего судов:</strong> ${ships.length}</div>
            <div><strong>Суммарное расстояние:</strong> ${totalDistance} миль</div>
            <div><strong>Суммарно перевезено груза:</strong> ${totalCargoMoved} ед.</div>
            <div><strong>Суммарные расходы на топливо:</strong> 💰 ${totalFuelCost}</div>
            <div><strong>Суммарная чистая прибыль от рейсов:</strong> 💰 ${totalProfit}</div>
            <div><strong>Суммарные затраты на суда (покупка+расходы):</strong> 💰 ${totalShipCosts}</div>
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
                    <button class="btn-primary" onclick="unloadCargo('${ship.id}')">Выгрузить груз в порт</button>
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
                
                return `
                    <div style="margin: 15px 0;">
                        <h4>Загрузить груз:</h4>
                        <div class="cargo-selector">
                            ${loadableCargo.map(cargo => {
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
                `;
            })()}
            
            <div style="margin: 15px 0;">
                <h4>Отправить в порт:</h4>
                <div class="port-selector" id="port-selector-${ship.id}">
                    ${ports.filter(p => p.id !== ship.currentPortId).map(port => `
                        <div class="port-option" 
                             data-ship-id="${ship.id}" 
                             data-port-id="${port.id}" 
                             data-port-name="${port.name.replace(/"/g, '&quot;')}">
                            ${port.name} (💰 ${calculateTravelCost(ship, port)} - рассчитывается при отправке)
                        </div>
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
                        <div style="margin: 15px 0; padding: 10px; background: #fff3e0; border-radius: 5px;">
                            <h4>🛢️ Бункеровка (заправка топливом):</h4>
                            <p style="color: #ff9800;">Бункеровка возможна только в портах, где генерируется нефть.</p>
                            <p style="font-size: 0.9em; color: #666;">Текущий порт: ${port.name}</p>
                        </div>
                    `;
                }
                
                const availableOil = port.availableCargo.find(cargo => cargo.type === 'oil');
                const fuelNeeded = ship.maxFuel - ship.fuel;
                
                return `
                    <div style="margin: 15px 0;">
                        <h4>🛢️ Бункеровка (заправка топливом):</h4>
                        <div class="stat">
                            <span>Текущее топливо:</span>
                            <span>${ship.fuel}/${ship.maxFuel}</span>
                        </div>
                        ${availableOil && availableOil.amount > 0 ? (() => {
                            const maxAvailable = Math.min(availableOil.amount, fuelNeeded);
                            const pricePerUnit = availableOil.price || 0;
                            return `
                                <div class="cargo-option" style="margin-bottom: 10px;">
                                    <div><strong>Нефть</strong> - Доступно: ${availableOil.amount} - 💰 ${pricePerUnit}/ед.</div>
                                    <div style="display: flex; gap: 10px; margin-top: 5px; align-items: center;">
                                        <input type="number" 
                                               id="refuel-amount-${ship.id}" 
                                               min="1" 
                                               max="${maxAvailable}" 
                                               value="${maxAvailable > 0 ? 1 : 0}" 
                                               style="width: 80px; padding: 5px; border: 1px solid #ccc; border-radius: 4px;"
                                               ${maxAvailable === 0 ? 'disabled' : ''}
                                               onchange="updateRefuelPriceFromPort('${ship.id}', ${pricePerUnit})">
                                        <span>шт. (макс. ${maxAvailable}, нужно ${fuelNeeded})</span>
                                        <span id="refuel-price-${ship.id}" style="font-weight: bold;">💰 ${pricePerUnit}</span>
                                        <button class="btn-primary" 
                                                onclick="confirmRefuelFromPort('${ship.id}', ${availableOil.amount}, ${fuelNeeded}, ${pricePerUnit})"
                                                ${maxAvailable === 0 ? 'disabled' : ''}>
                                            Заправить
                                        </button>
                                    </div>
                                </div>
                            `;
                        })() : `
                            <div style="padding: 10px; background: #f0f0f0; border-radius: 5px;">
                                В этом порту нет нефти для заправки
                            </div>
                        `}
                    </div>
                `;
            })() : ''}
            
            ${ship.fuel < 5 && !ship.isTraveling ? (() => {
                // Проверяем, не в порту "Нефтяной завод" ли судно
                const port = ports.find(p => p.id === ship.currentPortId);
                const isInVladivostok = port && port.name === 'Порт "Нефтяной завод"';
                
                if (isInVladivostok) {
                    return `
                        <div style="margin: 15px 0; padding: 10px; background: #ffebee; border-radius: 5px;">
                            <h4>⚠️ Низкий уровень топлива</h4>
                            <p style="color: #d32f2f;">Топливо на исходе (${ship.fuel}/${ship.maxFuel}). Заправьте судно нефтью в порту "Нефтяной завод".</p>
                        </div>
                    `;
                }
                
                // Рассчитываем примерную стоимость буксировки
                const vladivostokPort = ports.find(p => p.name === 'Порт "Нефтяной завод"');
                if (!vladivostokPort) return '';
                
                // Простая оценка расстояния (будет уточнена на сервере)
                const estimatedCost = 500 + 1000; // Базовая + примерная доплата за расстояние
                
                return `
                    <div style="margin: 15px 0; padding: 10px; background: #fff3e0; border-radius: 5px; border: 2px solid #ff9800;">
                        <h4>🚢 Буксировка судна</h4>
                        <p style="color: #f57c00; margin-bottom: 10px;">
                            <strong>Топливо на исходе!</strong> (${ship.fuel}/${ship.maxFuel})
                        </p>
                        <p style="font-size: 0.9em; color: #666; margin-bottom: 10px;">
                            Судно можно отбуксировать в порт "Нефтяной завод" для заправки.
                        </p>
                        <p style="font-size: 0.9em; color: #666; margin-bottom: 15px;">
                            Примерная стоимость: <strong>💰 ~${estimatedCost}</strong> монет (точная стоимость будет рассчитана на сервере)
                        </p>
                        <button class="btn-primary" 
                                style="background: #ff9800; border-color: #f57c00;"
                                data-ship-id="${ship.id}" 
                                data-port-name="${port ? port.name.replace(/"/g, '&quot;') : 'неизвестный порт'}" 
                                data-estimated-cost="${estimatedCost}"
                                id="tow-ship-btn-${ship.id}">
                            Отбуксировать в "Нефтяной завод"
                        </button>
                    </div>
                `;
            })() : ''}
            
            ${ship.health < ship.maxHealth ? `
                <button class="btn-secondary" onclick="repairShip('${ship.id}')">Починить судно</button>
            ` : ''}
        `;
    }

    modal.style.display = 'block';
    
    // Добавляем обработчики событий для кнопок отправки в порт (через небольшую задержку, чтобы DOM успел обновиться)
    setTimeout(() => {
        const portSelector = document.getElementById(`port-selector-${ship.id}`);
        if (portSelector) {
            // Удаляем старые обработчики (если есть) - клонируем элементы для удаления обработчиков
            const oldOptions = portSelector.querySelectorAll('.port-option');
            oldOptions.forEach(option => {
                const newOption = option.cloneNode(true);
                option.parentNode.replaceChild(newOption, option);
            });
            
            // Добавляем новые обработчики
            const portOptions = portSelector.querySelectorAll('.port-option');
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

async function openPortModal(portId) {
    const port = ports.find(p => p.id === portId);
    if (!port) return;

    const modal = document.getElementById('port-modal');
    const title = document.getElementById('port-modal-title');
    const body = document.getElementById('port-modal-body');

    title.textContent = port.name;
    
    // Получаем правила генерации для порта
    const rules = PORT_GENERATION_RULES[port.name];
    
    // Грузы, доступные для погрузки (генерируемые)
    const loadableCargo = port.availableCargo.filter(cargo => 
        rules && rules.generates === cargo.type
    );
    
    // Грузы, которые требуются для генерации (можно выгрузить)
    const requiredCargo = rules ? Object.keys(rules.requires) : [];
    const requiredCargoInfo = requiredCargo.map(cargoType => {
        const cargo = port.availableCargo.find(c => c.type === cargoType);
        return {
            type: cargoType,
            amount: cargo ? cargo.amount : 0,
            required: rules.requires[cargoType]
        };
    });
    
    body.innerHTML = `
        <div class="port-info">
            <div style="margin-bottom: 20px;">
                <h4>📦 Грузы доступные для погрузки:</h4>
                ${loadableCargo.length > 0 ? loadableCargo.map(cargo => `
                    <div class="cargo-option" style="padding: 10px; margin: 5px 0; background: #e8f5e9; border-radius: 5px;">
                        <strong>${getCargoName(cargo.type)}</strong> - ${cargo.amount} единиц
                        ${cargo.price ? `<span style="color: #4caf50;">💰 ${cargo.price} монет/ед.</span>` : ''}
                    </div>
                `).join('') : '<div style="padding: 10px; color: #999;">Нет доступных грузов для погрузки</div>'}
            </div>
            
            <div style="margin-bottom: 20px;">
                <h4>📤 Грузы требуются для генерации (можно выгрузить):</h4>
                ${requiredCargoInfo.length > 0 ? requiredCargoInfo.map(cargo => `
                    <div class="cargo-option" style="padding: 10px; margin: 5px 0; background: #fff3e0; border-radius: 5px;">
                        <strong>${getCargoName(cargo.type)}</strong> - В порту: ${cargo.amount} единиц
                        <span style="color: #ff9800;">(требуется: ${cargo.required} ед. для генерации)</span>
                    </div>
                `).join('') : '<div style="padding: 10px; color: #999;">Нет требуемых грузов</div>'}
            </div>
            
            ${rules ? `
                <div style="margin-top: 20px; padding: 10px; background: #f5f5f5; border-radius: 5px;">
                    <strong>ℹ️ Правила генерации:</strong>
                    <p>${Object.entries(rules.requires).map(([type, amount]) => 
                        `${amount} ${getCargoName(type)}`
                    ).join(' + ')} → 3 ${getCargoName(rules.generates)}</p>
                </div>
            ` : ''}
        </div>
    `;

    modal.style.display = 'block';
    
    // Добавляем обработчики событий для кнопок отправки в порт (через небольшую задержку, чтобы DOM успел обновиться)
    setTimeout(() => {
        const portSelector = document.getElementById(`port-selector-${ship.id}`);
        if (portSelector) {
            // Удаляем старые обработчики (если есть)
            const oldOptions = portSelector.querySelectorAll('.port-option');
            oldOptions.forEach(option => {
                const newOption = option.cloneNode(true);
                option.parentNode.replaceChild(newOption, option);
            });
            
            // Добавляем новые обработчики
            const portOptions = portSelector.querySelectorAll('.port-option');
            portOptions.forEach(option => {
                option.addEventListener('click', handlePortOptionClick);
            });
        }
    }, 0);
}

// Обработчик клика по опции порта
function handlePortOptionClick(event) {
    const option = event.currentTarget;
    const shipId = option.getAttribute('data-ship-id');
    const portId = option.getAttribute('data-port-id');
    const portName = option.getAttribute('data-port-name');
    
    if (shipId && portId && portName) {
        confirmSendShipToPort(shipId, portId, portName);
    }
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
        // Если не хватает топлива - предлагаем буксировку в порт "Нефтяной завод"
        if (error && error.message && error.message.startsWith('Недостаточно топлива')) {
            const ship = ships.find(s => s.id === shipId);
            const currentPort = ports.find(p => p.id === ship.currentPortId);
            if (ship && currentPort) {
                // Примерная оценка стоимости (точная будет рассчитана на сервере)
                const estimatedCost = 500 + 1000; // базовая + примерная доплата
                confirmTowShip(shipId, currentPort.name, estimatedCost);
            }
        }
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
            await loadPorts();
            updateUI();
            openShipModal(shipId);
        }
    } catch (error) {
        // Ошибка уже обработана в apiRequest
    }
}

async function unloadCargo(shipId) {
    try {
        // Всегда продаем в порт
        const data = await apiRequest(`${API_URL}/ships/${shipId}/unload`, {
            method: 'POST',
            body: JSON.stringify({ destination: 'port' })
        });
        
        if (data.success) {
            // Формируем детальное сообщение о выгрузке
            let message = `Груз выгружен в порт! 💰 Получено: ${data.reward} монет`;
            
            // Добавляем детали в одну строку для совместимости с alert
            const details = [];
            if (data.grossProfit !== undefined) {
                details.push(`Прибыль: ${data.grossProfit}`);
            }
            if (data.portFees !== undefined && data.portFees > 0) {
                details.push(`Сборы: ${data.portFees}`);
            }
            if (data.profitTax !== undefined && data.profitTax > 0) {
                details.push(`Налог: ${data.profitTax}`);
            }
            
            if (details.length > 0) {
                message += ` (${details.join(', ')})`;
            }
            
            showSuccess(message);
            await loadUserData();
            await loadPorts();
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
    const inputId = `refuel-amount-${shipId}`;
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
        showError(`Недостаточно нефти в порту. Доступно: ${maxAvailable}`);
        return;
    }
    
    await refuelShipFromPort(shipId, amount);
}

// Функция заправки судна из порта
async function refuelShipFromPort(shipId, amount) {
    try {
        const data = await apiRequest(`${API_URL}/ships/${shipId}/refuel`, {
            method: 'POST',
            body: JSON.stringify({ cargoType: 'oil', amount })
        });
        
        if (data.success) {
            showSuccess(`Судно заправлено на ${data.fueled} единиц! Стоимость: 💰 ${data.cost}`);
            await loadUserData();
            await loadPorts(false);
            updateUI();
            openShipModal(shipId);
        }
    } catch (error) {
        // Ошибка уже обработана в apiRequest
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
    
    const confirmed = confirm(
        `Отбуксировать судно "${ship.name}" из порта "${currentPortName}" в порт "Нефтяной завод"?\n\n` +
        `Примерная стоимость: 💰 ${estimatedCost} монет\n\n` +
        `После буксировки судно окажется в порту "Нефтяной завод" с нулевым топливом. ` +
        `Вам нужно будет заправить судно нефтью для продолжения работы.`
    );
    
    if (!confirmed) return;
    
    await towShip(shipId);
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