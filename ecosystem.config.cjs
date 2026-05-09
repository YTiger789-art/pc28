module.exports = {
  apps: [
    {
      name: 'pc28-system',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        EXTERNAL_API_ENABLED: 'false'
      }
    }
  ]
};
