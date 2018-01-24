const mocha = require('mocha');
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
chai.use(require('sinon-chai'));
const sm = require('sandboxed-module');
const EventEmitter = require('events');

describe('The broker module', function() {

  let mut;
  let ws;
  let wss;
  let app;
  let requireDir;
  let protocols;
  let router;
  let env;
  let bodyParser;
  let http;
  let socket;
  let ee;
  let uuid;

  beforeEach(function(done) {
    socket = {};
    socket.on = sinon.spy();
    socket.send = sinon.spy();

    bodyParser = {
      json: sinon.stub()
    };
    const mw = {};
    bodyParser.json.returns(mw);

    env = {
      MB_PORT: 'a port'
    };

    protocols = {};

    ws = {
      Server: sinon.stub()
    };
    wss = {};
    wss.on = sinon.spy();
    ws.Server.returns(wss);

    http = {};

    app = {};
    app.use = sinon.spy();
    app.listen = sinon.stub();
    app.listen.returns(http);

    router = {};

    const express = sinon.stub();
    express.returns(app);
    express.Router = sinon.stub();
    express.Router.returns(router);

    requireDir = sinon.stub();
    requireDir.returns(protocols);

    ee = new EventEmitter();

    uuid = sinon.stub();
    uuid.returns('a uuid');

    mut = sm.require('../lib/broker', {
      requires: {
        express,
        ws,
        events: function() {
          return ee;
        },
        'body-parser': bodyParser,
        'require-dir': requireDir,
        'uuid/v4': uuid
      },
      globals: {
        process: {
          env
        }
      }
    });

    done();
  });

  it('should put the express app listening', function(done) {
    mut();

    expect(app.listen).to.be.calledWith(env.MB_PORT);
    done();
  });

  it('should load all the protocols', function(done) {
    protocols.test = {
      name: 'test',
      serve: function() {
        expect(requireDir).to.be.calledWithExactly('./protocols');
        done();
      }
    };

    mut();
  });

  it('should assign an express router to each plugin', function(done) {
    protocols.test = {
      name: 'test',
      serve: function(info) {
        expect(info.router).to.be.equal(router);
        expect(app.use).to.be.calledWithExactly('/v1/test', router);

        done();
      }
    };

    mut();
  });

  it('should use body-parser middleware', function(done) {
    mut();

    expect(app.use).to.be.calledWithExactly(bodyParser.json());
    done();
  });

  it('should initialize a wss', function(done) {
    mut();

    expect(ws.Server).to.be.calledWithNew;
    expect(ws.Server).to.be.calledWithExactly({
      server: http
    });
    done();
  });

  it('should register on message callback', function(done) {
    mut();

    expect(wss.on).to.be.calledWith('connection');
    wss.on.getCall(0).args[1](socket);

    expect(socket.on).to.be.calledWith('message');
    done();
  });

  it('should join a room on join message', function(done) {
    protocols.aRandomName = {
      name: 'test',
      events: function() {
        done();
      }
    };

    mut();
    wss.on.getCall(0).args[1](socket);
    socket.on.getCall(0).args[1](JSON.stringify({
      type: 'join',
      room: 'test'
    }));
  });

  it('should prefix the events with the plugin name', function(done) {
    protocols.filename = {
      name: 'test',
      events: function(info) {
        info.on('evt_name', done);
        ee.emit('test::evt_name');
      }
    };

    mut();

    wss.on.getCall(0).args[1](socket);
    socket.on.getCall(0).args[1](JSON.stringify({
      type: 'join',
      room: 'test'
    }));
  });

  it('should send json objects', function(done) {
    protocols.filename = {
      name: 'test',
      events: function(info) {
        info.send({ type: 'a custom type', test: 'a test string' });

        expect(socket.send).to.be.calledWithExactly(JSON.stringify({ type: 'test::a custom type', test: 'a test string' }));
        done();
      }
    };

    mut();
    wss.on.getCall(0).args[1](socket);
    socket.on.getCall(0).args[1](JSON.stringify({
      type: 'join',
      room: 'test'
    }));
  });

  it('should propagate the onclose event', function(done) {
    protocols.filename = {
      name: 'test',
      events: function(info) {
        info.on('close', done);
      }
    };

    mut();
    wss.on.getCall(0).args[1](socket);
    socket.on.getCall(0).args[1](JSON.stringify({
      type: 'join',
      room: 'test'
    }));
    expect(socket.on).to.be.calledWith('close');
    expect(ee.eventNames()).contains('test::close');
    socket.on.getCall(1).args[1]();
  });

  it('should assign an id to the socket', function(done) {
    protocols.filename = {
      name: 'test',
      events: function(info) {
        expect(info.id).to.be.equal('a uuid');

        done();
      }
    };

    mut();
    wss.on.getCall(0).args[1](socket);
    socket.on.getCall(0).args[1](JSON.stringify({
      type: 'join',
      room: 'test'
    }));
  });

  it('should skip void messages', function(done) {
    mut();
    wss.on.getCall(0).args[1](socket);
    socket.on.getCall(0).args[1]();

    done();
  });

});
