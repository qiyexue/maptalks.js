/**
 * @classdesc
 * A map tool to help measure area on the map
 * @class
 * @category maptool
 * @extends maptalks.DistanceTool
 * @param {options} [options=null] - construct options
 * @param {String} [options.language=zh-CN]         - language of the distance tool, zh-CN or en-US
 * @param {Boolean} [options.metric=true]           - display result in metric system
 * @param {Boolean} [options.imperial=false]        - display result in imperial system.
 * @param {Object}  [options.symbol=null]           - symbol of the line
 * @param {Object}  [options.vertexSymbol=null]     - symbol of the vertice
 * @param {Object}  [options.labelOptions=null]     - construct options of the vertice labels.
 * @example
 * var areaTool = new maptalks.AreaTool({
 *     'once' : true,
 *     'symbol': {
 *       'lineColor' : '#34495e',
 *       'lineWidth' : 2
 *     },
 *     'vertexSymbol' : {
 *       'markerType'        : 'ellipse',
 *       'markerFill'        : '#1bbc9b',
 *       'markerLineColor'   : '#000',
 *       'markerLineWidth'   : 3,
 *       'markerWidth'       : 10,
 *      'markerHeight'      : 10
 *    },
 *    'language' : 'en-US'
 *  }).addTo(map);
 */
Z.AreaTool = Z.DistanceTool.extend(/** @lends maptalks.AreaTool.prototype */{
    /**
     * @property {options} options
     * @property {String}  options.language         - language of the distance tool, zh-CN or en-US
     * @property {Boolean} options.metric           - display result in metric system
     * @property {Boolean} options.imperial         - display result in imperial system.
     * @property {Object}  options.symbol           - symbol of the line
     * @property {Object}  options.vertexSymbol     - symbol of the vertice
     * @property {Object}  options.labelOptions     - construct options of the vertice labels.
     */
    options:{
        'mode' : 'Polygon',
        'symbol' : {
            'lineColor':'#000000',
            'lineWidth':2,
            'lineOpacity':1,
            'lineDasharray': '',
            'polygonFill' : '#ffffff',
            'polygonOpacity' : 0.5
        }
    },

    initialize: function (options) {
        Z.Util.setOptions(this, options);
        this.on('enable', this._afterEnable, this)
            .on('disable', this._afterDisable, this);
        this._measureLayers = [];
    },

    _measure:function (toMeasure) {
        var map = this.getMap();
        var area;
        if (toMeasure instanceof Z.Geometry) {
            area = map.computeGeometryArea(toMeasure);
        } else if (Z.Util.isArray(toMeasure)) {
            area = Z.GeoUtil._computeArea(toMeasure, map.getProjection());
        }
        this._lastMeasure = area;
        var units;
        if (this.options['language'] === 'zh-CN') {
            units = [' 平方米', ' 平方公里', ' 平方英尺', ' 平方英里'];
        } else {
            units = [' sq.m', ' sq.km', ' sq.ft', ' sq.mi'];
        }
        var content = '';
        if (this.options['metric']) {
            content += area < 1E6 ? area.toFixed(0) + units[0] : (area / 1E6).toFixed(2) + units[1];
        }
        if (this.options['imperial']) {
            area *= 3.2808399;
            if (content.length > 0) {
                content += '\n';
            }
            var sqmi = 5280 * 5280;
            content += area < sqmi ? area.toFixed(0) + units[2] : (area / sqmi).toFixed(2) + units[3];
        }
        return content;
    },

    _msOnDrawVertex:function (param) {
        var vertexMarker = new maptalks.Marker(param['coordinate'], {
            'symbol' : this.options['vertexSymbol']
        }).addTo(this._measureMarkerLayer);

        this._lastVertex = vertexMarker;
    },

    _msOnDrawEnd:function (param) {
        this._clearTailMarker();

        var ms = this._measure(param['geometry']);
        var endLabel = new maptalks.Label(ms, param['coordinate'], this.options['labelOptions'])
                        .addTo(this._measureMarkerLayer);
        var size = endLabel.getSize();
        if (!size) {
            size = new Z.Size(10, 10);
        }
        this._addClearMarker(param['coordinate'], size['width']);
        var geo = param['geometry'].copy();
        geo.addTo(this._measureLineLayer);
        this._lastMeasure = geo.getArea();
    }
});
