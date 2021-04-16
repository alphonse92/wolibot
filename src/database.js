const path = require('path');
const fs = require('fs');

const FILE_PATH = path.join(__dirname, '../database.json');

const write = async (json) => {
  const current = await fs.readFileSync(FILE_PATH);
  const array = JSON.parse(current.toString());
  array.push(json);

  await fs.writeFileSync(FILE_PATH, JSON.stringify(array));
}

const read = async () => {
  const data = await fs.readFileSync(FILE_PATH);
  return JSON.parse(data.toString());
}

module.exports = {
  write,
  read,
}