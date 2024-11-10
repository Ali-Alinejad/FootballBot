require('dotenv').config(); 
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN; 
const API_KEY = process.env.API_KEY;
const BASE_URL = 'https://api.football-data.org/v4/matches';
const COMPETITIONS_URL = 'https://api.football-data.org/v4/competitions';

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
const app = express();
const PORT = process.env.PORT || 8080; 

bot.setWebHook(''); 

app.use(express.json());

app.post('/webhook', (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200); 
});

// Define the showLeagueTable function above the callback handler
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
      bot.sendMessage(chatId, 'No standings available.');
      return;
    }

    let tableMessage = '*League Table:*\n\n';
    standings.forEach((team, index) => {
      tableMessage += `› *${index + 1}* : ${team.team.name} ⭐️   ${team.points} \n`;
    });

    bot.sendMessage(chatId, tableMessage, { parse_mode: 'Markdown' });

  } catch (error) {

    console.error('Error fetching league table:', error);
    bot.sendMessage(chatId, 'Error retrieving league table. Please try again.');
  }
};

const getCompetitionId = (leagueCode) => {
  const competitionIds = {
    premier: 'PL', 
    la: 'PD',        
    bundesliga: 'BL1',    
    uefa: 'CL', 
    serie: 'SA'          
  };

  return competitionIds[leagueCode];  
};

bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;

  bot.answerCallbackQuery(callbackQuery.id);

  if (data === 'show_matches') {
    bot.sendMessage(chatId, 'در حال نمایش بازی‌ها...', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'برگشت به منو اصلی', callback_data: 'back_to_main_menu' }
          ]
        ]
      }
    });

    // Fetch and display matches
    try {
      const today = new Date();
      const localDate = today.toISOString().split('T')[0];
      const response = await axios.get(BASE_URL, {
        headers: { 'X-Auth-Token': API_KEY }
      });

      const matches = response.data.matches.filter(match =>
        match.utcDate.startsWith(localDate)
      );

      if (matches.length === 0) {
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
        'FC Internazionale Milano': 'Inter',
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

      // Process matches here...

    } catch (error) {
      console.error(error);
      bot.sendMessage(chatId, 'خطا در دریافت داده‌ها. لطفاً دوباره تلاش کنید.');
    }
  } else if (data === 'show_leagues') {
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
            { text: 'سری آ', callback_data: 'league_serie_a' }
          ],
          [
            { text: 'برگشت به منو اصلی', callback_data: 'back_to_main_menu' }
          ]
        ]
      }
    });
  } else if (data.startsWith('league_')) {
    const leagueCode = data.split('_')[1];
    await showLeagueTable(chatId, leagueCode);  
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
