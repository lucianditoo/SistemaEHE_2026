module.exports = {
  apps: [
    {
      name: "sistema-ehe",
      script: "./node_modules/next/dist/bin/next",
      args: "start",
      env: {
        PORT: 3006,
        NODE_ENV: "production"
      }
    }
  ]
};
