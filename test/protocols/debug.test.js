const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
chai.use(require('sinon-chai'));
const sm = require('sandboxed-module');
const EventEmitter = require('events');

describe('The debug protocol', function() {

  let mut;
  let router;
  let req;
  let res;
  let socket;

  beforeEach(function(done) {
    router = {};
    router.get = sinon.spy();
    router.post = sinon.spy();

    socket = new EventEmitter();
    socket.id = 'the id';
    socket.send = sinon.spy();

    req = {};

    res = {};
    res.json = sinon.spy();

    mut = sm.require('../../lib/protocols/debug', {});

    done();
  });

  it('should have name field set to debug', function(done) {
    expect(mut.name).to.be.equal('debug');

    done();
  });

  it('should ad a register a client', function(done) {
    mut.serve({
      router
    });

    mut.events(socket);

    expect(router.get).to.be.calledWith('/clients');
    router.get.getCall(0).args[1](req, res);
    expect(res.json).to.be.calledWithExactly([{ id: 'the id' }]);

    done();
  });

  it('should remove a client onclose', function(done) {
    mut.serve({
      router
    });

    mut.events(socket);

    socket.emit('close');

    router.get.getCall(0).args[1](req, res);
    expect(res.json).to.be.calledWithExactly([]);

    done();
  });

  it('should notify clients about a debug event', function(done) {
    mut.serve({
      router
    });

    mut.events(socket);

    req.body = {
      url: 'a chrome dev tools url'
    };

    expect(router.post).to.be.calledWith('/events');
    router.post.getCall(0).args[1](req, res);
    expect(res.json).to.be.calledWithExactly({ notified: 1 });
    expect(socket.send).to.be.calledWithExactly({
      type: 'event',
      url: 'a chrome dev tools url'
    });

    done();
  });

});
