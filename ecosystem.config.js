module.exports = {
  apps: [
    {
      name: "pos-monar-backend",
      script: "src/api/server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 4002
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 4002
      }
    }
  ]
};
