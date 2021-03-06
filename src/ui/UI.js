/**
 * @namespace
 */
Z.ui = {};
/**
 * Some instance methods subclasses needs to implement:  <br>
 *  <br>
 * 1. Optional, returns the Dom element's position offset  <br>
 * function getOffset : maptalks.Point  <br>
 *  <br>
 * 2. Method to create UI's Dom element  <br>
 * function buildOn : HTMLElement  <br>
 *  <br>
 * 3 Optional, to provide an event map to register event listeners.  <br>
 * function getEvents : void  <br>
 * 4 Optional, a callback when dom is removed.  <br>
 * function onDomRemove : void  <br>
 * 5 Optional, a callback when UI Component is removed.  <br>
 * function onRemove : void  <br>
 * @classdesc
 * Base class for all the UI component classes, a UI component is a HTMLElement positioned with geographic coordinate. <br>
 * It is abstract and not intended to be instantiated.
 *
 * @class
 * @category ui
 * @abstract
 * @mixes maptalks.Eventable
 * @memberOf maptalks.ui
 * @name UIComponent
 */
Z.ui.UIComponent = Z.Class.extend(/** @lends maptalks.ui.UIComponent.prototype */{
    includes: [Z.Eventable],

    /**
     * @property {Object} options
     * @property {Boolean} [options.eventsToStop='mousedown dblclick']  - UI's dom events to stop propagation.
     * @property {Number}  [options.dx=0]     - pixel offset on x axis
     * @property {Number}  [options.dy=0]     - pixel offset on y axis
     * @property {Boolean} [options.autoPan=false]  - set it to false if you don't want the map to do panning animation to fit the opened UI.
     * @property {Boolean} [options.single=true]    - whether the UI is a global single one, only one UI will be shown at the same time if set to true.
     */
    options:{
        'eventsToStop' : 'mousedown dblclick',
        'dx'     : 0,
        'dy'     : 0,
        'autoPan' : false,
        'single' : true
    },

    initialize: function (options) {
        Z.Util.setOptions(this, options);
    },

    /**
     * Adds the UI Component to a geometry or a map
     * @param {maptalks.Geometry|maptalks.Map} owner - geometry or map to addto.
     * @returns {maptalks.ui.UIComponent} this
     * @fires maptalks.ui.UIComponent#add
     */
    addTo:function (owner) {
        this._owner = owner;
        /**
         * add event.
         *
         * @event maptalks.ui.UIComponent#add
         * @type {Object}
         * @property {String} type - add
         * @property {maptalks.ui.UIComponent} target - UIComponent
         */
        this.fire('add');
        return this;
    },

    /**
     * Get the map it added to
     * @return {maptalks.Map} map instance
     * @override
     */
    getMap:function () {
        if (this._owner instanceof Z.Map) {
            return this._owner;
        }
        return this._owner.getMap();
    },

    /**
     * Show the UI Component, if it is a global single one, it will close previous one.
     * @param {maptalks.Coordinate} coordinate - coordinate to show
     * @return {maptalks.ui.UIComponent} this
     * @fires maptalks.ui.UIComponent#showstart
     * @fires maptalks.ui.UIComponent#showend
     */
    show: function (coordinate) {
        if (!coordinate) {
            if (this._coordinate) {
                coordinate = this._coordinate;
            } else {
                throw new Error('UI\'s show coordinate is invalid');
            }
        }
        /**
         * showstart event.
         *
         * @event maptalks.ui.UIComponent#showstart
         * @type {Object}
         * @property {String} type - showstart
         * @property {maptalks.ui.UIComponent} target - UIComponent
         */
        this.fire('showstart');
        var map = this.getMap(),
            container = this._getUIContainer();
        if (!this.__uiDOM) {
            this._switchEvents('on');
        }
        this._coordinate = coordinate;
        this._removePrevDOM();
        var dom = this.__uiDOM = this.buildOn(map);
        if (!dom) {
            /**
             * showend event.
             *
             * @event maptalks.ui.UIComponent#showend
             * @type {Object}
             * @property {String} type - showend
             * @property {maptalks.ui.UIComponent} target - UIComponent
             */
            this.fire('showend');
            return this;
        }

        this._measureSize(dom);

        if (this._singleton()) {
            map[this._uiDomKey()] = dom;
        }

        var point = this.getPosition();

        dom.style.position = 'absolute';
        dom.style.left = point.x + 'px';
        dom.style.top  = point.y + 'px';
        dom.style.display = '';

        container.appendChild(dom);

        if (this.options['eventsToStop']) {
            Z.DomUtil.on(dom, this.options['eventsToStop'], Z.DomUtil.stopPropagation);
        }

        //autoPan
        if (this.options['autoPan']) {
            this._autoPan();
        }
        this.fire('showend');
        return this;
    },

    /**
     * Hide the UI Component.
     * @return {maptalks.ui.UIComponent} this
     * @fires maptalks.ui.UIComponent#hide
     */
    hide:function () {
        if (!this.getDOM()) {
            return this;
        }
        this.getDOM().style.display = 'none';
        /**
         * hide event.
         *
         * @event maptalks.ui.UIComponent#hide
         * @type {Object}
         * @property {String} type - hide
         * @property {maptalks.ui.UIComponent} target - UIComponent
         */
        this.fire('hide');
        return this;
    },

    /**
     * Decide whether the ui component is open
     * @returns {Boolean} true|false
     */
    isVisible:function () {
        return this.getDOM() && this.getDOM().style.display !== 'none';
    },

    /**
     * Remove the UI Component
     * @return {maptalks.ui.UIComponent} this
     * @fires maptalks.ui.UIComponent#hide
     * @fires maptalks.ui.UIComponent#remove
     */
    remove: function () {
        this.hide();
        this._switchEvents('off');
        if (this.onRemove) {
            this.onRemove();
        }
        if (!this._singleton() && this.__uiDOM) {
            this._removePrevDOM();
        }
        delete this._owner;
        delete this._map;
        /**
         * remove event.
         *
         * @event maptalks.ui.UIComponent#remove
         * @type {Object}
         * @property {String} type - remove
         * @property {maptalks.ui.UIComponent} target - UIComponent
         */
        this.fire('remove');
        return this;
    },

    /**
     * Get pixel size of the UI Component.
     * @return {maptalks.Size} size
     */
    getSize:function () {
        if (this._size) {
            return this._size.copy();
        } else {
            return null;
        }
    },

    getOwner: function () {
        return this._owner;
    },

    getDOM : function () {
        return this.__uiDOM;
    },

    getPosition : function () {
        var p = this._getViewPoint();
        if (this.getOffset) {
            var o = this.getOffset();
            if (o) { p._add(o); }
        }
        return p;
    },

    _getViewPoint : function () {
        return this.getMap().coordinateToViewPoint(this._coordinate)
                    ._add(this.options['dx'], this.options['dy']);
    },

    _autoPan : function () {
        var map = this.getMap(),
            dom = this.getDOM();
        if (map._moving || map._panAnimating) {
            return;
        }
        var point = new Z.Point(parseInt(dom.style.left), parseInt(dom.style.top));
        var mapSize = map.getSize(),
            mapWidth = mapSize['width'],
            mapHeight = mapSize['height'];

        var containerPoint = map.viewPointToContainerPoint(point);
        var clientWidth = parseInt(dom.clientWidth),
            clientHeight = parseInt(dom.clientHeight);
        var left = 0, top = 0;
        if ((containerPoint.x) < 0) {
            left = -(containerPoint.x - clientWidth / 2);
        } else if ((containerPoint.x + clientWidth - 35) > mapWidth) {
            left = (mapWidth - (containerPoint.x + clientWidth * 3 / 2));
        }
        if (containerPoint.y < 0) {
            top = -containerPoint.y + 50;
        } else if (containerPoint.y > mapHeight) {
            top = (mapHeight - containerPoint.y - clientHeight) - 30;
        }
        if (top !== 0 || left !== 0) {
            map._panAnimation(new Z.Point(left, top), 600);
        }
    },

    /**
     * Measure dom's size
     * @param  {HTMLElement} dom - element to measure
     * @return {maptalks.Size} size
     * @private
     */
    _measureSize:function (dom) {
        var container = this._getUIContainer();
        dom.style.position = 'absolute';
        dom.style.left = -99999 + 'px';
        dom.style.top = -99999 + 'px';
        dom.style.display = '';
        container.appendChild(dom);
        this._size = new Z.Size(dom.clientWidth, dom.clientHeight);
        dom.style.display = 'none';
        return this._size;
    },

    /**
     * Remove previous UI DOM if it has.
     *
     * @private
     */
    _removePrevDOM:function () {
        if (this.onDomRemove) {
            this.onDomRemove();
        }
        if (this._singleton()) {
            var map = this.getMap(),
                key = this._uiDomKey();
            if (map[key]) {
                Z.DomUtil.removeDomNode(map[key]);
                delete map[key];
            }
            delete this.__uiDOM;
        } else if (this.__uiDOM) {
            Z.DomUtil.removeDomNode(this.__uiDOM);
            delete this.__uiDOM;
        }
    },

    /**
     * generate the cache key to store the singletong UI DOM
     * @private
     * @return {String} cache key
     */
    _uiDomKey:function () {
        return '__ui_' + this._getClassName();
    },

    _singleton:function () {
        return this.options['single'];
    },

    _getUIContainer : function () {
        return this.getMap()._panels['ui'];
    },

    _getClassName:function () {
        for (var p in Z.ui) {
            if (Z.ui.hasOwnProperty(p)) {
                if (p === 'UIComponent') {
                    continue;
                }
                if (this instanceof (Z.ui[p])) {
                    return p;
                }
            }
        }
        return null;
    },

    _switchEvents: function (to) {
        var events = this._getDefaultEvents();
        if (this.getEvents) {
            Z.Util.extend(events, this.getEvents());
        }
        if (events) {
            var map = this.getMap();
            for (var p in events) {
                if (events.hasOwnProperty(p)) {
                    map[to](p, events[p], this);
                }
            }
        }
    },

    _getDefaultEvents: function () {
        return {
            'zooming' : this.onZooming,
            'zoomend' : this.onZoomEnd
        };
    },

    onZooming : function (param) {
        if (!this.isVisible() || !this.getDOM()) {
            return;
        }
        var dom = this.getDOM(),
            point = this.getMap().coordinateToViewPoint(this._coordinate),
            matrix = param['matrix']['view'];
        var p = matrix.applyToPointInstance(point)._add(this.options['dx'], this.options['dy']);
        if (this.getOffset) {
            var o = this.getOffset();
            if (o) { p._add(o); }
        }
        dom.style.left = p.x + 'px';
        dom.style.top  = p.y + 'px';
    },

    onZoomEnd : function () {
        if (!this.isVisible() || !this.getDOM()) {
            return;
        }
        var dom = this.getDOM(),
            p = this.getPosition();
        dom.style.left = p.x + 'px';
        dom.style.top  = p.y + 'px';
    }
});
