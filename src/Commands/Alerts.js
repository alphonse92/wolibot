const database = require('../database');

const listAlerts = async (parameters, webClient, data) => {
  let list = await database.read();

  if (parameters.length) {
    if (parameters.includes('--result=toxic')){
      list = list.filter(item => item.result === 'TOXIC');
    }

    if (parameters.includes('--result=healthy')) {
      list = list.filter(item => item.result === 'HEALTHY');
    }
  }

  const resultUpload = await  webClient.files.upload({
    channels: data.channel,
    thread_ts: data.ts,
    content: JSON.stringify(list),
    filetype: "json",
    filename: `${Date.now()}.alerts.list.json`
  });

  return resultUpload;
};

const reportAlerts = async (parameter, webClient, data) => {
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

  console.log(`Alerts.js:37`, channelsInfo);
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