const WSS = require('ws').Server;
const http = require('./http');
const Emitter = require('events');
const uuid = require('uuid/v4');

const wss = new WSS({
  server: http.server
});

const emitter = new Emitter();

wss.on('connection', function(socket) {
  emitter.on('join', function(message) {
    const room = message.room;

    const id = uuid();

    const proxy = {
      id
    };
    proxy.send = function(data) {
      data.type = `${ room }::${ data.type }`;

      socket.send(JSON.stringify(data));
    };

    emitter.emit(`${ room }::join`, proxy, message);

    socket.on('close', function() {
      emitter.emit(`${ room }::close`, id);
    });
  });

  socket.on('message', function(message) {
    if(message == null) {
      return;
    }

    message = JSON.parse(message);

    if(message.type == null) {
      return;
    }

    emitter.emit(message.type, message);
  });

  socket.on('error', console.error);
});

const proxyFactory = function(room) {
  const proxy = {};

  proxy.on = function(name, handler) {
    emitter.on(`${ room }::${ name }`, handler);
  };

  return proxy;
};

module.exports = proxyFactory;
