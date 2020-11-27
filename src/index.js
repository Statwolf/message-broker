const protocols = require('./protocols');
const http = require('./http');
const wss = require('./wss');

module.exports = function() {

  // registering handlers
  protocols.forEach(function(handler) {
    handler({
      http,
      wss
    });
  });

};
