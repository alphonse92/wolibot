const Alerts = require('./Alerts');

const joinNames = (array = []) => {
  const names = [];
  array.forEach(commandObject => {
    commandObject.commandListNames.forEach(commandName => {
      names.push(`${commandObject.name} ${commandName}`)
    })
  })

  return names;
};

module.exports = {
  commandList: {
    [Alerts.name]: {...Alerts.commandList}
  },
  commandListNames: joinNames([Alerts])
}