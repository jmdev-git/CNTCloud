const { spawn } = require('child_process');
const path = require('path');

// Start Next.js server on port 1101
const nextBin = path.join(__dirname, 'node_modules', 'next', 'dist', 'bin', 'next');

const server = spawn('node', [nextBin, 'start', '-p', '1101', '-H', '0.0.0.0'], {
  cwd: __dirname,
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: '1101',
    HOSTNAME: '0.0.0.0'
  },
  stdio: 'inherit'
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});

// Handle termination signals
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.kill('SIGINT');
});
