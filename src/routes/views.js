var express = require("express");

function Views() {
    var router = express.Router();
    this.router = router;

    router.get('/', function(req, res, next) {
        res.render('index');
    });
    router.get('/views/index', function(req, res, next) {
        res.render('angular-views/index');
    });
    router.get('/views/device', function(req, res, next) {
        res.render('angular-views/device');
    });
    router.get('/admin', function(req, res, next) {
        res.render('admin/index');
    });
    router.get('/admin/views/device', function(req, res, next) {
        res.render('admin/device');
    });
    router.get('/admin/views/listDevices', function(req, res, next) {
        res.render('admin/listDevices');
    });

}

Views.prototype.getRouter = function() {
    return this.router;
};

module.exports = new Views();
