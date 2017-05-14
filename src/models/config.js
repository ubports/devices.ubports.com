var env       = process.env.NODE_ENV || 'production';
var config    = require(__dirname + '/../../config/config.json')[env];

config.DEBUG = process.env.DEBUG;

if (config.DEBUG){
    env = "development"
}

module.exports = config;
