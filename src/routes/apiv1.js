var express = require('express');
var basicAuth = require('basic-auth-connect');
var passport = require('passport');
var db = require('../models/db');
var config = require("../models/config")
var http = require('http');
var UbuntuStrategy = require("passport-ubuntu").Strategy;
var router = express.Router();
var uuid = require("node-uuid");
var request = require("request");
var bitcoin = require("../models/bitcoin");
var mailgun = require('mailgun').Mailgun;
var mailcomposer = require("mailcomposer");
var geoip = require('geoip-lite');

var mg = new mailgun(config.mailgun);
var dbCon = new db.db();

router.post('/auth/ubuntu', passport.authenticate('ubuntu'));
router.get('/auth/ubuntu/return', passport.authenticate('ubuntu', {
  successRedirect: '/admin',
  failureRedirect: '/auth/login'
}));

router.get('/auth/login', function(req, res) {
  res.send('<form action="/auth/ubuntu" method="post"><div><input type="submit" value="Sign In"/></div></form>');
});

router.get('/auth/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

router.get('/admin', function(req, res, next) {
  if (process.env.DEBUG){
    res.render('admin/index');
    return;
  }
  if (req.user.is_member)
    res.render('admin/index');
  else;
  res.send("<center><h1>access denied (non admin)</h1></center>");
});

function ensureAuthenticated(req, res, next) {
  if (process.env.DEBUG)
    return next();
  if (!req.isAuthenticated()) {
    res.status(401).send("Unauthorized");
    return;
  }
  if (req.user.is_member) {
    return next();
  } else {
    res.status(403).send("Forbidden");
  }
}

function ensureAuthenticatedNonAdmin(req, res, next) {
  if (!req.isAuthenticated()) res.status(401).send("Unauthorized")
  res.status(403).send("Forbidden");
}

// USING DB

dbCon.db.sync().then(function() {

      passport.serializeUser(function(user, done) {
        done(null, user.ubuntu_id);
      });

      passport.deserializeUser(function(identifier, done) {
        dbCon.users.findOne({
          where: {
            ubuntu_id: identifier
          }
        }).then(function(user) {
          done(null, user);
        });
      });

      passport.use(new UbuntuStrategy({
          returnURL: config.login.returnURL,
          realm: config.login.realm,
          stateless: true,
        },
        function(identifier, profile, done) {
          request.get("http://api.launchpad.net/1.0/~ubports-developers/members", function(err, head, response) {
            var userFound = false;;
            response = JSON.parse(response);
            response.entries.forEach(function(i) {
              if (profile.nickname == i.name) {
                userFound = true;
              }
            });
            dbCon.users.findOrCreate({
                where: {
                  ubuntu_id: identifier
                },
                defaults: {
                  name: profile.fullname,
                  API: uuid.v4(),
                  username: profile.nickname,
                  ubuntu_id: identifier,
                  is_member: userFound
                }
              })
              .spread(function(user, created) {
                if (user.is_member === userFound)
                  done(null, user.get());
                else user.updateAttributes({
                  is_member: userFound
                }, function() {
                  done(null, user.get());
                });
              })
          });

        }));


      router.get('/auth/me', ensureAuthenticated, function(req, res) {
        if (process.env.DEBUG){
          res.send(200)
          return;
        }
        res.send(req.user);
      });

      router.get('/api/installer/all', (req, res, next) => {
        dbCon.installer.all().then((r) => {
          var dbArr = [];
          r.forEach((ob) => {
            dbArr.push({
              device: ob.device,
              name: ob.name,
              install_settings: JSON.parse(ob.install_settings),
              images: JSON.parse(ob.images),
              buttons: JSON.parse(ob.buttons),
              system_server: JSON.parse(ob.system_server)
            });
          })
          res.send(dbArr);
        })
      })

      router.get('/api/installer/devices', (req, res, next) => {
        dbCon.installer.all().then((r) => {
          var dbArr = [];
          r.forEach((ob) => {
            dbArr.push({
              device: ob.device,
              name: ob.name
            });
          })
          res.send(dbArr);
        })
      })

      router.get('/api/devices', function(req, res, next) {
        dbCon.devices.all().then(function(r) {
          var progress = new Array();
          var vote = new Array();
          var active = new Array();
          r.forEach(function(d) {
            var cre = {
              id: d.id,
              name: d.name,
              device: d.device,
              pri: d.pri,
              votes: d.votes,
              donates: d.donates,
              price: d.price,
              done: d.done,
              comment: d.comment
            };
            if (d.status) {
              if (d.status === 4) {
                active.push(cre);
              } else if (d.status === 2 || d.status === 3) {
                progress.push(cre);
              } else {
                vote.push(cre);
              }
            } else {
              vote.push(cre);
            }
          });

          res.send(JSON.stringify({
            devices: {
              active: active,
              progress: progress,
              vote: vote
            }
          }));
        });
      });

      router.get('/api/devices/all', function(req, res, next) {
        dbCon.devices.all().then(function(r) {
          res.send(r);
        });
      });

      router.get('/api/installer/success', function(req, res, next) {
        dbCon.installSuccess.findAll({
          attributes: ["device", "channel", "geo"]
        }).then(function(r) {
          res.send(r);
        });
      });

      router.get('/api/device/:device', function(req, res, next) {
        dbCon.devices.find({
          where: {
            device: req.params.device
          }
        }).then(function(r) {
          if (!r) {
            res.sendStatus(404)
          } else {
            res.send({
              device: r
            });
          }
        });
      });

      router.get('/api/device/:device/build', function(req, res, next) {
        dbCon.devicesBuild.find({
          where: {
            device: req.params.device
          }
        }).then(function(r) {
          if (!r) {
            res.sendStatus(404)
          } else {
            if (!r.hasCi) delete r.ciFails;
            res.send({
              device: r
            });
          }
        });
      });

      router.post('/api/device/all/:api', ensureAuthenticated, function(req, res, next) {
        var params = req.body;
        dbCon.devices.create(params).then(function(jane) {
          res.sendStatus(200);
        });


      });

      router.post('/api/device/request', ensureAuthenticatedNonAdmin, function(req, res, next) {
        var params = req.body;
        params.request = true;
        dbCon.devices.create(params).then(function(jane) {
          res.sendStatus(200);
        });
      });

      router.post("/api/device/:device/email/update", ensureAuthenticated, function(req, res, next) {
        var params = req.body;
        if (typeof params.text !== "string" || typeof req.params.device !== "string") {res.sendStatus(400); return;}
        dbCon.devices.find({where: {device: req.params.device}}).then(function (data) {
          if (!data) {
            res.sendStatus(404);
            return;
          }
        dbCon.emailUpdate.findAll({
          where: {
            device: req.params.device,
            comfirm: true
          }
        }).then(function(r) {
          if (!r) {
            res.sendStatus(404)
          } else {
            if (r.length === 0) {
              res.sendStatus(200);
              return;
            }
            var emails = [];
            r.forEach(function (e) {
              emails.push(e.email);
            })
            res.send(JSON.stringify(emails));
            var mail = mailcomposer({
              from: 'Ubports device update <devices@ubports.com>',
              to: emails,
              subject: 'New update on '+data.name,
              body: 'Hello there!\r\n------------\r\n\r\nThere is a update on Nexus 9 from the maintainer (mariogrip)!\r\n\r\nWifi now works!\r\n\r\nKind regards,\r\n\r\nThe Ubports Team',
              html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd"><html><body>\
              <h4>Hello there!</h4>\
              <p>There is a update on Nexus 9 from the maintainer (mariogrip)!<br></p>\
              <div class="panel panel-default" style="color: #000 !important; text-shadow: none !important; -webkit-box-shadow: none !important; box-shadow: none !important; -webkit-box-sizing: border-box; -moz-box-sizing: border-box; box-sizing: border-box; margin-bottom: 20px; border-radius: 4px; background-color: #fff; border: 1px solid #ddd;">\
              <div class="panel-body" style="color: #000 !important; text-shadow: none !important; -webkit-box-shadow: none !important; box-shadow: none !important; -webkit-box-sizing: border-box; -moz-box-sizing: border-box; box-sizing: border-box; padding: 15px;">\
              ' + params.text + '</div></div><p>\
              Kind regards, <br>The Ubports Team</p></body></html>'
            });
            mail.build(function (error, mes) {
              mg.sendRaw("Ubports device update <devices@ubports.com>", emails, mes);
              res.sendStatus(200);
            })
          }
        });
      });
      });

      router.post("/api/device/:device/email", ensureAuthenticated, function(req, res, next) {
        var params = req.body;
        dbCon.emailUpdate.create({email: params.email, device: req.params.device}).then(function () {
          res.sendStatus(200);
        })
      });

      router.get('/api/device/:api/bitcoin', ensureAuthenticated, function(req, res, next) {
          var p = {};
          bitcoin.getNewAddress(function(err, addr, t) {
              p.bitcoin = addr;
              dbCon.devices.update(p, {
                where: {
                  id: req.params.id
                }
              }).then(function(r) {
                if (!r) res.sendStatus(404);
                res.send(p.bitcoin);
                res.sendStatus(200);
              })
            });
          })

        router.put('/api/device/all/:api/:id', ensureAuthenticated, function(req, res, next) {
          var params = req.body;
          dbCon.devices.update(params, {
            where: {
              id: req.params.id
            }
          }).then(function(r) {
            if (!r) res.sendStatus(404);
            res.send(200);
          });
        });

        router.get('/api/installer/:device', function(req, res, next) {
          dbCon.installer.find({
            where: {
              device: req.params.device
            }
          }).then(function(r) {
            if (!r) {
              res.sendStatus(404)
            } else {
              res.send({
                id: r.id,
                device: r.device,
                name: r.name,
                install_settings: JSON.parse(r.install_settings),
                images: JSON.parse(r.images),
                buttons: JSON.parse(r.buttons),
                system_server: JSON.parse(r.system_server)
              });
            }
          });
        });

        router.post('/api/installer/all/:api', ensureAuthenticated, function(req, res, next) {
          var params = req.body;
          var dbObj = {
            id: params.id,
            device: params.device,
            name: params.name,
            install_settings: JSON.stringify(params.install_settings),
            images: JSON.stringify(params.images),
            buttons: JSON.stringify(params.buttons),
            system_server: JSON.stringify(params.system_server)
          }
          dbCon.installer.create(dbObj).then(function(jane) {
            res.sendStatus(200);
          });
        });

        router.post('/api/installer/success', function(req, res, next) {
          var params = req.body;
          var ip = req.ip;
          var geo = geoip.lookup(ip).country || "N/A";
          var dbObj = {
            channel: params.channel,
            device: params.device,
            ip: ip,
            geo: geo
          }
          dbCon.installSuccess.create(dbObj).then(function(jane) {
            res.sendStatus(200);
          });
        });

        router.put('/api/installer/all/:api/:id', ensureAuthenticated, function(req, res, next) {
          var params = req.body;
          var dbObj = {
            device: params.device,
            name: params.name,
            install_settings: JSON.stringify(params.install_settings),
            images: JSON.stringify(params.images),
            buttons: JSON.stringify(params.buttons),
            system_server: JSON.stringify(params.system_server)
          }
          dbCon.installer.update(dbObj, {
            where: {
              id: req.params.id
            }
          }).then(function(r) {
            if (!r) res.sendStatus(404);
            res.send(200);
          });
        });

        router.delete('/api/installer/all/:api/:id', ensureAuthenticated, function(req, res, next) {
            var params = req.body;
            dbCon.installer.destroy({
              where: {
                id: req.params.id
              }
            }).then(function(r) {
              if (!r) {
                res.sendStatus(404)
              } else {
                res.sendStatus(200);
              }
            });
        });

        router.put('/api/device/vote/:id', ensureAuthenticated, function(req, res, next) {
          var params = req.body;
          dbCon.devices.update(params, {
            where: {
              id: req.params.id
            }
          }).then(function(r) {
            if (!r) {
              res.sendStatus(404)
            } else {
              res.send(200);
            }
          });
        });

        router.get("/api/bitcoin", ensureAuthenticated, function(req, res, next) {
          bitcoin.getBalance("*", function(err, bal, resbod) {
            res.send("balance: " + bal);
          })
        })

        router.delete('/api/device/all/:api/:id', ensureAuthenticated, function(req, res, next) {
          if (req.params.api === "frasdfvdwdeqwdsafqwrawdsagfhtrjtagr") {
            var params = req.body;
            dbCon.devices.destroy({
              where: {
                id: req.params.id
              }
            }).then(function(r) {
              if (!r) {
                res.sendStatus(404)
              } else {
                res.send(200);
              }
            });
          } else {
            res.send(500);
          }
        });


      });
    module.exports = router;
