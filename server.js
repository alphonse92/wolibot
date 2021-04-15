const express = require('express');

const app = express()
const port = process.env.PORT || 3000;

app.get('/status', (req, res) => {
  res.send('server is alive');
})

app.listen(port, () => {
  console.log(`server running on port ${port}`)
})