'use strict';

// The main circuitBrowser module.  We group controllers and factories using the alternative
// approach described by @johnlindquist
var app = angular.module('circuitBrowser', ['restangular', 'ui.bootstrap', 'ngGrid']);

var circuitBrowserModule = { controllers: {}, factories: {} };

// Filters
app.filter('bandwidth', function () {
    return function (raw) {
        if (raw > 1000000000000) {
            return raw / 1000000000000 + ' T';
        } else if (raw > 1000000000) {
            return raw / 1000000000 + ' G';
        } else if (raw > 1000000) {
            return raw / 1000000 + ' M';
        } else if (raw > 1000) {
            return raw / 1000 + ' K';
        } else {
            return raw;
        }
    }
})

// Location Provider
app.config(function ($locationProvider) {
    $locationProvider.html5Mode(true)
});

// Directives
app.directive("circuitinfo", function () {
    return {
        restrict: 'E',
        templateUrl: '/circuitBrowser/templates/Ecircuitinfo.html',
        scope: { data: '=' }
    }
});

app.directive("clusterinfo", function () {
    return {
        restrict: 'E',
        templateUrl: '/circuitBrowser/templates/Eclusterinfo.html',
        scope: { data: '=' }
    }
});

// Services
circuitBrowserModule.factories.LookupRestangular = function (Restangular) {
    return Restangular.withConfig(function (RestangularConfigurer) {
        RestangularConfigurer.setBaseUrl('/lookup/');
    });
};

// Configuration provider
app.provider('circuitBrowserConfig', function () {
    this.itemIsCircuit = function (item) {
        return false;
    };

    this.itemIsCluster = function (item) {
        return false;
    }

    this.clusterGridColumns = [
        {displayName: "Cluster ID", field: "clusterId"},
        {displayName: "Cluster Name", field: "clusterName"}
    ];

    this.circuitGridColumns = [
        {displayName: "Circuit ID", field: "circuitId"},
        {displayName: "Circuit Name", field: "circuitName"}
    ]

    this.accountGridColumns = [
        {displayName: "Account ID", field: "accountId"},
        {displayName: "Account Name", field: "accountName"}
    ];

    this.popGridColumns = [
        {displayName: "POP ID", field: "popId"},
        {displayName: "POP Name", field: "popName"}
    ];

    this.dataProviders = {
        accounts: {
            id: 'accountId',
            label: 'accountName'
        },
        pops: {
            id: 'popId',
            label: 'popName'
        },
        circuits: {
            id: 'circuitId',
            upstream: 'upstreamId',
            downstream: 'downstreamId'
        }
    };

    this.templates = {
        account: '/circuitBrowser/templates/account.html',
        datacenter: '/circuitBrowser/templates/datacenter.html'
    };

    this.clusterName = 'cluster';

    this.circuitElementId = "circuitViewer"

    this.$get = function () {
        return {
            itemIsCircuit: this.itemIsCircuit,
            itemIsCluster: this.itemIsCluster,
            clusterGridColumns: this.clusterGridColumns,
            circuitGridColumns: this.circuitGridColumns,
            accountGridColumns: this.accountGridColumns,
            popGridColumns: this.popGridColumns,
            dataProviders: this.dataProviders,
            templates: this.templates,
            clusterName: this.clusterName,
            circuitElementId: this.circuitElementId
        };
    };
});

// Controllers

/**
 * AccountViewCtrl
 *
 * This displays more detailed account information as a modal.  Invoked from the main circuit browser.
 *
 * @param $scope
 * @param circuitBrowserConfig
 * @param LookupRestangular
 * @param dialog
 * @param account
 * @constructor
 */
circuitBrowserModule.controllers.AccountViewCtrl = function ($scope, circuitBrowserConfig, LookupRestangular, dialog, account) {
    $scope.account = account;
    $scope.data = {};
    $scope.selectedItem = {};

    $scope.itemIsCluster = circuitBrowserConfig.itemIsCluster;
    $scope.itemIsCircuit = circuitBrowserConfig.itemIsCircuit;

    $scope.clusterGrid = { data: 'data.clusters',
        multiSelect: false,
        keepLastSelected: false,
        columnDefs: circuitBrowserConfig.clusterGridColumns,
        afterSelectionChange: function () {
            $scope.selectedItem = this.entity;
        }
    };

    $scope.circuitGrid = { data: 'data.circuits',
        multiSelect: false,
        keepLastSelected: false,
        columnDefs: circuitBrowserConfig.circuitGridColumns,
        afterSelectionChange: function () {
            $scope.selectedItem = this.entity;
        }
    };

    // The basic account info is pulled in, this is to get more details
    var lookupPromise = LookupRestangular.one('accountInfo').get({accountId: account[circuitBrowserConfig.dataProviders.accounts.id]});

    lookupPromise.then(function (data) {
        $scope.data = data;
    });

    $scope.close = function (result) {
        dialog.close(result);
    };
};

/**
 * PopViewCtrl
 *
 * This displays more detailed POP information as a modal.  Invoked from the main circuit browser.
 *
 * @param $scope
 * @param circuitBrowserConfig
 * @param LookupRestangular
 * @param dialog
 * @param pop
 * @constructor
 */
circuitBrowserModule.controllers.PopViewCtrl = function ($scope, circuitBrowserConfig, LookupRestangular, dialog, pop) {
    $scope.pop = pop;
    $scope.data = {};
    $scope.selectedItem = {};

    $scope.itemIsCluster = circuitBrowserConfig.itemIsCluster;
    $scope.itemIsCircuit = circuitBrowserConfig.itemIsCircuit;

    $scope.clusterGrid = { data: 'data.clusters',
        multiSelect: false,
        keepLastSelected: false,
        columnDefs: circuitBrowserConfig.clusterGridColumns,
        afterSelectionChange: function () {
            $scope.selectedItem = this.entity;
        }
    };

    $scope.circuitGrid = { data: 'data.circuits',
        multiSelect: false,
        keepLastSelected: false,
        columnDefs: circuitBrowserConfig.circuitGridColumns,
        afterSelectionChange: function () {
            $scope.selectedItem = this.entity;
        }
    };

    // The basic pop info is pulled in, this is to get more details
    var lookupPromise = LookupRestangular.one('popInfo').get({popId: pop[circuitBrowserConfig.dataProviders.pops.id]});

    lookupPromise.then(function (data) {
        $scope.data = data;
    });

    $scope.close = function (result) {
        dialog.close(result);
    };
};

/**
 * This is the main controller for viewing circuits
 *
 * @param $scope
 * @param $dialog
 * @param $routeParams
 * @param circuitBrowserConfig
 * @param LookupRestangular
 * @constructor
 */
circuitBrowserModule.controllers.CircuitCtrl = function ($scope, $dialog, $routeParams, circuitBrowserConfig, LookupRestangular) {
    // Layers for our shapes
    $scope.popIspShapes = {};
    $scope.circuitLines = {};
    $scope.circuitLinesByCircuitId = {};

    $scope.data = {};
    $scope.clusterLookup = {};

    $scope.accountById = function (id) {
        for (var i in $scope.data.accounts) {
            if ($scope.data.accounts[i][circuitBrowserConfig.dataProviders.accounts.id] === id) {
                return $scope.data.accounts[i];
            }
        }
    }

    $scope.popById = function (id) {
        for (var i in $scope.data.pops) {
            if ($scope.data.pops[i][circuitBrowserConfig.dataProviders.pops.id] === id) {
                return $scope.data.pops[i];
            }
        }
    }

    $scope.circuitViewerElement = angular.element('#' + circuitBrowserConfig.circuitElementId);

    $scope.accountGrid = { data: 'data.accounts',
        multiSelect: false,
        keepLastSelected: false,
        columnDefs: circuitBrowserConfig.accountGridColumns,
        rowTemplate: "<div ng-mouseover=\"popIspIn(row.getProperty('" + circuitBrowserConfig.dataProviders.accounts.id + "'))\" ng-mouseout=\"popIspOut(row.getProperty('" + circuitBrowserConfig.dataProviders.accounts.id + "'))\" ng-style=\"{ 'cursor': row.cursor }\" ng-repeat=\"col in renderedColumns\" ng-class=\"col.colIndex()\" class=\"ngCell {{col.cellClass}}\"><div class=\"ngVerticalBar\" ng-style=\"{height: rowHeight}\" ng-class=\"{ ngVerticalBarVisible: !$last }\">&nbsp;</div><div ng-cell></div></div>"
    };

    $scope.popGrid = { data: 'data.pops',
        multiSelect: false,
        keepLastSelected: false,
        columnDefs: circuitBrowserConfig.popGridColumns,
        rowTemplate: "<div ng-mouseover=\"popIspIn(row.getProperty('" + circuitBrowserConfig.dataProviders.pops.id + "'))\" ng-mouseout=\"popIspOut(row.getProperty('" + circuitBrowserConfig.dataProviders.pops.id + "'))\" ng-style=\"{ 'cursor': row.cursor }\" ng-repeat=\"col in renderedColumns\" ng-class=\"col.colIndex()\" class=\"ngCell {{col.cellClass}}\"><div class=\"ngVerticalBar\" ng-style=\"{height: rowHeight}\" ng-class=\"{ ngVerticalBarVisible: !$last }\">&nbsp;</div><div ng-cell></div></div>"
    };

    $scope.circuitGrid = { data: 'data.circuits',
        multiSelect: false,
        keepLastSelected: false,
        columnDefs: circuitBrowserConfig.circuitGridColumns,
        rowTemplate: "<div ng-mouseover=\"popCircuitIn(row.getProperty('" + circuitBrowserConfig.dataProviders.circuits.id + "'))\" ng-mouseout=\"popCircuitOut(row.getProperty('" + circuitBrowserConfig.dataProviders.circuits.id + "'))\" ng-style=\"{ 'cursor': row.cursor }\" ng-repeat=\"col in renderedColumns\" ng-class=\"col.colIndex()\" class=\"ngCell {{col.cellClass}}\"><div class=\"ngVerticalBar\" ng-style=\"{height: rowHeight}\" ng-class=\"{ ngVerticalBarVisible: !$last }\">&nbsp;</div><div ng-cell></div></div>"
    };

    $scope.clusterGrid = { data: 'data.clusters',
        multiSelect: false,
        keepLastSelected: false,
        columnDefs: circuitBrowserConfig.clusterGridColumns,
    };

    $scope.popIspIn = function (unique) {
        $scope.popIspShapes[unique].setFill('#DEF5FC');
        $scope.popIspLayer.draw();
    }

    $scope.popIspOut = function (unique) {
        $scope.popIspShapes[unique].setFill('#ddd');
        $scope.popIspLayer.draw();
    }

    $scope.popCircuitIn = function (circuitOrLineId) {
        var upDown = circuitOrLineId.split('_');
        var circuit;

        if (upDown.length === 2) {
            circuit = $scope.circuitLines[circuitOrLineId];
        } else {
            circuit = $scope.circuitLinesByCircuitId[circuitOrLineId];
            upDown = circuit.getId().split('_');
        }

        if (upDown[0] === upDown[1]) {
            // Crossconnect within POP
            $scope.popIspShapes[upDown[0]].setFill('#DEF5FC');
            $scope.popIspLayer.draw();
        } else {
            circuit.setStroke('red');
            $scope.lineLayer.draw();
        }
    }

    $scope.popCircuitOut = function (circuitOrLineId) {
        var upDown = circuitOrLineId.split('_');
        var circuit;

        if (upDown.length === 2) {
            circuit = $scope.circuitLines[circuitOrLineId];
        } else {
            circuit = $scope.circuitLinesByCircuitId[circuitOrLineId];
            upDown = circuit.getId().split('_');
        }

        if (upDown[0] === upDown[1]) {
            // Crossconnect within POP
            $scope.popIspShapes[upDown[0]].setFill('#ddd');
            $scope.popIspLayer.draw();
        } else {
            circuit.setStroke('blue');
            $scope.lineLayer.draw();
        }
    }

    $scope.clearAllObjects = function (clearSearcher) {
        $scope.popIspShapes = {};
        $scope.circuitLines = {};
        $scope.circuitLinesByCircuitId = {};

        if (clearSearcher) {
            $scope.clusterLookup = {};
        }

        if ($scope.stage) {
            $scope.popIspLayer.destroyChildren();
            $scope.lineLayer.destroyChildren();

            $scope.popIspLayer.draw();
            $scope.lineLayer.draw();
        }

        $scope.data = {};
    }

    $scope.prepareStage = function () {
        $scope.stage = new Kinetic.Stage({
            container: circuitBrowserConfig.circuitElementId,
            width: $scope.circuitViewerElement.width(),
            height: $scope.circuitViewerElement.height()
        });

        $scope.lineLayer = new Kinetic.Layer();
        $scope.popIspLayer = new Kinetic.Layer();

        $scope.stage.add($scope.lineLayer);
        $scope.stage.add($scope.popIspLayer);
    }

    $scope.loadCluster = function (clusterLookup) {
        $scope.clearAllObjects(false);

        var lookupPromise = LookupRestangular.one(clusterLookup.searchParam).get();

        lookupPromise.then(function (data) {
            $scope.data = data;

            $scope.myData = data.pops;

            var canvasSize = $scope.circuitViewerElement.width();
            var hBuffer = 20;
            var vBuffer = 30;

            var elementHeight = 80;
            var elementWidth = (canvasSize / Math.max(data.pops.length, data.accounts.length)) - hBuffer - hBuffer;

            if (!$scope.stage) {
                $scope.prepareStage();
            }

            // Draw Accounts
            for (var i = 0; i < data.accounts.length; i++) {
                var accountGroup = new Kinetic.Group({
                    draggable: false,
                    id: data.accounts[i][circuitBrowserConfig.dataProviders.accounts.id]
                });

                var accountLabel = new Kinetic.Text({
                    x: (data.accounts.length < data.pops.length) ?
                        (canvasSize * ((i + 1) / (data.accounts.length + 1))) - (elementWidth / 2) :
                        hBuffer + (i * (hBuffer + elementWidth + hBuffer)),
                    y: vBuffer,
                    text: data.accounts[i][circuitBrowserConfig.dataProviders.accounts.label],
                    fontSize: 12,
                    fontFamily: 'Calibri',
                    fill: '#555',
                    width: elementWidth,
                    height: elementHeight,
                    padding: 20,
                    align: 'center',
                    listening: false
                });

                var accountRect = new Kinetic.Rect({
                    x: (data.accounts.length < data.pops.length) ?
                        (canvasSize * ((i + 1) / (data.accounts.length + 1))) - (elementWidth / 2) :
                        hBuffer + (i * (hBuffer + elementWidth + hBuffer)),
                    y: vBuffer,
                    stroke: '#FFA245',
                    strokeWidth: 5,
                    fill: '#ddd',
                    width: elementWidth,
                    height: elementHeight,
                    shadowColor: 'black',
                    shadowBlur: 10,
                    shadowOffset: [10, 10],
                    shadowOpacity: 0.2,
                    cornerRadius: 10
                });

                accountGroup.add(accountRect);
                accountGroup.add(accountLabel);

                $scope.popIspShapes[data.accounts[i][circuitBrowserConfig.dataProviders.accounts.id]] = accountRect;

                accountGroup.on('mouseover', function () {
                    $scope.popIspIn(this.attrs.id);
                });
                accountGroup.on('mouseout', function () {
                    $scope.popIspOut(this.attrs.id);
                });
                accountGroup.on('click', function () {
                    var account = $scope.accountById(this.getId());

                    $scope.$apply(function () {
                        var d = $dialog.dialog({
                            backdrop: true,
                            keyboard: true,
                            backdropClick: true,
                            templateUrl: circuitBrowserConfig.templates.account,
                            controller: 'AccountViewCtrl',
                            dialogClass: 'modal modal-large',
                            resolve: {account: function () {
                                return angular.copy(account);
                            } }
                        });
                        d.open().then(function (result) {
                            if (result) {
                                // Meh, nothing atm
                            }
                        });
                    })
                });

                // Add the group to the layer
                $scope.popIspLayer.add(accountGroup);
            }

            // Draw POPs
            for (var i = 0; i < data.pops.length; i++) {
                var popGroup = new Kinetic.Group({
                    draggable: false,
                    id: data.pops[i][circuitBrowserConfig.dataProviders.pops.id]
                });

                var popLabel = new Kinetic.Text({
                    x: (data.accounts.length > data.pops.length) ?
                        (canvasSize * ((i + 1) / (data.pops.length + 1))) - (elementWidth / 2) :
                        hBuffer + (i * (hBuffer + elementWidth + hBuffer)),
                    y: $scope.stage.getHeight() - elementHeight - vBuffer,
                    text: data.pops[i].NAME,
                    fontSize: 12,
                    fontFamily: 'Calibri',
                    fill: '#555',
                    width: elementWidth,
                    height: elementHeight,
                    padding: 20,
                    align: 'center',
                    listening: false
                });

                var popRect = new Kinetic.Rect({
                    x: (data.accounts.length > data.pops.length) ?
                        (canvasSize * ((i + 1) / (data.pops.length + 1))) - (elementWidth / 2) :
                        hBuffer + (i * (hBuffer + elementWidth + hBuffer)),
                    y: $scope.stage.getHeight() - elementHeight - vBuffer,
                    stroke: '#6DBFF2',
                    strokeWidth: 5,
                    fill: '#ddd',
                    width: elementWidth,
                    height: elementHeight,
                    shadowColor: 'black',
                    shadowBlur: 10,
                    shadowOffset: [10, 10],
                    shadowOpacity: 0.2,
                    cornerRadius: 10
                });

                popGroup.add(popRect);
                popGroup.add(popLabel);

                $scope.popIspShapes[data.pops[i][circuitBrowserConfig.dataProviders.pops.id]] = popRect;

                popGroup.on('mouseover', function () {
                    $scope.popIspIn(this.attrs.id);
                });
                popGroup.on('mouseout', function () {
                    $scope.popIspOut(this.attrs.id);
                });
                popGroup.on('click', function () {
                    var pop = $scope.popById(this.getId());

                    $scope.$apply(function () {
                        var d = $dialog.dialog({
                            backdrop: true,
                            keyboard: true,
                            backdropClick: true,
                            templateUrl: circuitBrowserConfig.templates.datacenter,
                            controller: 'PopViewCtrl',
                            dialogClass: 'modal modal-large',
                            resolve: {pop: function () {
                                return angular.copy(pop);
                            } }
                        });
                        d.open().then(function (result) {
                            if (result) {
                                // Meh, nothing atm
                            }
                        });
                    });
                });

                // add the shape to the layer
                $scope.popIspLayer.add(popGroup);
            }

            // Draw circuit lines
            for (var i = 0; i < data.circuits.length; i++) {
                var circuit = data.circuits[i];
                var down = null;
                var up = null;
                var rectDown = null;
                var rectUp = null;

                if (circuit[circuitBrowserConfig.dataProviders.circuits.downstream]) {
                    down = circuit[circuitBrowserConfig.dataProviders.circuits.downstream];
                }

                if (circuit[circuitBrowserConfig.dataProviders.circuits.upstream]) {
                    up = circuit[circuitBrowserConfig.dataProviders.circuits.upstream]
                }

                if (down && up) {
                    var lineId = down + '_' + up;

                    if (!$scope.circuitLines.hasOwnProperty(lineId)) {
                        $scope.circuitLines[lineId] = new Kinetic.Line({
                            id: lineId,
                            stroke: 'blue',
                            strokeWidth: 1,
                            points: [
                                {
                                    x: $scope.popIspShapes[down].getX() + $scope.popIspShapes[down].getWidth() / 2,
                                    y: $scope.popIspShapes[down].getY() + $scope.popIspShapes[down].getHeight() / 2
                                },
                                {
                                    x: $scope.popIspShapes[up].getX() + $scope.popIspShapes[up].getWidth() / 2,
                                    y: $scope.popIspShapes[up].getY() + $scope.popIspShapes[up].getHeight() / 2
                                }
                            ]
                        });

                        $scope.circuitLines[lineId].on('mouseover', function () {
                            $scope.popCircuitIn(this.attrs.id);
                        });

                        $scope.circuitLines[lineId].on('mouseout', function () {
                            $scope.popCircuitOut(this.attrs.id);
                        });

                        $scope.lineLayer.add($scope.circuitLines[lineId]);
                    } else {
                        $scope.circuitLines[lineId].setStrokeWidth($scope.circuitLines[lineId].getStrokeWidth() + 1);
                    }

                    $scope.circuitLinesByCircuitId[circuit[circuitBrowserConfig.dataProviders.circuits.id]] = $scope.circuitLines[lineId];
                }
            }

            $scope.lineLayer.draw();
            $scope.popIspLayer.draw();
        });

    }

    if ($routeParams.hasOwnProperty(circuitBrowserConfig.clusterName)) {
        $scope.clusterLookup.searchParam = $routeParams[circuitBrowserConfig.clusterName];
        $scope.loadCluster($scope.clusterLookup);
    }
}

app.controller(circuitBrowserModule.controllers);
app.factory(circuitBrowserModule.factories);
