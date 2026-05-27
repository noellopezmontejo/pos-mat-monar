const http = require('http');
const server = http.createServer((req, res) => {
  res.end('alive');
});
server.listen(4002, '127.0.0.1', () => {
  console.log('Server listening on 4002');
});
