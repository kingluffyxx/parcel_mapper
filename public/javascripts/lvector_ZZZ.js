/*
/*
 Copyright (c) 2013 - 2015, Jason Sanford
 Leaflet Vector Layers is a library for showing geometry objects
 from multiple geoweb services in a Leaflet map
*/
(function(a) {
    a.lvector = {
        VERSION: "1.6.0",
        noConflict: function() {
            a.lvector = this._originallvector;
            return this
        },
        _originallvector: a.lvector
    }
})(this);
lvector.Layer = L.Class.extend({
    options: {
        fields: "",
        scaleRange: null,
        map: null,
        uniqueField: null,
        visibleAtScale: !0,
        dynamic: !1,
        autoUpdate: !1,
        autoUpdateInterval: null,
        popupTemplate: null,
        popupOptions: {},
        singlePopup: !1,
        symbology: null,
        showAll: !1
    },
    initialize: function(a) {
        L.Util.setOptions(this, a)
    },
    setMap: function(a) {
        if (!a || !this.options.map)
            if (a) {
                this.options.map = a;
                if (this.options.scaleRange && this.options.scaleRange instanceof Array && this.options.scaleRange.length === 2) {
                    var a = this.options.map.getZoom(),
                        b = this.options.scaleRange;
                    this.options.visibleAtScale = a >= b[0] && a <= b[1]
                }
                this._show()
            } else if (this.options.map) this._hide(), this.options.map = a
    },
    getMap: function() {
        return this.options.map
    },
    setOptions: function() {},
    _show: function() {
        this._addIdleListener();
        this.options.scaleRange && this.options.scaleRange instanceof Array && this.options.scaleRange.length === 2 && this._addZoomChangeListener();
        if (this.options.visibleAtScale) {
            if (this.options.autoUpdate && this.options.autoUpdateInterval) {
                var a = this;
                this._autoUpdateInterval = setInterval(function() {
                        a._getFeatures()
                    },
                    this.options.autoUpdateInterval)
            }
            this.options.map.fire("moveend").fire("zoomend")
        }
    },
    _hide: function() {
        this._idleListener && this.options.map.off("moveend", this._idleListener);
        this._zoomChangeListener && this.options.map.off("zoomend", this._zoomChangeListener);
        this._autoUpdateInterval && clearInterval(this._autoUpdateInterval);
        this._clearFeatures();
        this._lastQueriedBounds = null;
        if (this._gotAll) this._gotAll = !1
    },
    _hideVectors: function() {
        for (var a = 0; a < this._vectors.length; a++) {
            if (this._vectors[a].vector)
                if (this.options.map.removeLayer(this._vectors[a].vector),
                    this._vectors[a].popup) this.options.map.removeLayer(this._vectors[a].popup);
                else if (this.popup && this.popup.associatedFeature && this.popup.associatedFeature == this._vectors[a]) this.options.map.removeLayer(this.popup), this.popup = null;
            if (this._vectors[a].vectors && this._vectors[a].vectors.length)
                for (var b = 0; b < this._vectors[a].vectors.length; b++)
                    if (this.options.map.removeLayer(this._vectors[a].vectors[b]), this._vectors[a].vectors[b].popup) this.options.map.removeLayer(this._vectors[a].vectors[b].popup);
                    else if (this.popup &&
                this.popup.associatedFeature && this.popup.associatedFeature == this._vectors[a]) this.options.map.removeLayer(this.popup), this.popup = null
        }
    },
    _showVectors: function() {
        for (var a = 0; a < this._vectors.length; a++)
            if (this._vectors[a].vector && this.options.map.addLayer(this._vectors[a].vector), this._vectors[a].vectors && this._vectors[a].vectors.length)
                for (var b = 0; b < this._vectors[a].vectors.length; b++) this.options.map.addLayer(this._vectors[a].vectors[b])
    },
    _clearFeatures: function() {
        this._hideVectors();
        this._vectors = []
    },
    _addZoomChangeListener: function() {
        this._zoomChangeListener = this._zoomChangeListenerTemplate();
        this.options.map.on("zoomend", this._zoomChangeListener, this)
    },
    _zoomChangeListenerTemplate: function() {
        var a = this;
        return function() {
            a._checkLayerVisibility()
        }
    },
    _idleListenerTemplate: function() {
        var a = this;
        return function() {
            if (a.options.visibleAtScale)
                if (a.options.showAll) {
                    if (!a._gotAll) a._getFeatures(), a._gotAll = !0
                } else a._getFeatures()
        }
    },
    _addIdleListener: function() {
        this._idleListener = this._idleListenerTemplate();
        this.options.map.on("moveend", this._idleListener, this)
    },
    _checkLayerVisibility: function() {
	        var a = this.options.visibleAtScale,
	            b = this.options.map.getZoom(),
	            d = this.options.scaleRange;
	        this.options.visibleAtScale = b >= d[0] && b <= d[1];
	        if (a !== this.options.visibleAtScale) this[this.options.visibleAtScale ? "_showVectors" : "_hideVectors"]();
	        if (a && !this.options.visibleAtScale && this._autoUpdateInterval) clearInterval(this._autoUpdateInterval);
	        else if (!a && this.options.autoUpdate && this.options.autoUpdateInterval) {
	            var e =
	                this;
	            this._autoUpdateInterval = setInterval(function() {
	                e._getFeatures()
	            }, this.options.autoUpdateInterval)
	        }
    },
    _setPopupContent: function(a) {
        var b = a.popupContent,
            d = a.attributes || a.properties,
            e;
        if (typeof this.options.popupTemplate == "string") {
            e = this.options.popupTemplate;
            for (var c in d) e = e.replace(RegExp("{" + c + "}", "g"), d[c])
        } else if (typeof this.options.popupTemplate == "function") e = this.options.popupTemplate(d);
        else return;
        a.popupContent = e;
        a.popup ? a.popupContent !== b && a.popup.setContent(a.popupContent) : this.popup &&
            this.popup.associatedFeature == a && a.popupContent !== b && this.popup.setContent(a.popupContent)
    },
    _showPopup: function(a, b) {
        var d = b.latlng;
        d || L.Util.extend(this.options.popupOptions, {
            offset: b.target.options.icon.options.popupAnchor
        });
        var e;
        if (this.options.singlePopup) {
            if (this.popup) this.options.map.removeLayer(this.popup), this.popup = null;
            this.popup = new L.Popup(this.options.popupOptions, a.vector);
            this.popup.associatedFeature = a;
            e = this
        } else a.popup = new L.Popup(this.options.popupOptions, a.vector), e = a;
        e.popup.setLatLng(d ?
            b.latlng : b.target.getLatLng());
        e.popup.setContent(a.popupContent);
        this.options.map.addLayer(e.popup)
    },
    _fireClickEvent: function(a, b) {
        this.options.clickEvent(a, b)
    },
    _getFeatureVectorOptions: function(a) {
        var b = {},
            a = a.attributes || a.properties;
        if (this.options.symbology) switch (this.options.symbology.type) {
            case "single":
                for (var d in this.options.symbology.vectorOptions)
                    if (b[d] = this.options.symbology.vectorOptions[d], b.title)
                        for (var e in a) {
                            var c = RegExp("{" + e + "}", "g");
                            b.title = b.title.replace(c, a[e])
                        }
                    break;
            case "unique":
                for (var f = this.options.symbology.property, g = 0, h = this.options.symbology.values.length; g < h; g++)
                    if (a[f] == this.options.symbology.values[g].value)
                        for (d in this.options.symbology.values[g].vectorOptions)
                            if (b[d] = this.options.symbology.values[g].vectorOptions[d], b.title)
                                for (e in a) c = RegExp("{" + e + "}", "g"), b.title = b.title.replace(c, a[e]);
                break;
            case "range":
                f = this.options.symbology.property;
                g = 0;
                for (h = this.options.symbology.ranges.length; g < h; g++)
                    if (a[f] >= this.options.symbology.ranges[g].range[0] &&
                        a[f] <= this.options.symbology.ranges[g].range[1])
                        for (d in this.options.symbology.ranges[g].vectorOptions)
                            if (b[d] = this.options.symbology.ranges[g].vectorOptions[d], b.title)
                                for (e in a) c = RegExp("{" + e + "}", "g"), b.title = b.title.replace(c, a[e])
        }
        return b
    },
    _getPropertiesChanged: function(a, b) {
        var d = !1,
            e;
        for (e in a) a[e] != b[e] && (d = !0);
        return d
    },
    _getPropertyChanged: function(a, b, d) {
        return a[d] != b[d]
    },
    _getGeometryChanged: function(a, b) {
        var d = !1;
        a.coordinates && a.coordinates instanceof Array ? a.coordinates[0] == b.coordinates[0] &&
            a.coordinates[1] == b.coordinates[1] || (d = !0) : a.x == b.x && a.y == b.y || (d = !0);
        return d
    },
    _makeJsonpRequest: function(a) {
        var b = document.getElementsByTagName("head")[0],
            d = document.createElement("script");
        d.type = "text/javascript";
        d.src = a;
        b.appendChild(d)
    },
    _processFeatures: function(a) {
        if (this.options.map) {
            var b = this.options.map.getBounds();
            if (!this._lastQueriedBounds || !this._lastQueriedBounds.equals(b) || this.options.autoUpdate) {
                this._lastQueriedBounds = b;
                featuresHaveIds = a.features && a.features.length && a.features[0].id ?
                    !0 : !1;
                !this.options.uniqueField && !featuresHaveIds && this._clearFeatures();
                if (this instanceof lvector.PRWSF) {
                    a.features = a.rows;
                    delete a.rows;
                    for (var b = 0, d = a.features.length; b < d; b++) {
                        a.features[b].type = "Feature";
                        a.features[b].properties = {};
                        for (var e in a.features[b].row) e == "geojson" ? a.features[b].geometry = a.features[b].row.geojson : a.features[b].properties[e] = a.features[b].row[e];
                        delete a.features[b].row
                    }
                }
                if (this instanceof lvector.GISCloud) {
                    a.features = a.data;
                    delete a.data;
                    b = 0;
                    for (d = a.features.length; b <
                        d; b++) a.features[b].type = "Feature", a.features[b].properties = a.features[b].data, a.features[b].properties.id = a.features[b].__id, delete a.features[b].data, a.features[b].geometry = a.features[b].__geometry, delete a.features[b].__geometry
                }
                if (a && a.features && a.features.length)
                    for (b = 0; b < a.features.length; b++) {
                        if (this instanceof lvector.EsriJSONLayer) a.features[b].properties = a.features[b].attributes, delete a.features[b].attributes;
                        e = !1;
                        d = a.features[b].id ? !0 : !1;
                        if (this.options.uniqueField || d)
                            for (var c = 0; c < this._vectors.length; c++) {
                                var f =
                                    this._vectors[c].id ? !0 : !1;
                                if (d && f && a.features[b].id == this._vectors[c].id || this.options.uniqueField && a.features[b].properties[this.options.uniqueField] == this._vectors[c].properties[this.options.uniqueField])
                                    if (e = !0, this.options.dynamic) {
                                        if (this._getGeometryChanged(this._vectors[c].geometry, a.features[b].geometry) && !isNaN(a.features[b].geometry.coordinates[0]) && !isNaN(a.features[b].geometry.coordinates[1])) this._vectors[c].geometry = a.features[b].geometry, this._vectors[c].vector.setLatLng(new L.LatLng(this._vectors[c].geometry.coordinates[1],
                                            this._vectors[c].geometry.coordinates[0]));
                                        if (this._getPropertiesChanged(this._vectors[c].properties, a.features[b].properties) && (f = this._getPropertyChanged(this._vectors[c].properties, a.features[b].properties, this.options.symbology.property), this._vectors[c].properties = a.features[b].properties, this.options.popupTemplate && this._setPopupContent(this._vectors[c]), this.options.symbology && this.options.symbology.type != "single" && f))
                                            if (this._vectors[c].vectors)
                                                for (var f = 0, g = this._vectors[c].vectors.length; f <
                                                    g; f++) this._vectors[c].vectors[f].setStyle ? this._vectors[c].vectors[f].setStyle(this._getFeatureVectorOptions(this._vectors[c])) : this._vectors[c].vectors[f].setIcon && this._vectors[c].vectors[f].setIcon(this._getFeatureVectorOptions(this._vectors[c]).icon);
                                            else this._vectors[c].vector && (this._vectors[c].vector.setStyle ? this._vectors[c].vector.setStyle(this._getFeatureVectorOptions(this._vectors[c])) : this._vectors[c].vector.setIcon && this._vectors[c].vector.setIcon(this._getFeatureVectorOptions(this._vectors[c]).icon))
                                    }
                            }
                        if (!e) {
                            this instanceof
                            lvector.GeoJSONLayer ? (e = this._geoJsonGeometryToLeaflet(a.features[b].geometry, this._getFeatureVectorOptions(a.features[b])), a.features[b][e instanceof Array ? "vectors" : "vector"] = e) : this instanceof lvector.EsriJSONLayer && (e = this._esriJsonGeometryToLeaflet(a.features[b].geometry, this._getFeatureVectorOptions(a.features[b])), a.features[b][e instanceof Array ? "vectors" : "vector"] = e);
                            if (a.features[b].vector) this.options.map.addLayer(a.features[b].vector);
                            else if (a.features[b].vectors && a.features[b].vectors.length)
                                for (f =
                                    0; f < a.features[b].vectors.length; f++) this.options.map.addLayer(a.features[b].vectors[f]);
                            this._vectors.push(a.features[b]);
                            if (this.options.popupTemplate) {
                                var h = this;
                                e = a.features[b];
                                this._setPopupContent(e);
                                (function(a) {
                                    if (a.vector) a.vector.on("click", function(b) {
                                        h._showPopup(a, b)
                                    });
                                    else if (a.vectors)
                                        for (var b = 0, c = a.vectors.length; b < c; b++) a.vectors[b].on("click", function(b) {
                                            h._showPopup(a, b)
                                        })
                                })(e)
                            }
                            this.options.clickEvent && (h = this, e = a.features[b], function(a) {
                                if (a.vector) a.vector.on("click", function(b) {
                                    h._fireClickEvent(a,
                                        b)
                                });
                                else if (a.vectors)
                                    for (var b = 0, c = a.vectors.length; b < c; b++) a.vectors[b].on("click", function(b) {
                                        h._fireClickEvent(a, b)
                                    })
                            }(e))
                        }
                    }
            }
        }
    }
});
lvector.GeoJSONLayer = lvector.Layer.extend({
    _geoJsonGeometryToLeaflet: function(a, b) {
        var d, e;
        switch (a.type) {
            case "Point":
                d = b.circleMarker ? new L.CircleMarker(new L.LatLng(a.coordinates[1], a.coordinates[0]), b) : new L.Marker(new L.LatLng(a.coordinates[1], a.coordinates[0]), b);
                break;
            case "MultiPoint":
                e = [];
                for (var c = 0, f = a.coordinates.length; c < f; c++) e.push(new L.Marker(new L.LatLng(a.coordinates[c][1], a.coordinates[c][0]), b));
                break;
            case "LineString":
                for (var g = [], c = 0, f = a.coordinates.length; c < f; c++) g.push(new L.LatLng(a.coordinates[c][1],
                    a.coordinates[c][0]));
                d = new L.Polyline(g, b);
                break;
            case "MultiLineString":
                e = [];
                c = 0;
                for (f = a.coordinates.length; c < f; c++) {
                    for (var g = [], h = 0, j = a.coordinates[c].length; h < j; h++) g.push(new L.LatLng(a.coordinates[c][h][1], a.coordinates[c][h][0]));
                    e.push(new L.Polyline(g, b))
                }
                break;
            case "Polygon":
                for (var i = [], c = 0, f = a.coordinates.length; c < f; c++) {
                    g = [];
                    h = 0;
                    for (j = a.coordinates[c].length; h < j; h++) g.push(new L.LatLng(a.coordinates[c][h][1], a.coordinates[c][h][0]));
                    i.push(g)
                }
                d = new L.Polygon(i, b);
                break;
            case "MultiPolygon":
                e = [];
                c = 0;
                for (f = a.coordinates.length; c < f; c++) {
                    i = [];
                    h = 0;
                    for (j = a.coordinates[c].length; h < j; h++) {
                        for (var g = [], k = 0, l = a.coordinates[c][h].length; k < l; k++) g.push(new L.LatLng(a.coordinates[c][h][k][1], a.coordinates[c][h][k][0]));
                        i.push(g)
                    }
                    e.push(new L.Polygon(i, b))
                }
                break;
            case "GeometryCollection":
                e = [];
                c = 0;
                for (f = a.geometries.length; c < f; c++) e.push(this._geoJsonGeometryToLeaflet(a.geometries[c], b))
        }
        return d || e
    }
});
lvector.EsriJSONLayer = lvector.Layer.extend({
    _esriJsonGeometryToLeaflet: function(a, b) {
        var d, e;
        if (a.x && a.y) d = new L.Marker(new L.LatLng(a.y, a.x), b);
        else if (a.points) {
            e = [];
            for (var c = 0, f = a.points.length; c < f; c++) e.push(new L.Marker(new L.LatLng(a.points[c].y, a.points[c].x), b))
        } else if (a.paths)
            if (a.paths.length > 1) {
                e = [];
                c = 0;
                for (f = a.paths.length; c < f; c++) {
                    for (var g = [], h = 0, j = a.paths[c].length; h < j; h++) g.push(new L.LatLng(a.paths[c][h][1], a.paths[c][h][0]));
                    e.push(new L.Polyline(g, b))
                }
            } else {
                g = [];
                c = 0;
                for (f = a.paths[0].length; c <
                    f; c++) g.push(new L.LatLng(a.paths[0][c][1], a.paths[0][c][0]));
                d = new L.Polyline(g, b)
            } else if (a.rings)
            if (a.rings.length > 1) {
                e = [];
                c = 0;
                for (f = a.rings.length; c < f; c++) {
                    for (var i = [], g = [], h = 0, j = a.rings[c].length; h < j; h++) g.push(new L.LatLng(a.rings[c][h][1], a.rings[c][h][0]));
                    i.push(g);
                    e.push(new L.Polygon(i, b))
                }
            } else {
                i = [];
                g = [];
                c = 0;
                for (f = a.rings[0].length; c < f; c++) g.push(new L.LatLng(a.rings[0][c][1], a.rings[0][c][0]));
                i.push(g);
                d = new L.Polygon(i, b)
            }
        return d || e
    }
});
lvector.AGS = lvector.EsriJSONLayer.extend({
    initialize: function(a) {
        for (var b = 0, d = this._requiredParams.length; b < d; b++)
            if (!a[this._requiredParams[b]]) throw Error('No "' + this._requiredParams[b] + '" parameter found.');
        this._globalPointer = "AGS_" + Math.floor(Math.random() * 1E5);
        window[this._globalPointer] = this;
        a.url.substr(a.url.length - 1, 1) !== "/" && (a.url += "/");
        this._originalOptions = L.Util.extend({}, a);
        if (a.esriOptions)
            if (typeof a.esriOptions == "object") L.Util.extend(a, this._convertEsriOptions(a.esriOptions));
            else {
                this._getEsriOptions();
                return
            }
        lvector.Layer.prototype.initialize.call(this, a);
        if (this.options.where) this.options.where = encodeURIComponent(this.options.where);
        this._vectors = [];
        if (this.options.map) {
            if (this.options.scaleRange && this.options.scaleRange instanceof Array && this.options.scaleRange.length === 2) a = this.options.map.getZoom(), b = this.options.scaleRange, this.options.visibleAtScale = a >= b[0] && a <= b[1];
            this._show()
        }
    },
    options: {
        where: "1=1",
        url: null,
        useEsriOptions: !1
    },
    _requiredParams: ["url"],
    _convertEsriOptions: function(a) {
        var b = {};
        if (!(a.minScale == void 0 || a.maxScale == void 0)) {
            var d = this._scaleToLevel(a.minScale),
                e = this._scaleToLevel(a.maxScale);
            e == 0 && (e = 20);
            b.scaleRange = [d, e]
        }
        if (a.drawingInfo && a.drawingInfo.renderer) b.symbology = this._renderOptionsToSymbology(a.drawingInfo.renderer);
        return b
    },
    _getEsriOptions: function() {
        this._makeJsonpRequest(this._originalOptions.url + "?f=json&callback=" + this._globalPointer + "._processEsriOptions")
    },
    _processEsriOptions: function(a) {
        var b = this._originalOptions;
        b.esriOptions = a;
        this.initialize(b)
    },
    _scaleToLevel: function(a) {
        var b = [5.91657527591555E8, 2.95828763795777E8, 1.47914381897889E8, 7.3957190948944E7, 3.6978595474472E7, 1.8489297737236E7, 9244648.868618, 4622324.434309, 2311162.217155, 1155581.108577, 577790.554289, 288895.277144, 144447.638572, 72223.819286, 36111.909643, 18055.954822, 9027.977411, 4513.988705, 2256.994353, 1128.497176, 564.248588, 282.124294];
        if (a == 0) return 0;
        for (var d = 0, e = 0; e < b.length - 1; e++) {
            var c = b[e + 1];
            if (a <= b[e] && a > c) {
                d = e;
                break
            }
        }
        return d
    },
    _renderOptionsToSymbology: function(a) {
        symbology = {};
        switch (a.type) {
            case "simple":
                symbology.type = "single";
                symbology.vectorOptions = this._parseSymbology(a.symbol);
                break;
            case "uniqueValue":
                symbology.type = "unique";
                symbology.property = a.field1;
                for (var b = [], d = 0; d < a.uniqueValueInfos.length; d++) {
                    var e = a.uniqueValueInfos[d],
                        c = {};
                    c.value = e.value;
                    c.vectorOptions = this._parseSymbology(e.symbol);
                    c.label = e.label;
                    b.push(c)
                }
                symbology.values = b;
                break;
            case "classBreaks":
                symbology.type = "range";
                symbology.property = rend.field;
                b = [];
                e = a.minValue;
                for (d = 0; d < a.classBreakInfos.length; d++) {
                    var c =
                        a.classBreakInfos[d],
                        f = {};
                    f.range = [e, c.classMaxValue];
                    e = c.classMaxValue;
                    f.vectorOptions = this._parseSymbology(c.symbol);
                    f.label = c.label;
                    b.push(f)
                }
                symbology.ranges = b
        }
        return symbology
    },
    _parseSymbology: function(a) {
        var b = {};
        switch (a.type) {
            case "esriSMS":
            case "esriPMS":
                a = L.icon({
                    iconUrl: "data:" + a.contentType + ";base64," + a.imageData,
                    shadowUrl: null,
                    iconSize: new L.Point(a.width, a.height),
                    iconAnchor: new L.Point(a.width / 2 + a.xoffset, a.height / 2 + a.yoffset),
                    popupAnchor: new L.Point(0, -(a.height / 2))
                });
                b.icon = a;
                break;
            case "esriSLS":
                b.weight = a.width;
                b.color = this._parseColor(a.color);
                b.opacity = this._parseAlpha(a.color[3]);
                break;
            case "esriSFS":
                a.outline ? (b.weight = a.outline.width, b.color = this._parseColor(a.outline.color), b.opacity = this._parseAlpha(a.outline.color[3])) : (b.weight = 0, b.color = "#000000", b.opacity = 0), a.style != "esriSFSNull" ? (b.fillColor = this._parseColor(a.color), b.fillOpacity = this._parseAlpha(a.color[3])) : (b.fillColor = "#000000", b.fillOpacity = 0)
        }
        return b
    },
    _parseColor: function(a) {
        red = this._normalize(a[0]);
        green = this._normalize(a[1]);
        blue = this._normalize(a[2]);
        return "#" + this._pad(red.toString(16)) + this._pad(green.toString(16)) + this._pad(blue.toString(16))
    },
    _normalize: function(a) {
        return a < 1 && a > 0 ? Math.floor(a * 255) : a
    },
    _pad: function(a) {
        return a.length > 1 ? a.toUpperCase() : "0" + a.toUpperCase()
    },
    _parseAlpha: function(a) {
        return a / 255
    },
    _getFeatures: function() {
        var a = this.options.url + "query?returnGeometry=true&outSR=4326&f=json&outFields=" + this.options.fields + "&where=" + this.options.where + "&callback=" + this._globalPointer +
            "._processFeatures";
        this.options.showAll || (a += "&inSR=4326&spatialRel=esriSpatialRelIntersects&geometryType=esriGeometryEnvelope&geometry=" + this.options.map.getBounds().toBBoxString());
        this._makeJsonpRequest(a)
    }
});
lvector.A2E = lvector.AGS.extend({
    initialize: function(a) {
        for (var b = 0, d = this._requiredParams.length; b < d; b++)
            if (!a[this._requiredParams[b]]) throw Error('No "' + this._requiredParams[b] + '" parameter found.');
        this._globalPointer = "A2E_" + Math.floor(Math.random() * 1E5);
        window[this._globalPointer] = this;
        a.url.substr(a.url.length - 1, 1) !== "/" && (a.url += "/");
        this._originalOptions = L.Util.extend({}, a);
        if (a.esriOptions)
            if (typeof a.esriOptions == "object") L.Util.extend(a, this._convertEsriOptions(a.esriOptions));
            else {
                this._getEsriOptions();
                return
            }
        lvector.Layer.prototype.initialize.call(this, a);
        if (this.options.where) this.options.where = encodeURIComponent(this.options.where);
        this._vectors = [];
        if (this.options.map) {
            if (this.options.scaleRange && this.options.scaleRange instanceof Array && this.options.scaleRange.length === 2) a = this.options.map.getZoom(), b = this.options.scaleRange, this.options.visibleAtScale = a >= b[0] && a <= b[1];
            this._show()
        }
        if (this.options.autoUpdate && this.options.esriOptions.editFeedInfo) {
            this._makeJsonpRequest("http://cdn.pubnub.com/pubnub-3.1.min.js");
            var e = this;
            this._pubNubScriptLoaderInterval = setInterval(function() {
                window.PUBNUB && e._pubNubScriptLoaded()
            }, 200)
        }
    },
    _pubNubScriptLoaded: function() {
        clearInterval(this._pubNubScriptLoaderInterval);
        this.pubNub = PUBNUB.init({
            subscribe_key: this.options.esriOptions.editFeedInfo.pubnubSubscribeKey,
            ssl: !1,
            origin: "pubsub.pubnub.com"
        });
        var a = this;
        this.pubNub.subscribe({
            channel: this.options.esriOptions.editFeedInfo.pubnubChannel,
            callback: function() {
                a._getFeatures()
            },
            error: function() {}
        })
    }
});
lvector.GeoIQ = lvector.GeoJSONLayer.extend({
    initialize: function(a) {
        for (var b = 0, d = this._requiredParams.length; b < d; b++)
            if (!a[this._requiredParams[b]]) throw Error('No "' + this._requiredParams[b] + '" parameter found.');
        lvector.Layer.prototype.initialize.call(this, a);
        this._globalPointer = "GeoIQ_" + Math.floor(Math.random() * 1E5);
        window[this._globalPointer] = this;
        this._vectors = [];
        if (this.options.map) {
            if (this.options.scaleRange && this.options.scaleRange instanceof Array && this.options.scaleRange.length === 2) a = this.options.map.getZoom(),
                b = this.options.scaleRange, this.options.visibleAtScale = a >= b[0] && a <= b[1];
            this._show()
        }
    },
    options: {
        dataset: null
    },
    _requiredParams: ["dataset"],
    _getFeatures: function() {
        var a = "http://geocommons.com/datasets/" + this.options.dataset + "/features.json?geojson=1&callback=" + this._globalPointer + "._processFeatures&limit=999";
        this.options.showAll || (a += "&bbox=" + this.options.map.getBounds().toBBoxString() + "&intersect=full");
        this._makeJsonpRequest(a)
    }
});
lvector.CartoDB = lvector.GeoJSONLayer.extend({
    initialize: function(a) {
        for (var b = 0, d = this._requiredParams.length; b < d; b++)
            if (!a[this._requiredParams[b]]) throw Error('No "' + this._requiredParams[b] + '" parameter found.');
        lvector.Layer.prototype.initialize.call(this, a);
        this._globalPointer = "CartoDB_" + Math.floor(Math.random() * 1E5);
        window[this._globalPointer] = this;
        this._vectors = [];
        if (this.options.map) {
            if (this.options.scaleRange && this.options.scaleRange instanceof Array && this.options.scaleRange.length === 2) a =
                this.options.map.getZoom(), b = this.options.scaleRange, this.options.visibleAtScale = a >= b[0] && a <= b[1];
            this._show()
        }
    },
    options: {
        version: 1,
        user: null,
        table: null,
        fields: "*",
        where: null,
        limit: null,
        key: null,
        uniqueField: "cartodb_id"
    },
    _requiredParams: ["user", "table"],
    _getFeatures: function() {
        var a = this.options.where || "";
        if (!this.options.showAll)
            for (var b = this.options.map.getBounds(), d = b.getSouthWest(), b = b.getNorthEast(), e = this.options.table.split(",").length, c = 0; c < e; c++) a += (a.length ? " AND " : "") + (e > 1 ? this.options.table.split(",")[c].split(".")[0] +
                ".the_geom" : "the_geom") + " && st_setsrid(st_makebox2d(st_point(" + d.lng + "," + d.lat + "),st_point(" + b.lng + "," + b.lat + ")),4326)";
        this.options.limit && (a += (a.length ? " " : "") + "limit " + this.options.limit);
        a = a.length ? " " + a : "";
        a = "http://" + this.options.user + ".cartodb.com/api/v" + this.options.version + "/sql?q=" + encodeURIComponent("SELECT " + this.options.fields + " FROM " + this.options.table + (a.length ? " WHERE " + a : "")) + "&api_key=" + this.options.key + "&format=geojson&callback=" + this._globalPointer + "._processFeatures";
        this._makeJsonpRequest(a)
    }
});
lvector.PRWSF = lvector.GeoJSONLayer.extend({
    initialize: function(a) {
        for (var b = 0, d = this._requiredParams.length; b < d; b++)
            if (!a[this._requiredParams[b]]) throw Error('No "' + this._requiredParams[b] + '" parameter found.');
        a.url.substr(a.url.length - 1, 1) !== "/" && (a.url += "/");
        lvector.Layer.prototype.initialize.call(this, a);
        this._globalPointer = "PRWSF_" + Math.floor(Math.random() * 1E5);
        window[this._globalPointer] = this;
        this._vectors = [];
        if (this.options.map) {
            if (this.options.scaleRange && this.options.scaleRange instanceof Array && this.options.scaleRange.length === 2) a = this.options.map.getZoom(), b = this.options.scaleRange, this.options.visibleAtScale = a >= b[0] && a <= b[1];
            this._show()
        }
    },
    options: {
        geotable: null,
        srid: null,
        geomFieldName: "the_geom",
        geomPrecision: "",
        fields: "",
        where: null,
        limit: null,
        uniqueField: null
    },
    _requiredParams: ["url", "geotable"],
    _getFeatures: function() {
        var a = this.options.where || "";
        if (!this.options.showAll) {
            var b = this.options.map.getBounds(),
                d = b.getSouthWest(),
                b = b.getNorthEast();
            a += a.length ? " AND " : "";
            a += this.options.srid ?
                this.options.geomFieldName + " && transform(st_setsrid(st_makebox2d(st_point(" + d.lng + "," + d.lat + "),st_point(" + b.lng + "," + b.lat + ")),4326)," + this.options.srid + ")" : "transform(" + this.options.geomFieldName + ",4326) && st_setsrid(st_makebox2d(st_point(" + d.lng + "," + d.lat + "),st_point(" + b.lng + "," + b.lat + ")),4326)"
        }
        this.options.limit && (a += (a.length ? " " : "") + "limit " + this.options.limit);
        d = (this.options.fields.length ? this.options.fields + "," : "") + "st_asgeojson(transform(" + this.options.geomFieldName + ",4326)" + (this.options.geomPrecision ?
            "," + this.options.geomPrecision : "") + ") as geojson";
        this._makeJsonpRequest(this.options.url + "v1/ws_geo_attributequery.php?parameters=" + encodeURIComponent(a) + "&geotable=" + this.options.geotable + "&fields=" + encodeURIComponent(d) + "&format=json&callback=" + this._globalPointer + "._processFeatures")
    }
});
lvector.GISCloud = lvector.GeoJSONLayer.extend({
    initialize: function(a) {
        for (var b = 0, d = this._requiredParams.length; b < d; b++)
            if (!a[this._requiredParams[b]]) throw Error('No "' + this._requiredParams[b] + '" parameter found.');
        lvector.Layer.prototype.initialize.call(this, a);
        this._globalPointer = "GISCloud_" + Math.floor(Math.random() * 1E5);
        window[this._globalPointer] = this;
        this._vectors = [];
        if (this.options.map) {
            if (this.options.scaleRange && this.options.scaleRange instanceof Array && this.options.scaleRange.length === 2) a =
                this.options.map.getZoom(), b = this.options.scaleRange, this.options.visibleAtScale = a >= b[0] && a <= b[1];
            this._show()
        }
    },
    options: {
        mapID: null,
        layerID: null,
        uniqueField: "id"
    },
    _requiredParams: ["mapID", "layerID"],
    _getFeatures: function() {
        var a = "http://api.giscloud.com/1/maps/" + this.options.mapID + "/layers/" + this.options.layerID + "/features.json?geometry=geojson&epsg=4326&callback=" + this._globalPointer + "._processFeatures";
        this.options.showAll || (a += "&bounds=" + this.options.map.getBounds().toBBoxString());
        this.options.where &&
            (a += "&where=" + encodeURIComponent(this.options.where));
        this._makeJsonpRequest(a)
    }
});
lvector.GitSpatial = lvector.GeoJSONLayer.extend({
    initialize: function(a) {
        for (var b = 0, d = this._requiredParams.length; b < d; b++)
            if (!a[this._requiredParams[b]]) throw Error('No "' + this._requiredParams[b] + '" parameter found.');
        lvector.Layer.prototype.initialize.call(this, a);
        this._globalPointer = "GitSpatial_" + Math.floor(Math.random() * 1E5);
        window[this._globalPointer] = this;
        this._vectors = [];
        if (this.options.map) {
            if (this.options.scaleRange && this.options.scaleRange instanceof Array && this.options.scaleRange.length ===
                2) a = this.options.map.getZoom(), b = this.options.scaleRange, this.options.visibleAtScale = a >= b[0] && a <= b[1];
            this._show()
        }
    },
    options: {},
    _requiredParams: ["user", "repo", "featureSet"],
    _getFeatures: function() {
        var a = "http://gitspatial.com/api/v1/" + this.options.user + "/" + this.options.repo + "/" + this.options.featureSet + "?callback=" + this._globalPointer + "._processFeatures";
        this.options.showAll || (a += "&bbox=" + this.options.map.getBounds().toBBoxString());
        this._makeJsonpRequest(a)
    }
});