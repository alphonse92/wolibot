(
  async () => {
    const SlackBot = require('slackbots');
    const dotenv = require('dotenv')
    const fetch = require('node-fetch');
    const toxicityChecker = require('./src/ToxicityChecker');
    const database = require('./src/database');

    const { WebClient } = require('@slack/web-api');

    const WELCOME_MESSAGE =`Hi! I'm Woli and I'll guard the healthy of your conversation. I will watch you every you write in this channel!`;
    const GOODBYE_MESSAGE = `Bye don't start a war while I'm not here`;

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
      WELCOME_MESSAGE,
      { icon_emoji: NEUTRAL_EMOJI }
    );

    const sayGoodBYe = channel => bot.postMessageToChannel(
      channel,
      GOODBYE_MESSAGE,
      { icon_emoji: NEUTRAL_EMOJI }
    );

    const checkToxicity = async (message) => {

      // Please call all the sugested models and log it answers to choose the right one

      const response = await fetch('https://predict-ailab.uruit.com/text/classification/predict/49fb832a-9dfa-11eb-b2b9-8697a6fa86bd', {
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

    const censoredMessage = async  (channel, ts) => {
      const defaultMessage = `this message was censored because includes toxic messages`;
      const result = await web.chat.update({
        channel,
        ts,
        text: defaultMessage,
      });

      return result;
    };

    const richText = async () => {

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

      const { text, user, type, ts, channel } = data;

      if (type !== 'message' || text === WELCOME_MESSAGE) return;

      console.log('\n\n\n',data)

      if (text === "/mario-test") {
        return await richText(channel);
      }

      const toxicityInfo = await toxicityChecker(text);
      if (toxicityInfo) {
        const { result } = toxicityInfo;
        await database.write({text, toxicityInfo});

        if (result === 'TOXIC'){
          await sendUserWarning(user, text, toxicityInfo);
        }
        // if (result === 'TOXIC') await censoredMessage(channel, ts);
      }
    });

    bot.on('close', () => {
      AVAILABLE_CHANNELS.forEach(sayGoodBYe);
    });

    process.on('SIGINT', async () => {
      await Promise.all(AVAILABLE_CHANNELS.map(sayGoodBYe));
      process.exit(0);
    });
  }
)();

