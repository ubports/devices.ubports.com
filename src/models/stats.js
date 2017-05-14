

var Stats = (db) => {
  this.db = db;
  this.countrys = {};
  this.channels = {};
  this.total = 0;
  db.installSuccess.findAll((installs) => {
    this.total = installs.length;
    installs.forEach((install) => {
      if (!this.channels[install.channel])
        this.channels[install.channel]=0;
      this.channels[install.channel]++
      if (!this.countrys[install.geo])
        this.countrys[install.geo]=0;
      this.countrys[install.geo]++
    })
  })
}

Stats.prototype.get = () => {
  return {
    countrys: this.countrys,
    channels: this.channels,
    total: this.total
  };
};

Stats.prototype.set = (value) => {

}

module.exports = Stats;
