module.exports = {
  apps : [{
    name   : "storelandUI",
    script : "./index.js",
//    instances : "max",
    instances : "1",
    exec_mode : "cluster",
    env: {
      NODE_ENV: "development",
      PORT: 5501
    },
    env_dev: {
      NODE_ENV: "dev",
    },
    env_staging: {
      NODE_ENV: "staging",
    },
    env_production: {
      NODE_ENV: "production",
    }
  }]
}
