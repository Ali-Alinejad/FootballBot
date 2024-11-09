const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const TELEGRAM_TOKEN = '7175377029:AAFlqQu26YSYmB2nF5wv6t1hBCVPyQSPpmc';
const API_KEY = '456620b184de464c9f91ab031d9d3fa3';
const BASE_URL = 'https://api.football-data.org/v4/matches';
const COMPETITIONS_URL = 'https://api.football-data.org/v4/competitions';

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
          { text: 'نمایش جدول لیگ‌ها', callback_data: 'show_leagues' }
        ],
        [
          { text: 'ارتباط با پشتیبانی', callback_data: 'contact_support' }
        ]
      ]
    }
  });
});

bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;

  bot.answerCallbackQuery(callbackQuery.id);

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
        'FC Barcelona', 'Real Madrid CF', 'Liverpool FC', 'Manchester United FC',
        'Bayern München', 'Juventus FC', 'Paris Saint-Germain FC', 'Chelsea FC',
        'AC Milan', 'Arsenal FC', 'Inter Milan', 'Manchester City FC',
        'Borussia Dortmund', 'SSC Napoli'
      ];

      const teamShortnames = {
        'Manchester United FC': 'Man Utd',
        'Manchester City FC': 'Man City',
        'Chelsea FC': 'Chelsea',
        'Liverpool FC': 'Liverpool',
        'Arsenal FC': 'Arsenal',
        'Tottenham Hotspur': 'Spurs',
        'Newcastle United': 'Newcastle',
        'Leicester City': 'Leicester',
        'Real Madrid CF': 'Real Madrid',
        'FC Barcelona': 'Barça',
        'Atlético Madrid': 'Atleti',
        'Sevilla FC': 'Sevilla',
        'Valencia CF': 'Valencia',
        'Real Sociedad': 'Real Sociedad',
        'FC Bayern München': 'Bayern',
        'Borussia Dortmund': 'Dortmund',
        'RB Leipzig': 'RB Leipzig',
        'Bayer 04 Leverkusen': 'Leverkusen',
        'Borussia Mönchengladbach': 'M’Gladbach',
        'VfL Wolfsburg': 'Wolfsburg',
        'Juventus FC': 'Juventus',
        'AC Milan': 'Milan',
        'Inter Milan': 'Inter',
        'AS Roma': 'Roma',
        'SSC Napoli': 'Napoli',
        'VFL Bochum 1848': 'Bochum',
        'Lazio': 'Lazio',
        'Atalanta BC': 'Atalanta',
        'RCD Espanyol de Barcelona': 'Espanyol',
        'Wolverhampton Wanderers FC': 'Wolverhampton',
        'West Ham United FC': 'West Ham',
        'Brighton & Hove Albion FC': 'Brighton',
      };

      const targetCompetitions = {
        'Primera Division': 'لالیگا',
        'Bundesliga': 'بوندسلیگا',
        'Premier League': 'لیگ انگلیس',
        'UEFA Champions League': 'لیگ قهرمانان اروپا',
        'Serie A': 'سری آ',
        'FIFA World Cup': 'بازی‌های ملی'
      };

      // فیلتر کردن بازی‌ها
      for (let leagueCode in targetCompetitions) {
        const leagueName = targetCompetitions[leagueCode];

        const leagueMatches = matches.filter((match) => match.competition.name === leagueCode);

        if (leagueMatches.length > 0) {
          message += `🔺 *${leagueName}*\n`;

          leagueMatches.forEach((match) => {
            const homeTeam = teamShortnames[match.homeTeam.name] || match.homeTeam.name;
            const awayTeam = teamShortnames[match.awayTeam.name] || match.awayTeam.name;

            const isImportantMatch = importantTeams.includes(match.homeTeam.name) || importantTeams.includes(match.awayTeam.name);
            const importantEmoji = isImportantMatch ? '🔥' : '';

            const startTime = new Date(match.utcDate).toLocaleTimeString('fa-IR', {
              hour: '2-digit',
              minute: '2-digit',
            });

            message += `\n🔹 *${importantEmoji}* ${homeTeam} 🆚 ${awayTeam} ⏱ *${startTime}*\n`;
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
  } 
  // بخش جدول لیگ‌ها
  else if (data === 'show_leagues') {
    bot.sendMessage(chatId, 'لطفاً لیگ مورد نظر خود را انتخاب کنید:', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'لیگ انگلیس', callback_data: 'league_premier_league' },
            { text: 'لالیگا', callback_data: 'league_la_liga' }
          ],
          [
            { text: 'بوندسلیگا', callback_data: 'league_bundesliga' },
            { text: 'لیگ قهرمانان اروپا', callback_data: 'league_uefa_champions' }
          ],
          [
            { text: 'سری آ', callback_data: 'league_serie_a' },
            { text: 'بازی‌های ملی', callback_data: 'league_fifa_world_cup' }
          ]
        ]
      }
    });
  }
  // درخواست جدول لیگ خاص
  else if (data.startsWith('league_')) {
    const leagueCode = data.split('_')[1]; 
    await showLeagueTable(chatId, leagueCode);  // حالا تابع درست در دسترس است
  }
  else if (data === 'contact_support') {
    bot.sendMessage(chatId, 'برای پشتیبانی با ایدی @AIinjad ارتباط بگیرید.');
  }
});

// تابع دریافت جدول لیگ
const showLeagueTable = async (chatId, leagueCode) => {
  try {
    const competitionId = await getCompetitionId(leagueCode);
    const response = await axios.get(`https://api.football-data.org/v4/competitions/${competitionId}/standings`, {
      headers: {
        'X-Auth-Token': API_KEY
      }
    });

    const standings = response.data.standings[0].table;

    if (standings.length === 0) {
      bot.sendMessage(chatId, 'متاسفانه اطلاعات جدول در دسترس نیست.');
      return;
    }

    let tableMessage = '*جدول لیگ:*\n\n';
    standings.forEach((team, index) => {
      tableMessage += `🔹 *${index + 1}*: ${team.team.name} - ${team.points} امتیاز\n`;
    });

    bot.sendMessage(chatId, tableMessage, { parse_mode: 'Markdown' });

  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, 'خطا در دریافت جدول لیگ. لطفاً دوباره تلاش کنید.');
  }
};

const getCompetitionId = (leagueCode) => {
  const competitionIds = {
    premier_league: 'PRL',
    la_liga: 'PD',
    bundesliga: 'BL1',
    uefa_champions: 'CL',
    serie_a: 'SA',
    fifa_world_cup: 'WC'
  };
  
  return competitionIds[leagueCode];
};

console.log('Telegram Bot is running...');
