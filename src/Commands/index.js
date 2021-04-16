const Alerts = require('./Alerts');

module.exports = {
  commandList: {
    ...Alerts.commandList,
  },
  commandListNames: [...Alerts.commandListNames]
}