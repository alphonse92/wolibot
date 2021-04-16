(
  async () => {
    const SlackBot = require('slackbots');
    const dotenv = require('dotenv')
    const toxicityChecker = require('./src/ToxicityChecker');
    const database = require('./src/database');
    const CommandProcessor = require('./src/CommandProcessor');

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
    const bot = new SlackBot({ token: `${BOT_TOKEN}`, name: 'woli' });
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

      const { text, user, type, ts, channel, message = {}, bot_id} = data;

      if (type !== 'message' || bot_id || !user || !text) return;

      if (CommandProcessor.isACommand(text)) {
        const result = await CommandProcessor.execute(text, web, data);
        console.log(`\n\n\nindex.js:90`, result);
        return result;
      }

      console.log('\n\n\n',data)

      const msgToCheck = text ? text : message.text;
      const channelToNotify = text ? user : message.user;

      const toxicityInfo = await toxicityChecker(msgToCheck);
      console.log(`index.js:95`, toxicityInfo);
      if (toxicityInfo) {
        const { result } = toxicityInfo;
        await database.write({
          text,
          result,
          channel,
          votation: toxicityInfo.votation,
        });

        if (result === 'TOXIC'){
          await sendUserWarning(channelToNotify, msgToCheck, toxicityInfo);
        }
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

