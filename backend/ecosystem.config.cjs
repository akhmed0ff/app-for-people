module.exports = {
  apps: [
    {
      name: 'taxi-backend',
      script: 'dist/main.js',
      instances: process.env.WEB_CONCURRENCY || 2,
      exec_mode: 'cluster',
      max_memory_restart: process.env.PM2_MAX_MEMORY || '512M',
      kill_timeout: 10000,
      listen_timeout: 10000,
      exp_backoff_restart_delay: 100,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
