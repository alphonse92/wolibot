const SlackBot = require('slackbots');
const axios = require('axios')
const dotenv = require('dotenv')

dotenv.config()

const ALERT_EMOJI = ':face_with_symbols_on_mouth:';
const NEUTRAL_EMOJI = ':yum:';
const {
  BOT_TOKEN,
  SAY_HELLO_AT_START,
} = process.env

const SAY_HELLO = SAY_HELLO_AT_START === 'true';

const bot = new SlackBot({
  token: `${BOT_TOKEN}`,
  name: 'woli'
})

// Start Handler
bot.on('start', () => {
  console.log('Bot had started')
  if (SAY_HELLO) {
    bot.postMessageToChannel(
      'wolitest',
      'Im fucking alive (no toxic)',
      { icon_emoji: NEUTRAL_EMOJI }
    );
  }
});

// Error Handler
bot.on('error', (err) => {
  console.log(err);
})

// Message Handler
bot.on('message', (data) => {
  if (data.type !== 'message') {
    return;
  }
  console.log("mesage received", data)
  // handleMessage(data.text);
})

// Response Handler
function handleMessage(message) {
  if (message.includes(' inspire me')) {
    inspireMe()
  } else if (message.includes(' random joke')) {
    randomJoke()
  } else if (message.includes(' help')) {
    runHelp()
  }
}

// inspire Me
function inspireMe() {
  axios.get('https://raw.githubusercontent.com/BolajiAyodeji/inspireNuggets/master/src/quotes.json')
    .then(res => {
      const quotes = res.data;
      const random = Math.floor(Math.random() * quotes.length);
      const quote = quotes[random].quote
      const author = quotes[random].author

      const params = {
        icon_emoji: ':male-technologist:'
      }

      bot.postMessageToChannel(
        'random',
        `:zap: ${quote} - *${author}*`,
        params
      );

    })
}

// Random Joke
function randomJoke() {
  axios.get('https://api.chucknorris.io/jokes/random')
    .then(res => {
      const joke = res.data.value;

      const params = {
        icon_emoji: ':smile:'
      }

      bot.postMessageToChannel(
        'random',
        `:zap: ${joke}`,
        params
      );

    })
}

// Show Help
function runHelp() {
  const params = {
    icon_emoji: ':question:'
  }

  bot.postMessageToChannel(
    'random',
    `Type *@inspirenuggets* with *inspire me* to get an inspiring techie quote, *random joke* to get a Chuck Norris random joke and *help* to get this instruction again`,
    params
  );
}