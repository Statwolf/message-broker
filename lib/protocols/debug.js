const protocol = {};

protocol.name = 'debug';

const _clients = {};

protocol.events = function(client) {
  _clients[client.id] = client;

  client.on('close', function() {
    delete _clients[client.id];
  });
};

protocol.serve = function(proxy) {

  proxy.router.get('/clients', function(req, res) {
    const items = Object.keys(_clients).map(function(key) {
      return {
        id: _clients[key].id
      };
    });

    res.json(items);
  });

  proxy.router.post('/events', function(req, res) {
    const payload = {
      type: 'event',
      url: req.body.url
    };

    const notified = Object.keys(_clients).reduce(function(total, key) {
      _clients[key].send(payload);

      return total + 1;
    }, 0);

    res.json({
      notified
    });
  });

};

module.exports = protocol;
