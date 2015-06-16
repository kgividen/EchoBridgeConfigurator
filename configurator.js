
angular.module('configurator', ['xml'])
    .config(function ($httpProvider) {
        $httpProvider.interceptors.push('xmlHttpInterceptor');
    })

    .service('bridgeService', ["$http", function($http) {
        var bridgeUrl = "http://192.168.111.13:8080/api/devices";
        var self = this;
        this.state = {base: bridgeUrl, devices: [], error: ""};

        this.viewDevices = function() {
            this.state.error = "";
            return $http.get(this.state.base).then(
                function(response) {
                    self.state.devices = response.data[0].content;
                },
                function(error) {
                    if (error.data) {
                        self.state.error = error.data.message;
                    } else {
                        self.state.error = "If you're not seeing any devices, you may be running into problems with CORS. " +
                        "You can work around this by running a fresh launch of Chrome with the --disable-web-security flag.";
                    }
                    console.log(error);
                }
            );
        };

        this.addDevice = function(name, type, onUrl, offUrl) {
            this.state.error = "";
            return $http.post(this.state.base, {name: name, deviceType: type, onUrl: onUrl, offUrl: offUrl}).then(
                function(response) {
                    self.viewDevices();
                },
                function(error) {
                    if (error.data) {
                        self.state.error = error.data.message;
                    }
                    console.log(error);
                }
            );
        };

        this.deleteDevice = function(id) {
            this.state.error = "";
            return $http.delete(this.state.base + "/" + id).then(
                function(response) {
                    self.viewDevices();
                },
                function(error) {
                    if (error.data) {
                        self.state.error = error.data.message;
                    }
                    console.log(error);
                }
            );
        };
    }])

    .service('isyService', ["$http", function($http) {
        $http.defaults.useXDomain = true;
        $http.defaults.withCredentials = true;
        delete $http.defaults.headers.common["X-Requested-With"];
        $http.defaults.headers.common["Accept"] = "application/json";
        $http.defaults.headers.common["Content-Type"] = "application/json";

        this.username = "kgividen";
        this.server = "192.168.111.4";
        this.password = "password";
        this.devices = "";
        var self = this;
        this.getDevices = function (server, username, password) {
            var url = "http://" + username + ":" + password + "@" + server + "/rest/nodes/";

            return $http.get(url).then(
                function(response) {
                    var devicesJSON = response.data;
                    angular.forEach(devicesJSON.nodes.node, function(node) {
                        node.onUrl = url + encodeURIComponent(node.address) + "/cmd/DFON/100";
                        node.offUrl = url + encodeURIComponent(node.address) + "/cmd/DFOF";
                    });
                    self.devices = devicesJSON;
                },
                function(error) {
                    console.log(error);
                }
            );
        };

        this.deleteDevice = function(id) {
            this.state.error = "";
            return $http.delete(this.state.base + "/" + id).then(
                function(response) {
                    self.viewDevices();
                },
                function(error) {
                    if (error.data) {
                        self.state.error = error.data.message;
                    }
                    console.log(error);
                }
            );
        };
    }])

    .controller('ViewingController', ["$scope", "bridgeService", function($scope, bridgeService) {
        bridgeService.viewDevices();
        $scope.bridge = bridgeService.state;
        $scope.deleteDevice = function(device) {
            bridgeService.deleteDevice(device.id);
        };
        $scope.testUrl = function(url) {
            window.open(url, "_blank");
        };
    }])

    .controller('AddingController', ["$scope", "bridgeService", function($scope, bridgeService) {

        $scope.bridge = bridgeService.state;
        $scope.device = {name: "", type: "switch", onUrl: "", offUrl: ""};
        $scope.vera = {base: "http://192.168.1.144:3480", id: 1};

        $scope.buildUrls = function() {
            $scope.device.onUrl = $scope.vera.base
            + "/data_request?id=action&output_format=json&serviceId=urn:upnp-org:serviceId:SwitchPower1&action=SetTarget&newTargetValue=1&DeviceNum="
            + $scope.vera.id;
            $scope.device.offUrl = $scope.vera.base
            + "/data_request?id=action&output_format=json&serviceId=urn:upnp-org:serviceId:SwitchPower1&action=SetTarget&newTargetValue=0&DeviceNum="
            + $scope.vera.id;
        };

        $scope.testUrl = function(url) {
            window.open(url, "_blank");
        };

        $scope.addDevice = function() {
            bridgeService.addDevice($scope.device.name, $scope.device.type, $scope.device.onUrl, $scope.device.offUrl).then(
                function() {
                    $scope.device.name = "";
                    $scope.device.onUrl = "";
                    $scope.device.offUrl = "";
                },
                function(error) {
                    console.log(error);
                }
            );
        }

    }])

    .controller('ISYController', ["$scope", "isyService", "bridgeService", function($scope, isyService, bridgeService) {
        $scope.isy = isyService;
        $scope.devices = isyService.devices;
        $scope.getDevices = function(){
            isyService.getDevices($scope.isy.server, $scope.isy.username, $scope.isy.password);
        };

        $scope.testUrl = function(url) {
            window.open(url, "_blank");
        };

        $scope.addDevice = function(device) {
            //Hardcode type for now since we only support switches.
            var type= "switch";
            bridgeService.addDevice(device.name, type, device.onUrl, device.offUrl);
        };
    }])

    .controller('ErrorsController', ["$scope", "bridgeService", function($scope, bridgeService) {
        $scope.bridge = bridgeService.state;
    }]);