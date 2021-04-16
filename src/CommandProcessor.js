const Commands = require('./Commands');

const getRegex = () => {
  const availableOptions = `${Object.keys(Commands.commandList).join('|')}`;
  return new RegExp(`\\woli (${availableOptions}) (.*)`);
};

const isACommand = (text) => {
  const regex = getRegex();
  return regex.test(text);
}

const execute = async (commandText, webClient, messageData) => {
  if(!isACommand(commandText)) return Promise.resolve();

  const regex = getRegex();
  const data = regex.exec(commandText);
  const [woliWord, executorName, options] = data;

  const commander = Commands.commandList[executorName];
  if (!commander) return Promise.resolve();

  const splittedOptions = options.split(' ');
  if (!splittedOptions.length) return Promise.resolve();

  const functionName = splittedOptions[0];
  const fn = commander[functionName];

  if (!fn) return Promise.resolve();
  splittedOptions.splice(0, 1)
  return fn(splittedOptions, webClient, messageData);
}

module.exports = {
  execute,
  isACommand
}