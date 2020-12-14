const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');

const app = express();
app.use(bodyParser.json());

//app.use('/', function(req, res) {
  //res.json({
    //message: 'Hello from message broker'
  //});
//});

const server = http.createServer(app);
server.listen(80, function() {
  console.log('Running message broker on http://0.0.0.0');
});

const router = function(prefix) {
  const router = express.Router();
  app.use(`/v1/${ prefix }`, router);

  return router;
};

const service = {
  server,
  router
};

module.exports = service;
