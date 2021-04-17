# wolibot
Bot for slack - woli - hackatonia 2021

# Dependencies
   to create reports wolibot uses Anychart and require all their dependencies:
   1. [ImageMagic](https://imagemagick.org/index.php)
   2. [librsvg](https://github.com/GNOME/librsvg)
   
   to install these dependencies you can execute the next commands based in your system operative:

   ##### Linux
   `apt-get install imagemagick librsvg2-dev librsvg2-bin`
   ##### Mac OS
   `brew install imagemagick librsvg`
   ##### Windows
   * [imagemagick](https://www.imagemagick.org/script/download.php)
   * [GTK+ bundle](http://win32builder.gnome.org/gtk+-bundle_3.6.4-20131201_win64.zip)
   * [RSVG lib](https://downloads.sourceforge.net/project/tumagcc/converters/rsvg-convert.exe?r=https%3A%2F%2Fsourceforge.net%2Fprojects%2Ftumagcc%2Ffiles%2Frsvg-convert.exe%2Fdownload&ts=1500995628&use_mirror=netix)

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