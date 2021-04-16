const database = require('../database');

const listAlerts = async (parameters) => {
  return database.read();
};

const commandList = {
  list: listAlerts
};

module.exports = {
  commandList,
  commandListNames: Object.keys(commandList),
};