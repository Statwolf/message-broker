const factory = function(proxy) {
  const room = 'debug';

  const router = proxy.http.router(room);

  router.get('/clients', function(req, res) {
    const items = Object.keys(_clients).map(function(key) {
      return {
        id: _clients[key].id
      };
    });

    res.json(items);
  });

  router.post('/events', function(req, res) {
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

  const _clients = {};
  const events = proxy.wss(room);

  events.on('join', function(client) {
    _clients[client.id] = client;
  });

  events.on('close', function(id) {
    delete _clients[id];
  });
};

module.exports = factory;
