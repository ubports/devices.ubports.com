var bitcoin = require("bitcoin");
var config = require("./config.js");

var client = new bitcoin.Client({
  host: 'rpc.blockchain.info',
  port: 443,
  user: config.bitcoin.username,
  pass: config.bitcoin.password,
  ssl: true,
  timeout: 30000
});

module.exports = client;
