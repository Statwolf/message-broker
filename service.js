const Service = require('node-windows').Service;
const path = require('path');

const svc = new Service({
  name: 'Node Message Broker',
  description: 'The Statwolf message broker',
  script: path.join(__dirname, 'index.js'),
  env: {
	  name: 'PORT',
	  value: '9999'
  }
});

svc.install();
svc.start();
