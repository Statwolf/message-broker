const Service = require('node-windows').Service;
const path = require('path');

const script = path.join(__dirname, 'index.js');

console.log(`Installing service ${ script }`);

const svc = new Service({
  name: 'Node Message Broker',
  description: 'The Statwolf message broker',
  script,
  env: {
	  name: 'PORT',
	  value: '9999'
  }
});

svc.uninstall();
svc.install();
svc.start();
