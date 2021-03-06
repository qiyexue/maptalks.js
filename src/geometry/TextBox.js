/**
 * @classdesc
 * Represents point type geometry for text labels.<br>
 * A label is used to draw text (with a box background if specified) on a particular coordinate.
 * @class
 * @category geometry
 * @extends maptalks.TextMarker
 * @param {String} content                          - TextBox's text content
 * @param {maptalks.Coordinate} coordinates         - center
 * @param {Object} [options=null]                   - construct options, includes options defined in [Marker]{@link maptalks.Marker#options}
 * @param {Boolean} [options.box=true]              - whether to display a background box wrapping the label text.
 * @param {Boolean} [options.boxAutoSize=true]      - whether to set the size of the background box automatically to fit for the label text.
 * @param {Boolean} [options.boxMinWidth=0]         - the minimum width of the background box.
 * @param {Boolean} [options.boxMinHeight=0]        - the minimum height of the background box.
 * @param {Boolean} [options.boxPadding=maptalks.Size(12,8)] - padding of the textBox text to the border of the background box.
 * @param {*} options.* - any other option defined in [maptalks.Marker]{@link maptalks.Marker#options}
 * @example
 * var textBox = new maptalks.TextBox('This is a textBox',[100,0])
 *     .addTo(layer);
 */
Z.TextBox = Z.TextMarker.extend(/** @lends maptalks.TextBox.prototype */{

    /**
     * @property {Object} [options=null]                   - label's options, also including options of [Marker]{@link maptalks.Marker#options}
     * @property {Boolean} [options.boxAutoSize=false]     - whether to set the size of the background box automatically to fit for the label text.
     * @property {Boolean} [options.boxMinWidth=0]         - the minimum width of the background box.
     * @property {Boolean} [options.boxMinHeight=0]        - the minimum height of the background box.
     * @property {Boolean} [options.boxPadding={'width' : 12, 'height' : 8}] - padding of the label text to the border of the background box.
     * @property {*} options.* - any other option defined in [maptalks.Marker]{@link maptalks.Marker#options}
     */
    options: {
        'boxAutoSize'  :   false,
        'boxMinWidth'  :   0,
        'boxMinHeight' :   0,
        'boxPadding'   :   {'width' : 12, 'height' : 8}
    },

    _toJSON:function (options) {
        return {
            'feature' : this.toGeoJSON(options),
            'subType' : 'TextBox',
            'content' : this._content
        };
    },

    _refresh:function () {
        var symbol = this.getSymbol() || this._getDefaultTextSymbol();
        symbol['textName'] = this._content;

        var sizes = this._getBoxSize(symbol),
            boxSize = sizes[0],
            textSize = sizes[1];

        //if no boxSize then use text's size in default
        if (!boxSize && !symbol['markerWidth'] && !symbol['markerHeight']) {
            var padding = this.options['boxPadding'];
            var width = textSize['width'] + padding['width'] * 2,
                height = textSize['height'] + padding['height'] * 2;
            boxSize = new Z.Size(width, height);
            symbol['markerWidth'] = boxSize['width'];
            symbol['markerHeight'] = boxSize['height'];
        }  else if (boxSize) {
            symbol['markerWidth'] = boxSize['width'];
            symbol['markerHeight'] = boxSize['height'];
        }


        var textAlign = symbol['textHorizontalAlignment'];
        if (textAlign) {
            symbol['textDx'] = symbol['markerDx'] || 0;
            if (textAlign === 'left') {
                symbol['textDx'] -= symbol['markerWidth'] / 2;
            } else if (textAlign === 'right') {
                symbol['textDx'] += symbol['markerWidth'] / 2;
            }
        }

        var vAlign = symbol['textVerticalAlignment'];
        if (vAlign) {
            symbol['textDy'] = symbol['markerDy'] || 0;
            if (vAlign === 'top') {
                symbol['textDy'] -= symbol['markerHeight'] / 2;
            } else if (vAlign === 'bottom') {
                symbol['textDy'] += symbol['markerHeight'] / 2;
            }
        }

        this._symbol = symbol;
        this.onSymbolChanged();
    },

    _getInternalSymbol: function () {
        //In TextBox, textHorizontalAlignment's meaning is textAlign in the box which is reversed from original textHorizontalAlignment.
        var textSymbol = Z.Util.extend({}, this._symbol);
        if (textSymbol['textHorizontalAlignment'] === 'left') {
            textSymbol['textHorizontalAlignment'] = 'right';
        } else if (textSymbol['textHorizontalAlignment'] === 'right') {
            textSymbol['textHorizontalAlignment'] = 'left';
        }
        if (textSymbol['textVerticalAlignment'] === 'top') {
            textSymbol['textVerticalAlignment'] = 'bottom';
        } else if (textSymbol['textVerticalAlignment'] === 'bottom') {
            textSymbol['textVerticalAlignment'] = 'top';
        }
        return textSymbol;
    }
});

Z.TextBox.fromJSON = function (json) {
    var feature = json['feature'];
    var textBox = new Z.TextBox(json['content'], feature['geometry']['coordinates'], json['options']);
    textBox.setProperties(feature['properties']);
    textBox.setId(feature['id']);
    return textBox;
};
