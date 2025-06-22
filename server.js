require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// Промежуточное ПО для проверки API ключа
const apiKeyMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
  }
  
  next();
};

// Промежуточное ПО для разбора JSON
app.use(express.json());

// Эндпоинт для отправки сообщений
app.post('/send-message', apiKeyMiddleware, async (req, res) => {
  const { message, chatType } = req.body;
  
  // Валидация входящих данных
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Invalid message parameter' });
  }
  
  // Определение chat_id по типу чата
  let chatId;
  switch (chatType) {
    case 'ONLINE':
      chatId = process.env.CHAT_ID_ONLINE;
      break;
    case 'SMS_PUSH':
      chatId = process.env.CHAT_ID_SMS_PUSH;
      break;
    case 'MISC':
      chatId = process.env.CHAT_ID_MISC;
      break;
    case 'ADMIN':
      chatId = process.env.CHAT_ID_ADMIN;
      break;
    default:
      return res.status(400).json({ error: 'Invalid chat type' });
  }
  
  try {
    // Отправка сообщения в Telegram
    const response = await axios.post(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      }
    );
    
    // Успешный ответ
    res.json({
      success: true,
      data: response.data
    });
    
  } catch (error) {
    // Обработка ошибок Telegram API
    console.error('Telegram API error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to send message to Telegram'
    });
  }
});

// Старт сервера
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Key: ${process.env.API_KEY}`);
});