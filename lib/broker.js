const express = require('express');
const ws = require('ws').Server;
const rd = require('require-dir');
const bodyParser = require('body-parser');
const EventEmitter = require('events');
const uuid = require('uuid/v4');

module.exports = function(port) {
  const app = express();
  app.use(bodyParser.json());

  let protocols = rd('./protocols');
  protocols = Object.keys(protocols).reduce(function(main, key) {
    const protocol = protocols[key];

    main[protocol.name] = protocol;

    if(typeof(protocol.serve) !== 'function') {
      return main;
    }

    const router = express.Router();
    app.use(`/v1/${ protocol.name }`, router);

    protocol.serve({
      router
    });

    return main;
  }, {});

  const http = app.listen(port || process.env.MB_PORT, function() {
    console.log(`The message broker is now running on port ${ http.address().port }`);
  });
  const wss = new ws({
    server: http
  });

  wss.on('connection', function(socket) {
    const emitter = new EventEmitter();

    emitter.on('join', function(message) {
      const room = message.room;
      const proxy = {};

      proxy.id = uuid();

      proxy.on = function(name, clbk) {
        emitter.on.call(emitter, `${ room }::${ name }`, clbk);
      };

      proxy.send = function(data) {
        data.type = `${ room }::${ data.type }`;

        socket.send(JSON.stringify(data));
      };

      socket.on('close', function() {
        emitter.emit(`${ room }::close`);
      });

      socket.on('error', console.error);

      protocols[room].events(proxy);
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
  });
};
