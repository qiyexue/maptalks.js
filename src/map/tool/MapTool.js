/**
 * @classdesc
 * <pre>
 * The parent class for all the map tools.
 * It is abstract and not intended to be instantiated.
 * Some interface methods to implement:
 * 1. onAdd: optional, a callback method to do some prepares before enabled when the map tool is added to a map
 * 2. onEnable: optional, called when the map tool is enabled, used to setup the context such as adding more event listeners other than the map, disabling map's default handlers (draggable, scrollWheelZoom, etc) and creating temporary layers.
 * 3. getEvents: required, provide an event map to register event listeners on the map.
 * 4. onDisable: optional, called when the map tool is disabled, used to cleanup such as unregistering event listeners, enable map's original handlers and remove temporary layers.
 * </pre>
 * @class
 * @abstract
 * @category maptool
 * @extends maptalks.Class
 * @mixins maptalks.Eventable
 */
Z.MapTool = Z.Class.extend(/** @lends maptalks.MapTool.prototype */{
    includes: [Z.Eventable],

    /**
     * Adds the map tool to a map.
     * @param {maptalks.Map} map
     * @return {maptalks.MapTool} this
     * @fires maptalks.MapTool#add
     */
    addTo: function (map) {
        if (!map) {
            return this;
        }
        this._map = map;
        var key = '_tool' + this.name;
        if (map[key]) {
            map[key].disable();
        }
        if (this.onAdd) {
            this.onAdd();
        }
        this.enable();
        map[key] = this;

        /**
         * add event.
         *
         * @event maptalks.MapTool#add
         * @type {Object}
         * @property {String} type - add
         * @property {maptalks.MapTool} target - map tool
         */
        this._fireEvent('add');
        return this;
    },

    /**
     * Gets the map it added to.
     * @return {maptalks.Map} map
     */
    getMap:function () {
        return this._map;
    },

    /**
     * Enable the map tool.
     * @return {maptalks.MapTool} this
     * @fires maptalks.MapTool#enable
     */
    enable:function () {
        var map = this._map;
        if (!map || this._enabled) { return this; }
        this._enabled = true;
        this._switchEvents('off');

        this._registerEvents();
        if (this.onEnable) {
            this.onEnable();
        }
        /**
         * enable event.
         *
         * @event maptalks.MapTool#enable
         * @type {Object}
         * @property {String} type - enable
         * @property {maptalks.MapTool} target - map tool
         */
        this._fireEvent('enable');
        return this;
    },

    /**
     * Disable the map tool
     * @return {maptalks.MapTool} this
     * @fires maptalks.MapTool#disable
     */
    disable:function () {
        if (!this._enabled || !this._map) {
            return this;
        }
        this._enabled = false;
        this._switchEvents('off');
        if (this.onDisable) {
            this.onDisable();
        }
        /**
         * disable event.
         *
         * @event maptalks.MapTool#disable
         * @type {Object}
         * @property {String} type - disable
         * @property {maptalks.MapTool} target - map tool
         */
        this._fireEvent('disable');
        return this;
    },

    /**
     * Returns whether the tool is enabled
     * @return {Boolean} true | false
     */
    isEnabled: function () {
        if (!this._enabled) {
            return false;
        }
        return true;
    },

    _registerEvents: function () {
        this._switchEvents('on');
    },

    _switchEvents: function (to) {
        var events = this.getEvents();
        if (events) {
            this._map[to](events, this);
        }
    },

    _fireEvent:function (eventName, param) {
        if (!param) {
            param = {};
        }
        this.fire(eventName, param);
    }
});
