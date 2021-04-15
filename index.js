const SlackBot = require('slackbots');
const axios = require('axios')
const dotenv = require('dotenv')

dotenv.config()

const ALERT_EMOJI = ':face_with_symbols_on_mouth:';
const NEUTRAL_EMOJI = ':yum:';
const {
  BOT_TOKEN,
  SAY_HELLO_AT_START,
  CHANNELS
} = process.env

const SAY_HELLO = SAY_HELLO_AT_START === 'true';

const AVAILABLE_CHANNELS = CHANNELS.split(',')

const bot = new SlackBot({
  token: `${BOT_TOKEN}`,
  name: 'woli'
})


const sayHello = channel => bot.postMessageToChannel(
  'wolitest',
  `Hi! I'm Woli and I'll guard the healthy of your conversation. I will watch you every you write in this channel!`,
  { icon_emoji: NEUTRAL_EMOJI }
);

// Start Handler
bot.on('start', () => {
  console.log('Bot had started')
  if (SAY_HELLO) AVAILABLE_CHANNELS.forEach(sayHello)
});

// Error Handler
bot.on('error', (err) => {
  console.log(err);
})

// Message Handler
bot.on('message', (data) => {
  if (data.type !== 'message') return;
  console.log("mesage received", data)
})