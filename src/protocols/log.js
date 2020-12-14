const factory = function(proxy) {
  const room = 'log';

  const _topics = {};

  const router = proxy.http.router(room);
  router.post('/:topic', function(request, response) {
    const clients = _topics[request.params.topic];
    if(clients != null) {
      clients.forEach(function(client) {
        client.send({
          type: 'content',
          topic: request.params.topic,
          log: request.body
        })
      });
    }

    response.end();
  });

  const _clients = {};

  const events = proxy.wss(room);

  events.on('join', function(client, message) {
    _clients[client.id] = {
      client,
      topics: message.topics
    }

    message.topics.forEach(function(topic) {
      if(_topics[topic] == null) {
        _topics[topic] = [];
      }

      _topics[topic].push(client);
    });
  });

  events.on('close', function(id) {
    const meta = _clients[id];

    const client = meta.client;
    const topics = meta.topics;
    topics.forEach(function(topic) {
      _topics[topic] = _topics[topic].filter(c => c !== client);
    })

    delete _clients[id];
  });

};

module.exports = factory;
