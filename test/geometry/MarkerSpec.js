describe('#Marker', function() {

    var container;
    var map;
    var tile;
    var center = new Z.Coordinate(118.846825, 32.046534);
    var canvasContainer;
    var layer;

    beforeEach(function() {
        var setups = commonSetupMap(center);
        container = setups.container;
        map = setups.map;
        canvasContainer = map._panels.mapPlatform;
        layer = new maptalks.VectorLayer('v').addTo(map);
    });

    afterEach(function() {
        map.removeLayer('v');
        layer = null;
        removeContainer(container)
    });

    it('setCoordinates', function() {
        var marker = new maptalks.Marker([0, 0]);
        marker.setCoordinates([1, 1]);
        expect(marker.getCoordinates().toArray()).to.be.eql([1, 1]);
    });

    it('getCenter', function() {
        var marker = new maptalks.Marker({x: 0, y: 0});
        expect(marker.getCenter().toArray()).to.be.eql([0, 0]);
    });

    it('getExtent', function() {
        var marker = new maptalks.Marker({x: 0, y: 0});

        expect(marker.getExtent().toJSON()).to.be.eql({xmin : 0, xmax : 0, ymin : 0, ymax : 0});

    });

    it('getSize', function() {
        var marker = new maptalks.Marker(map.getCenter());
        layer.addGeometry(marker);
        var size = marker.getSize();

        expect(size.width).to.be.above(0);
        expect(size.height).to.be.above(0);
    });

    it('show/hide/isVisible', function() {
        var marker = new maptalks.Marker({x: 0, y: 0});
        layer.addGeometry(marker);
        marker.show();
        marker.hide();
        expect(marker.isVisible()).not.to.be.ok();
    });

    it('remove', function() {
        var marker = new maptalks.Marker({x: 0, y: 0});
        layer.addGeometry(marker);
        marker.remove();

        expect(marker.getLayer()).to.be(null);
    });

    describe("symbol", function() {

        beforeEach(function() {
            layer = new Z.VectorLayer('id', {'drawImmediate' : true});
            map.addLayer(layer);
        });

        afterEach(function() {
            map.removeLayer(layer);
        });

        it("can be icon", function() {
            var marker = new Z.Marker(center, {
                symbol: {
                    markerFile: Z.prefix + 'images/control/2.png',
                    markerWidth: 30,
                    markerHeight: 22
                }
            });

            expect(function () {
                layer.addGeometry(marker);
            }).to.not.throwException();
        });

        it("can be text", function() {
            var marker = new Z.Marker(center, {
                symbol: {
                    textName: 'texxxxxt',
                    textFaceName: 'monospace'
                }
            });

            expect(function () {
                layer.addGeometry(marker);
            }).to.not.throwException();
        });


        it("can be vector", function() {
            var types = ['ellipse', 'triangle', 'cross', 'diamond', 'square', 'x', 'bar'];

            expect(function () {
                for(var i = 0; i < types.length; i++) {
                    var marker = new Z.Marker(center, {
                        symbol: {
                            markerType: types[i],
                            markerLineDasharray: [20, 10, 5, 5, 5, 10]
                        }
                    });
                    layer.addGeometry(marker);
                }
            }).to.not.throwException();
        });

    });

    describe('set marker\'s Symbol', function() {

        it('fires symbolchange event', function() {
            var spy = sinon.spy();
            var marker = new Z.Marker(center);
            marker.on('symbolchange', spy);
            marker.setSymbol({
                'markerType' : 'ellipse',
                'markerLineColor': '#ff0000',
                'markerFill': '#ffffff',
                'markerFillOpacity': 0.6,
                'markerHeight' : 8,
                'markerWidth' : 8
            });

            expect(spy.called).to.be.ok();
        });

        it('unsuppored markerType', function() {
            var layer = new maptalks.VectorLayer('vector', {'drawImmediate' : true});
            map.addLayer(layer);
            var marker = new maptalks.Marker(map.getCenter(), {
                symbol:{
                    "markerType" : "unsupported",
                    "markerWidth":20,
                    "markerHeight":30
                }
            });
            expect(function() {
                layer.addGeometry(marker);
            }).to.throwException();
        });

    });

    describe('events', function() {
        it('canvas events', function() {
            var vector = new Z.Marker(center);
            new GeoEventsTester().testCanvasEvents(vector, map, vector.getCenter());
        });
    });

    it('can have various symbols',function(done) {
        var vector = new Z.Marker(center);
        GeoSymbolTester.testGeoSymbols(vector, map, done);
    });

    it("Marker._containsPoint", function() {

        var geometry = new Z.Marker(center, {
            symbol: {
                markerFile : Z.prefix + 'images/control/2.png',
                markerHeight : 30,
                markerWidth : 22,
                dx : 0,
                dy : 0
            }
        });
        layer = new Z.VectorLayer('id');
        map.addLayer(layer);
        layer.addGeometry(geometry);

        var spy = sinon.spy();
        geometry.on('click', spy);
        //TODO 因为marker的width和height为0, 所以无法击中
        happen.click(canvasContainer, {
            clientX: 400 + 8,
            clientY: 300 + 8
        });

        //expect(spy.called).to.be.ok();
    });

});
