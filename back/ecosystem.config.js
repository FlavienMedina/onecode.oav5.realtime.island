module.exports = {
  apps: [
    {
      name: 'onecode.realtimeIsland',
      script: 'server.js',

      instances: 1,
      autorestart: true,
      watch: true,
      max_memory_restart: '1G',

      restart_delay: '5000',

      interpreter: 'babel-node',

      env: {
        PORT: 5000,
        NODE_ENV: 'development',

        DEBUG: 'socket.io*',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
}
