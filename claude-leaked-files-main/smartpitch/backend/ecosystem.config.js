module.exports = {
  apps: [
    {
      name: 'smartpitch-backend',
      script: './dist/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      env_development: {
        NODE_ENV: 'development'
      }
    }
  ]
};
