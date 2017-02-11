var Sequelize = require('sequelize');
var config = require("./config");

var db = function() {
  console.log("connecting to database");
  if (config.DEBUG === "1") {
    console.log("note! database in debug mode");
    this.db = new Sequelize(config.database.database, config.database.username, config.database.password, {
      host: "localhost",
      dialect: 'sqlite',
      storage: 'database.sqlite'
    });
  } else {
    this.db = new Sequelize(config.database.database, config.database.username, config.database.password, {
      host: config.database.host,
      dialect: 'mysql'
    });
  }

  this.users = this.db.define("users", {
    name: Sequelize.STRING,
    API: Sequelize.STRING,
    username: Sequelize.STRING,
    ubuntu_id: Sequelize.STRING,
    is_member: Sequelize.BOOLEAN
  });

  this.emailUpdate = this.db.define('emailUpdate', {
    email: Sequelize.STRING,
    device: Sequelize.STRING,
    comfirm: Sequelize.BOOLEAN
  });

  this.devicesBuild = this.db.define('devicesBuild', {
    device: Sequelize.STRING,
    manifest: Sequelize.STRING,
    canBuild: Sequelize.BOOLEAN,
    hasCi: Sequelize.BOOLEAN,
    ciFails: Sequelize.BOOLEAN
  });

  this.installer = this.db.define('installer', {
    device: Sequelize.STRING,
    name: Sequelize.STRING,
    install_settings: Sequelize.STRING,
    images: Sequelize.STRING,
    buttons: Sequelize.STRING,
    system_server: Sequelize.STRING
  })

  this.devices = this.db.define('devices', {
    name: Sequelize.STRING,
    device: Sequelize.STRING,
    pri: Sequelize.INTEGER,
    donates: Sequelize.INTEGER,
    price: Sequelize.INTEGER,
    wiki: Sequelize.STRING,
    systemImage: Sequelize.TEXT,
    status: Sequelize.INTEGER,
    whatIsWorking: Sequelize.TEXT,
    about: Sequelize.TEXT,
    type: Sequelize.STRING,
    votes: Sequelize.INTEGER,
    bitcoin: Sequelize.STRING,
    maintainer: Sequelize.STRING,
    multirom: Sequelize.BOOLEAN,
    done: Sequelize.INTEGER,
    request: Sequelize.BOOLEAN,
    comment: Sequelize.STRING
  });

};
exports.db = db;
