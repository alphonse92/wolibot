const database = require('../database');
const JSDOM = require('jsdom').JSDOM;
const fs = require('fs');

const getPaginationInfo = (parameters) => {
  const regexStart = /\-\-start=(\d+)/;
  const regexLimit = /\-\-limit=(\d+)/;

  let startInfo = parameters.find(param => regexStart.test(param)) || '--start=0';
  let limitInfo = parameters.find(param => regexLimit.test(param)) || '--limit=50';

  return {
    start: parseInt(regexStart.exec(startInfo)[1]),
    limit: parseInt(regexLimit.exec(limitInfo)[1]),
  }
};


const listAlerts = async (parameters, webClient, data) => {
  let list = await database.read();

  if (parameters.length) {
    if (parameters.includes('--result=toxic')){
      list = list.filter(item => item.result === 'TOXIC');
    }

    if (parameters.includes('--result=healthy')) {
      list = list.filter(item => item.result === 'HEALTHY');
    }

    if (!parameters.includes( '--complete') ) {
      list = list.map(item => item.text);
    }
  } else {
    list = list.map(item => item.text);
  }

  const {start, limit} = getPaginationInfo(parameters);


  const resultUpload = await  webClient.files.upload({
    channels: data.channel,
    thread_ts: data.ts,
    content: JSON.stringify(list.slice(start, start + limit)),
    filetype: "json",
    filename: `${Date.now()}.alerts.list.json`
  });

  return resultUpload;
};

const reportAlerts = async (parameter, webClient, data) => {
// Create instance of JSDOM.
  const jsdom = new JSDOM('<body><div id="container"></div></body>', {runScripts: 'dangerously'});
// Get window
  const window = jsdom.window;

// For jsdom version 9 or lower
// var jsdom = require('jsdom').jsdom;
// var document = jsdom('<body><div id="container"></div></body>');
// var window = document.defaultView;

// require anychart and anychart export modules
  const anychart = require('anychart')(window);
  const anychartExport = require('anychart-nodejs')(anychart);

// create and a chart to the jsdom window.
// chart creating should be called only right after anychart-nodejs module requiring
  var chart = anychart.pie([10, 20, 7, 18, 30]);
  chart.bounds(0, 0, 800, 600);
  chart.container('container');
  chart.draw();

// generate JPG image and save it to a file
  anychartExport.exportTo(chart, 'jpg').then(function(image) {
    fs.writeFile('anychart.jpg', image, function(fsWriteError) {
      if (fsWriteError) {
        console.log(fsWriteError);
      } else {
        console.log('Complete');
      }
    });
  }, function(generationError) {
    console.log(generationError);
  });
  return Promise.resolve();


  let list = await database.read();
  const channels = list.map(item => item.channel);
  const channelList = Array.from(new Set(channels));
  if(!channelList || !channelList.length) {
    return Promise.resolve();
  }

  const channelsInfo = await Promise.all( channelList.map( async (channelID) => {
    const details = await webClient.conversations.info({
      channel: channelID
    });
    return details;
  }));

  const channelsMapped = channelsInfo.reduce((accum, current) => {
    const { ok, channel = {} } = current;
    if (ok) {
      accum[channel.id] = channel;
    }
    return accum;
  }, {});

  const groupByChannel = list.reduce((accum, item) => {
    const objects = accum[item.channel] || {};
    const { toxic = [], healthy = [] } = objects;
    if (item.result === 'TOXIC') {
      toxic.push({
        ...item,
        channelName: channelsMapped[item.channel].name
      })
    }

    if (item.result === 'HEALTHY') {
      healthy.push({
        ...item,
        channelName: channelsMapped[item.channel].name
      });
    }

    accum[item.channel] = {
      toxic,
      healthy
    };

    return accum;
  }, {});

  console.log(`Alerts.js:37`, groupByChannel);
};

const commandList = {
  list: listAlerts,
  report: reportAlerts
};

module.exports = {
  commandList,
  commandListNames: Object.keys(commandList),
  name: 'alerts',
};