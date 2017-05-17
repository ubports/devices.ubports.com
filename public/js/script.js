var app = angular.module("ubDevices", ['ngRoute', 'ngAnimate', 'ngCookies', 'ui.bootstrap']);

app.controller('modalCtrl', ['$scope', '$uibModalInstance', '$cookies', function ($scope, $uibModalInstance, $cookies) {
  var cookieLong = () => {
    $cookies.remove(patreonCookie);
    var d = new Date();
    d.setTime(d.getTime() + (30*24*60*60*1000));
    $cookies.putObject(patreonCookie, true, {expires:d});
  }
  $scope.become = () => {
    cookieLong()
  }
  $scope.cancel = () => {
    cookieLong()
    $uibModalInstance.dismiss('cancel');
  };
  $scope.later = () => {
    $uibModalInstance.dismiss('later');
  }
}]);

var patreonCookie = "patreon";
var patreon = ($uibModal, $cookies) => {
  if (!$cookies.getObject(patreonCookie)){
  setTimeout(() => {
    var d = new Date();
    d.setTime(d.getTime() + (1*24*60*60*1000));
    $cookies.putObject(patreonCookie, true, {expires:d});
    $uibModal.open({
      animation: true,
      size: "lg",
      templateUrl: '/modals/patreon.html',
      controller: 'modalCtrl'
    })
  }, 3000);
}
}

app.controller('appCtrl', ['$scope', '$http', '$location', '$uibModal', '$cookies', function($scope, $http, $location, $uibModal, $cookies){

    patreon($uibModal, $cookies);

    $scope.loading = true;
    $http.get("/api/devices").then(function(data){
        var devices = data.data.devices;

        $scope.activeDevices = devices.active;
        $scope.hasActiveDev = (devices.active.length > 0)
        $scope.progressDevices = devices.progress;
        $scope.voteDevices = devices.vote;
        $scope.loading = false;
    });
    $scope.go = function(goto){
        console.log(goto);
        $location.url("/"+goto);
    }
    $scope.goWiki = function(goto){
        if (!goto) return;
        console.log(goto);
        $location.url(goto);
    }
}]);

app.controller('newCtrl', ['$scope', '$http', '$location', function($scope, $http, $location){
           $scope.new = function(i){
        $http.post("api/device/request", i).then(function() {

        });
           };
}]);


app.controller('deviceCtrl', ['$scope', '$http', '$routeParams', '$uibModal', '$cookies', function($scope, $http, $routeParams, $uibModal, $cookies) {
    patreon($uibModal, $cookies);
    $scope.name = $routeParams.device;
    $scope.loading = true;
    $http.get("api/device/"+ $routeParams.device).then(function(data){
        if (data.status === 200){
            if (data.data.redirect){

                console.log(data.data.redirect);
                $http.get("/devices/" + data.data.redirect + ".json").then(function(data){
                    if (data.status === 200){
                        var device = data.data.device;
                        $scope.device = device;

                        ["stable","rc-proposed","devel-proposed"].forEach(function (channel) {
                          $http.get("http://system-image.ubports.com/ubuntu-touch/"+channel+"/"+$routeParams.device+"/index.json").then(function (data) {
                            var version = 0;
                            data.data.images.forEach(function (image) {
                              if (image.type === "full"){
                                version = image.version > version ? image.version : version;
                              }
                            });
                            $scope.systemImage[channel.replace("-proposed", "")] = version;
                          });
                        })


                        $scope.name = device.name;
                        $scope.found = true;
                        $scope.loading = false;
                    }else{
                        $scope.found = false;
                        $scope.loading = false;
                    }
                });
            }else{
                var device = data.data.device;
                $scope.device = device;
                $scope.name = device.name;
                $scope.found = true;
                $scope.loading = false;
            }
        }else{
            $scope.found = false;
            $scope.loading = false;
        }
    }).catch(function(dara){
            $scope.found = false;
            $scope.loading = false;
    });
    $scope.toObj = function(r) {
        var obj = JSON.parse(r.replace('\"', '"'));
        var arr = [];
        var newObj;
        for (var key in obj){
          arr.push(key+"¤"+obj[key])
        }
        return arr;
    };
    $scope.getKey = function(r) {
      return r.split("¤")[0]
    }

    $scope.getValue = function(r) {
      return r.split("¤")[1]
    }

    $scope.pay = "Paypal";
    var pay = "paypal";
    $scope.payAmout = 5;
    $scope.setPaymethod = function(i){
        pay = i;
        $scope.pay = i.capitalizeFirstLetter();
    };
    $scope.paymethod = function(i, r){
        if(r === "btn"){
            if (pay === i){
                return "btn-primary";
            }else{
                return "btn-default";
            }
        }
        if(r === "fa"){
            if (pay === "bitcoin"){
                return "fa-btc";
            }
            if (pay === "paypal"){
                return "fa-usd";
            }
        }
        if(r === "bool"){
            if (pay === i){
                return true;
            }else{
                return false;
            }
        }

    }
    $scope.getStatus = function(i){
        if ($scope.device.status === i){
            return "active";
        }
        if ($scope.device.status > i){
            return "complete";
        }
        if ($scope.device.status < i){
            return "disabled"
        }
    };
}]);

app.filter('toArray', function() { return function(obj) {
    if (!(obj instanceof Object)) return obj;
    return _.map(obj, function(val, key) {
        return Object.defineProperty(val, '$key', {__proto__: null, value: key});
    });
}});

app.config(["$routeProvider", function($routeProvider){
    $routeProvider.when('/new', {
        templateUrl: 'views/new',
        controller: 'newCtrl'
    }).when('/:device', {
        templateUrl: 'views/device',
        controller: 'deviceCtrl'
    }).when('/', {
        templateUrl: 'views/index',
        controller: 'appCtrl'
    }).otherwise({
        rediectTo: '/'
    });
}]);

String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}
