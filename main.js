const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const TELEGRAM_TOKEN = '7175377029:AAFlqQu26YSYmB2nF5wv6t1hBCVPyQSPpmc';
const API_KEY = '456620b184de464c9f91ab031d9d3fa3';
const BASE_URL = 'https://api.football-data.org/v4/matches';

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'سلام! من ربات نمایش بازی‌های فوتبال امروز هستم.', {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'نمایش بازی‌ها', callback_data: 'show_matches' }
        ],
        [
          { text: 'تماس با پشتیبانی', callback_data: 'contact_support' }
        ]
      ]
    }
  });
});

bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;

  if (data === 'show_matches') {
    bot.sendMessage(chatId, 'در حال نمایش بازی‌ها...');
    try {
      const today = new Date();
      const localDate = today.toISOString().split('T')[0]; 
      console.log('Requesting matches for:', localDate);

      const response = await axios.get(BASE_URL, {
        headers: {
          'X-Auth-Token': API_KEY
        }
      });

      console.log('Full API Response:', JSON.stringify(response.data));

      const matches = response.data.matches;

      if (!matches || matches.length === 0) {
        bot.sendMessage(chatId, 'امروز بازی‌ای برای نمایش وجود ندارد.');
        return;
      }

      let message = "*بازی‌های فوتبال امروز:*\n\n";

     
      const importantTeams = [
        'FC Barcelona', 
        'Real Madrid CF', 
        'Liverpool FC', 
        'Manchester United FC', 
        'Bayern Munich', 
        'Juventus FC', 
        'Paris Saint-Germain FC', 
        'Chelsea FC', 
        'AC Milan', 
        'Arsenal FC', 
        'Inter Milan', 
        'Manchester City FC'
      ];
      

      const targetCompetitions = {
        'Primera Division': 'لالیگا',
        'Bundesliga': 'بوندسلیگا',
        'Premier League': 'لیگ انگلیس',
        'UEFA Champions League': 'لیگ قهرمانان اروپا',
        'Serie A': 'سری آ',
        'FIFA World Cup': 'بازی‌های ملی'
      };

    
      for (let leagueCode in targetCompetitions) {
        const leagueName = targetCompetitions[leagueCode];

        const leagueMatches = matches.filter((match) => match.competition.name === leagueCode);

        if (leagueMatches.length > 0) {
          message += `🔺 *${leagueName}*\n`;
          leagueMatches.forEach((match) => {
            const homeTeam = match.homeTeam.name;
            const awayTeam = match.awayTeam.name;
            const TeamEmoji = importantTeams.includes(homeTeam) ? '🔥' : null ;
            const startTime = new Date(match.utcDate).toLocaleTimeString('fa-IR', {
              hour: '2-digit',
              minute: '2-digit',
            });

            message += `🔹${TeamEmoji}*${homeTeam}*🆚*${awayTeam}*-${startTime}\n`;
          });

          message += '\n';
        }
      }

      if (message === "*بازی‌های فوتبال امروز:*\n\n") {
        bot.sendMessage(chatId, 'امروز بازی‌ای در لالیگا، بوندسلیگا، لیگ انگلیس، لیگ قهرمانان اروپا، سری آ یا بازی‌های ملی وجود ندارد.');
      } else {
        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      }

    } catch (error) {
      console.error(error);
      bot.sendMessage(chatId, 'خطا در دریافت داده‌ها. لطفاً دوباره تلاش کنید.');
    }

    bot.answerCallbackQuery(callbackQuery.id);
  } else if (data === 'contact_support') {
    bot.sendMessage(chatId, 'برای پشتیبانی با ایدی @AIinjad ارتباط بگیرید.');
    bot.answerCallbackQuery(callbackQuery.id);
  }
});

console.log('Telegram Bot is running...');
