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
    router.get('/get-involved', function(req, res, next) {
        res.redirect("https://ubports.com/get-involved");
    });
    router.get('/faq', function(req, res, next) {
        res.redirect("https://ubports.com/faq");
    });
    router.get('/sponsors', function(req, res, next) {
        res.redirect("https://ubports.com/sponsors");
    });
    router.get('/team', function(req, res, next) {
        res.redirect("https://ubports.com/team");
    });
}

Views.prototype.getRouter = function() {
    return this.router;
};

module.exports = new Views();
