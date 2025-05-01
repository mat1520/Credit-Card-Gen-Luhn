module.exports = {
  apps: [{
    name: "telegram-bot",
    script: "index.js",
    watch: true,
    env: {
      NODE_ENV: "production",
    },
    error_file: "logs/err.log",
    out_file: "logs/out.log",
    time: true,
    restart_delay: 4000,
    max_memory_restart: '1G'
  }]
} 