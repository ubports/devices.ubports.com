var env       = process.env.NODE_ENV || 'development';
var config    = require(__dirname + '/../config/config.json')[env];

config.DEBUG = process.env.DEBUG;

module.exports = config;
