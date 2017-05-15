var app = angular.module("ubDevices", ['ngRoute']);

app.run(function ($rootScope, $http) {
  console.log("run");
  $http.get("/auth/me").then(function (data) {
    $rootScope.auth = data.status === 200;
    $rootScope.forbidden = data.status === 403;
  }).catch(function (data) {
    $rootScope.auth = data.status === 200;
    $rootScope.forbidden = data.status === 403;
  });
})

app.controller('deviceCtrl', ['$scope', '$http', '$location', '$routeParams', function($scope, $http, $location, $routeParams) {
  $scope.deviceExist = false;
  $scope.item = {};
  $scope.new = {};
  $scope.newWIW = {};
  var defaultInstaller = {"device":"","name":"","install_settings":{"bootstrap":true,"fastbootboot":false,"method":"system-image"},"images":[],"buttons":{"bootloader":"","recovery":""},"system_server":{"blacklist":[],"selected":""}}
  var defaultWhatIsWorking = {"Wifi": 0, "Graphics": 0, "Boot": 0, "Rotation": 0, "Cellular Radio": 0, "Bluetooth": 0, "GPS": 0 , "Sound": 0, "Touch": 0, "Camera": 0, "Resume": 0};
  $http.get("/api/device/" + $routeParams.device).then(function(data) {
    if (data.status === 200) {
      $scope.item = data.data.device;
      $scope.deviceExist = true;
      $scope.systemImage = {};
      if (!$scope.item.status) $scope.item.status = 0;
      jsonifyObj();
      ["stable","rc-proposed","devel-proposed"].forEach(function (channel) {
        $http.get("https://system-image.ubports.com/ubuntu-touch/"+channel+"/"+$routeParams.device+"/index.json").then(function (data) {
          var version = 0;
          data.data.images.forEach(function (image) {
            if (image.type === "full"){
              version = image.version > version ? image.version : version;
            }
          });
          $scope.systemImage[channel.replace("-proposed", "")] = version;
        });
      })

    }
  });

  $http.get("/api/installer/"+$routeParams.device).then((data) => {
    if (data.status === 200){
      $scope.installer = data.data;
      $scope.installerExists = true
    }
    else
      $scope.installerExists = false
  })

$scope.createInstaller = () => {
  $scope.installer = defaultInstaller;
  $scope.installer.device = $scope.item.device;
  $scope.installer.name = $scope.item.name;
}

$scope.newImages = {
  remove: function (i) {
    $scope.installer.images.splice(i, 1);
  },
  add: function () {
    if (!$scope.installer.images) $scope.installer.images = {};
    $scope.installer.images.push({
      type: $scope.newImagesItem.type,
      url: $scope.newImagesItem.url,
      checksum: $scope.newImagesItem.checksum
    })
    $scope.newImagesItem = {}
  }
}

$scope.newImagesItem = {}

$scope.aboutDevice = {
  remove: function (i) {
    delete $scope.item.about[i];
  },
  add: function () {
    if (!$scope.item.about) $scope.item.about = {};
    $scope.item.about[$scope.new.item] = $scope.new.text;
  }
}

$scope.whatIsWorking = {
  remove: function (i) {
    delete $scope.item.whatIsWorking[i];
  },
  add: function () {
    if (!$scope.item.whatIsWorking) $scope.item.whatIsWorking = {};
    $scope.item.whatIsWorking[$scope.newWIW.item] = $scope.newWIW.text;
  }
}

  $scope.delete = function() {
    $http.delete("/api/device/all/frasdfvdwdeqwdsafqwrawdsagfhtrjtagr/" + $scope.item.id).then(function() {
      $location.go("/");
    });
  };

  var debounceLoadingF = function () {
    $scope.saved = false;
    $scope.installerSaved = false;
    $scope.$apply();
  }

  var debounceLoading = _.debounce(debounceLoadingF, 1000);

  $scope.installerSave = () => {
    $scope.installerLoadingSave = true;
    if (typeof $scope.installer.system_server.blacklist === "string")
      $scope.installer.system_server.blacklist = $scope.installer.system_server.blacklist.split(",")
    if ($scope.installerExists) {
      $http.put("/api/installer/all/frasdfvdwdeqwdsafqwrawdsagfhtrjtagr/"+$scope.installer.id, $scope.installer).then((data) => {
        if (data.status === 200){
          $scope.installerLoadingSave = false;
          $scope.installerSaved = true;
          debounceLoading();
        }
      })
    }else{
      $http.post("/api/installer/all/frasdfvdwdeqwdsafqwrawdsagfhtrjtagr/", $scope.installer).then((data) => {
        if (data.status === 200){
          $scope.installerExists = true;
          $scope.installerLoadingSave = false;
          $scope.installerSaved = true;
          debounceLoading();
        }
      })
    }
  }

  $scope.save = function() {
    $scope.loadingSave = true;
    if ($scope.deviceExist) {
      httpPut().then(function (data) {
        if (data.status === 200){
          $scope.loadingSave = false;
          $scope.saved = true;
          debounceLoading();
        }
      });
    }else{
      httpPost().then(function (data) {
        if (data.status === 200) {
          $scope.loadingSave = false;
          $scope.saved = true;
          debounceLoading();
          $scope.deviceExist = true;
        }
      })
    }
  };
  var stringifyObj = function () {
    var scopeItem = angular.copy($scope.item);
    scopeItem.about = JSON.stringify(scopeItem.about);
    scopeItem.whatIsWorking = JSON.stringify(scopeItem.whatIsWorking);
    return (scopeItem);
  }
  var jsonifyObj = function () {
    try {
    if (typeof $scope.item.about !== "object") $scope.item.about = JSON.parse($scope.item.about);
  }catch(e){}
    try {
    if (typeof $scope.item.whatIsWorking !== "object") $scope.item.whatIsWorking = JSON.parse($scope.item.whatIsWorking);
  }catch(e){}
    if (typeof $scope.item.about !== "object") $scope.item.about = {};
    if (typeof $scope.item.whatIsWorking !== "object") $scope.item.whatIsWorking = defaultWhatIsWorking;
  }

  var httpPut = function() {
    var i = stringifyObj();
    return $http.put("/api/device/all/frasdfvdwdeqwdsafqwrawdsagfhtrjtagr/" + i.id, i);
  };
  var httpPost = function() {
    var i = stringifyObj();
    return $http.post("/api/device/all/frasdfvdwdeqwdsafqwrawdsagfhtrjtagr/", i);
  };

}]);


app.controller('listCtrl', ['$scope', '$http', '$location', function($scope, $http, $location) {
  $scope.loading = true;
  $http.get("/api/devices/all").then(function(data) {
    $scope.devices = data.data;
    $scope.loading = false;
  });
  $scope.go = function(goto) {
    console.log(goto);
    $location.url("/" + goto);
  }
}]);

app.config(["$routeProvider", function($routeProvider) {
  $routeProvider.when('/new', {
    templateUrl: 'admin/views/new',
    controller: 'newCtrl'
  }).when('/:device', {
    templateUrl: 'admin/views/device',
    controller: 'deviceCtrl'
  }).when('/', {
    templateUrl: 'admin/views/listDevices',
    controller: 'listCtrl'
  }).otherwise({
    rediectTo: '/'
  });
}]);
