# wolibot
Bot for slack - woli - hackatonia 2021


# Installation:

1. npm install
2. copy .env.example and rename it to .env
3. configure the envars:
   1. CHANNELS: a list of slack channels where the bot is already joined separed by a comma
   2. BOT_TOKEN: the bot access token (I already sended it to you)
   3. SAY_HELLO_AT_START: if "true" then sends a friendly warning to channels where the bot is already joined.
   4. DEBUG: not implemented yet but should print stuff if it is true


# Running

1. npm start

The bot will listen on channels where the bot is already joined.

# Joining bot to channels:

1. go to slack channel
2. tag the bot in the channel and it will join to it