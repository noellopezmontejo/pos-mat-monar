const express = require('express');
const app = express();
const PORT = 8080;

app.get('/', (req, res) => res.send('Hello World'));

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Minimal server running on http://127.0.0.1:${PORT}`);
});
