const database = require('../database');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require('fs');
const Anychart = require('anychart');
const AnychartNode = require('anychart-nodejs');

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

const createChannelsGraph = async (webClient, alertsList) => {
  const channels = alertsList.map(item => item.channel);
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

  const groupByChannel = alertsList.reduce((accum, item) => {
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

  const data = Object.keys(groupByChannel)
    .map(key => {
      const { toxic, healthy } = groupByChannel[key];
      const channelName = (toxic[0] || healthy[0]).channelName;
      return [
        channelName,
        toxic.length || 0,
        healthy.length || 0,
        '#f39c12',
        '#3498db'
      ];
    })


  const jsdom = new JSDOM('<body><div id="container"></div></body>', {runScripts: 'dangerously'});
  const window = jsdom.window;
  const anychart = Anychart(window);
  const anychartExport = AnychartNode(anychart);
  const chartData = anychart.data.set(data);

  const seriesData_1 = chartData.mapAs({x: 0, value: 1, fill: 3, stroke: 3, label: 'Toxic'});
  const seriesData_2 = chartData.mapAs({x: 0, value: 2, fill: 4, stroke: 4, label: 'Healthy'});

  const chart = anychart.column();
  chart.bounds(0, 0, 800, 600);
  chart.container('container');
  chart.legend(true);

  chart.barGroupsPadding(2);
  const serie1 = chart.column(seriesData_1);
  const serie2 = chart.column(seriesData_2);

  serie1.name('Toxic');
  serie2.name('Normal');

  serie1.color('#f39c12');
  serie2.color('#3498db');

  serie1.labels(true);
  serie2.labels(true);
  serie1.labels().format("{%value} messages");
  serie2.labels().format("{%value} messages");

  serie1.labels().fontColor('#000');
  serie1.labels().fontWeight(600);


  serie2.labels().fontColor('#000');
  serie2.labels().fontWeight(600);
  chart.draw();

  return anychartExport.exportTo(chart, 'jpg');
}

const createUsersGraph = async (webClient, alertList) => {
  const toxicList = alertList.filter(item => item.result  === 'TOXIC');
  const counter = toxicList.reduce((accum, current) => {
    const {userID: id} = current;
    if (!accum[id]) {
      accum[id] = 0;
    }

    accum[id] = accum[id] + 1;

    return accum;
  }, {});

  const usersInfo = await Promise.all(
    Object.keys(counter).map(async (userId) => {
      const userInfo = await webClient.users.info({user: userId})
      return userInfo;
    })
  );

  const mappedUsersInfo = usersInfo.reduce((accum, current) => {
    const { id } = current.user;
    accum[id] = current.user;
    return accum;
  }, {});

  const data = Object.keys(mappedUsersInfo)
    .map(userID => {
      return [
        mappedUsersInfo[userID].name,
        counter[userID]
      ];
    });

  const jsdom = new JSDOM('<body><div id="container"></div></body>', {runScripts: 'dangerously'});
  const window = jsdom.window;
  const anychart = Anychart(window);
  const anychartExport = AnychartNode(anychart);
  const chartData = anychart.data.set(data);

  const seriesData_1 = chartData.mapAs({x: 0, value: 1, fill: 3, stroke: 3});

  const chart = anychart.bar();
  chart.bounds(0, 0, 800, 600);
  chart.container('container');
  chart.legend(true);

  const serie1 = chart.bar(seriesData_1);

  serie1.name('Toxic Messages sended');

  serie1.color('#f39c12');

  serie1.labels(true);
  serie1.labels().fontColor('#000');
  serie1.labels().fontWeight(600);
  chart.draw();

  return anychartExport.exportTo(chart, 'jpg');
}

const reportAlerts = async (parameters, webClient, data) => {
  let list = await database.read();

  let graphData;
  if (parameters.length && parameters.includes('--byUser')) {
    graphData = await createUsersGraph(webClient, list);
  } else {
    graphData = await createChannelsGraph(webClient, list);
  }

  const resultUpload = await  webClient.files.upload({
    channels: data.channel,
    thread_ts: data.ts,
    file: graphData,
    filetype: "jpg",
    filename: `${Date.now()}.alerts.report.jpg`
  });

  return resultUpload;
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