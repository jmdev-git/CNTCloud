const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
  name: 'CNT CloudSpace',
  description: 'CNT CloudSpace Web Application',
  script: path.join(__dirname, 'node_modules', 'next', 'dist', 'bin', 'next'),
  scriptOptions: 'start -p 1101',
  nodeOptions: [],
  env: [
    {
      name: "NODE_ENV",
      value: "production"
    },
    {
      name: "PORT",
      value: "1101"
    }
  ]
});

// Listen for the "install" event
svc.on('install', function() {
  console.log('Service installed successfully!');
  svc.start();
});

// Install the service
svc.install();
