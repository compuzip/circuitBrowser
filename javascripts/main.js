'use strict';

// Bootstrap function
angular.element(document).ready(function() {
    angular.bootstrap(angular.element('#main'), [ 'circuitBrowser' ]);
});

// Route Provider
app.config(function ($routeProvider) {
    $routeProvider
        .when('/',
        {
            templateUrl: '/templates/main.html',
            controller: 'CircuitCtrl'
        })
        .when('/cluster/:cluster',
        {
            templateUrl: '/templates/main.html',
            controller: 'CircuitCtrl'
        })
        .otherwise({
            template: "<h1>I'm sorry Dave, I'm afraid I can't do that</h1>"
        })
});
