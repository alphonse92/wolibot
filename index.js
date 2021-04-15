(
  async () => {
    const SlackBot = require('slackbots');
    const dotenv = require('dotenv')
    const fetch = require('node-fetch');

    const { WebClient } = require('@slack/web-api');


    dotenv.config()

    // CONFIG
    const ALERT_EMOJI = ':face_with_symbols_on_mouth:';
    const NEUTRAL_EMOJI = ':yum:';
    const {
      BOT_TOKEN,
      SAY_HELLO_AT_START,
      CHANNELS,
      DEBUG
    } = process.env

    const SAY_HELLO = SAY_HELLO_AT_START === 'true';
    const AVAILABLE_CHANNELS = CHANNELS.split(',')
    // START CLIENTS
    const bot = new SlackBot({ token: `${BOT_TOKEN}`, name: 'woli' })
    const web = new WebClient(BOT_TOKEN)

    // FUNCTIONS
    const debug = () => { if (DEBUG === 'true') { } }
    const sayHello = channel => bot.postMessageToChannel(
      channel,
      `Hi! I'm Woli and I'll guard the healthy of your conversation. I will watch you every you write in this channel!`,
      { icon_emoji: NEUTRAL_EMOJI }
    );

    const checkToxicity = async (message) => {

      // Please call all the sugested models and log it answers to choose the right one

      const response = await fetch('https://predict-ailab.uruit.com/text/classification/predict/30d948b8-9d4c-11eb-aa0f-521c6757c414', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ "text": message })
      });
      try {
        const json = response.json();
        return json;
      } catch (e) {
        console.log('something went wrong', e);
        return null;
      }
    }

    const sendUserWarning = async (userId, message, toxicityInfo) => {
      const { confidence_score } = toxicityInfo;
      const warningMessage = `I'm almost sure (about ${Number(confidence_score) * 100} %) your message "${message}" is ofensive. Please stay calm and breath before you atack other people`
      // bot.postMessageToUser(userId, warningMessage, { icon_emoji: NEUTRAL_EMOJI });
      const result = await web.chat.postMessage({ text: warningMessage, channel: userId });
      return result
    }

    // EVENTS
    bot.on('start', () => {
      console.log('Bot had started at', AVAILABLE_CHANNELS)
      if (SAY_HELLO) AVAILABLE_CHANNELS.forEach(sayHello)
    });

    // Error Handler
    bot.on('error', (err) => {
      console.log(err);
    })

    // Message Handler
    bot.on('message', async (data) => {

      const { text, user, type } = data;

      if (type !== 'message') return;

      console.log(data)

      const toxicityInfo = await checkToxicity(text);

      if (toxicityInfo) {
        const { result } = toxicityInfo;
        if (result === 'TOXIC') await sendUserWarning(user, text, toxicityInfo);
      }
    })
  }
)();

