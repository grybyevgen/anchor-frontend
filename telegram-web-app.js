// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;

// Инициализация приложения
tg.ready();
tg.expand();

// Настройка цветовой схемы
// Используем синий цвет для шапки и белый для фона
tg.setHeaderColor('#2481cc'); // Синий цвет для шапки
tg.setBackgroundColor('#ffffff'); // Белый фон

// Также настраиваем цвета через CSS переменные
document.documentElement.style.setProperty('--tg-theme-header-bg-color', '#2481cc');
document.documentElement.style.setProperty('--tg-theme-header-text-color', '#ffffff');

// Получение данных пользователя
const user = tg.initDataUnsafe?.user || {};
const userId = user.id || null;
const username = user.username || user.first_name || 'Игрок';

// Экспорт для использования в других файлах
window.TelegramWebApp = {
    tg,
    user,
    userId,
    username,
    initData: tg.initData,
    sendData: (data) => tg.sendData(JSON.stringify(data))
};