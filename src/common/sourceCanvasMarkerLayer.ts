// @ts-ignore
import Rbush from 'rbush'
// 尝试引入 leaflet
import * as L from 'leaflet'
const CanvasIconLayer = (L.Layer ? L.Layer : L.Class).extend({
	//Add event listeners to initialized section.
	initialize: function (options) {
		L.setOptions(this, options)
		this._onClickListeners = []
		this._onHoverListeners = []
	},

	setOptions: function (options) {
		L.setOptions(this, options)
		return this.redraw()
	},

	redraw: function () {
		this._redraw(true)
	},

	//Multiple layers at a time for rBush performance
	addMarkers: function (markers) {
		const self = this
		const tmpMark = []
		const tmpLatLng = []

		markers.forEach(function (marker) {
			if (!(marker.options.pane == 'markerPane' && marker.options.icon)) {
				console.error("Layer isn't a marker")
				return
			}

			const latlng = marker.getLatLng()
			const isDisplaying = self._map.getBounds().contains(latlng)
			const s = self._addMarker(marker, latlng, isDisplaying)

			//Only add to Point Lookup if we are on map
			if (isDisplaying === true) tmpMark.push(s[0])

			tmpLatLng.push(s[1])
		})

		self._markers.load(tmpMark)
		self._latlngMarkers.load(tmpLatLng)
	},

	//Adds single layer at a time. Less efficient for rBush
	addMarker: function (marker) {
		const self = this
		const latlng = marker.getLatLng()
		const isDisplaying = self._map.getBounds().contains(latlng)
		const dat = self._addMarker(marker, latlng, isDisplaying)

		//Only add to Point Lookup if we are on map
		if (isDisplaying === true) self._markers.insert(dat[0])

		self._latlngMarkers.insert(dat[1])
	},

	addLayer: function (layer) {
		if (layer.options.pane == 'markerPane' && layer.options.icon) this.addMarker(layer)
		else console.error("Layer isn't a marker")
	},

	addLayers: function (layers) {
		this.addMarkers(layers)
	},

	removeLayer: function (layer) {
		this.removeMarker(layer, true)
	},

	removeMarker: function (marker, redraw) {
		const self = this

		//If we are removed point
		if (marker['minX']) marker = marker.data

		const latlng = marker.getLatLng()
		const isDisplaying = self._map.getBounds().contains(latlng)

		const markerData = {
			minX: latlng.lng,
			minY: latlng.lat,
			maxX: latlng.lng,
			maxY: latlng.lat,
			data: marker,
		}

		self._latlngMarkers.remove(markerData, function (a, b) {
			return a.data._leaflet_id === b.data._leaflet_id
		})

		self._latlngMarkers.total--
		self._latlngMarkers.dirty++

		if (isDisplaying === true && redraw === true) {
			self._redraw(true)
		}
	},

	onAdd: function (map) {
		this._map = map

		if (!this._canvas) this._initCanvas()

		if (this.options.pane) this.getPane().appendChild(this._canvas)
		else map._panes.overlayPane.appendChild(this._canvas)

		map.on('moveend', this._reset, this)
		map.on('resize', this._reset, this)

		map.on('click', this._executeListeners, this)
		map.on('mousemove', this._executeListeners, this)
	},

	onRemove: function (map) {
		if (this.options.pane) this.getPane().removeChild(this._canvas)
		else map.getPanes().overlayPane.removeChild(this._canvas)

		map.off('click', this._executeListeners, this)
		map.off('mousemove', this._executeListeners, this)

		map.off('moveend', this._reset, this)
		map.off('resize', this._reset, this)
	},

	addTo: function (map) {
		map.addLayer(this)
		return this
	},

	clearLayers: function () {
		this._latlngMarkers = null
		this._markers = null
		this._redraw(true)
	},

	_addMarker: function (marker, latlng, isDisplaying) {
		const self = this
		//Needed for pop-up & tooltip to work.
		marker._map = self._map

		//_markers contains Points of markers currently displaying on map
		if (!self._markers) self._markers = new Rbush()

		//_latlngMarkers contains Lat\Long coordinates of all markers in layer.
		if (!self._latlngMarkers) {
			self._latlngMarkers = new Rbush()
			self._latlngMarkers.dirty = 0
			self._latlngMarkers.total = 0
		}

		L.Util.stamp(marker)

		const pointPos = self._map.latLngToContainerPoint(latlng)
		const iconSize = marker.options.icon.options.iconSize

		const adj_x = iconSize[0] / 2
		const adj_y = iconSize[1] / 2
		const ret = [
			{
				minX: pointPos.x - adj_x,
				minY: pointPos.y - adj_y,
				maxX: pointPos.x + adj_x,
				maxY: pointPos.y + adj_y,
				data: marker,
			},
			{
				minX: latlng.lng,
				minY: latlng.lat,
				maxX: latlng.lng,
				maxY: latlng.lat,
				data: marker,
			},
		]

		self._latlngMarkers.dirty++
		self._latlngMarkers.total++

		//Only draw if we are on map
		if (isDisplaying === true) self._drawMarker(marker, pointPos)

		return ret
	},

	_drawMarker: function (marker, pointPos) {
		const self = this

		if (!this._imageLookup) this._imageLookup = {}
		if (!pointPos) {
			pointPos = self._map.latLngToContainerPoint(marker.getLatLng())
		}

		const iconUrl = marker.options.icon.options.iconUrl

		if (marker.canvas_img) {
			self._drawImage(marker, pointPos)
		} else {
			if (self._imageLookup[iconUrl]) {
				marker.canvas_img = self._imageLookup[iconUrl][0]

				if (self._imageLookup[iconUrl][1] === false) {
					self._imageLookup[iconUrl][2].push([marker, pointPos])
				} else {
					self._drawImage(marker, pointPos)
				}
			} else {
				const i = new Image()
				i.src = iconUrl
				marker.canvas_img = i

				//Image,isLoaded,marker\pointPos ref
				self._imageLookup[iconUrl] = [i, false, [[marker, pointPos]]]

				i.onload = function () {
					self._imageLookup[iconUrl][1] = true
					self._imageLookup[iconUrl][2].forEach(function (e) {
						self._drawImage(e[0], e[1])
					})
				}
			}
		}
	},

	_drawImage: function (marker, pointPos) {
		const options = marker.options.icon.options

		this._context.drawImage(
			marker.canvas_img,
			pointPos.x - options.iconAnchor[0],
			pointPos.y - options.iconAnchor[1],
			options.iconSize[0],
			options.iconSize[1]
		)
	},

	_reset: function () {
		const topLeft = this._map.containerPointToLayerPoint([0, 0])
		L.DomUtil.setPosition(this._canvas, topLeft)

		const size = this._map.getSize()

		this._canvas.width = size.x
		this._canvas.height = size.y

		this._redraw()
	},

	_redraw: function (clear) {
		const self = this

		if (clear) this._context.clearRect(0, 0, this._canvas.width, this._canvas.height)
		if (!this._map || !this._latlngMarkers) return

		let tmp = []

		//If we are 10% individual inserts\removals, reconstruct lookup for efficiency
		if (self._latlngMarkers.dirty / self._latlngMarkers.total >= 0.1) {
			self._latlngMarkers.all().forEach(function (e) {
				tmp.push(e)
			})

			self._latlngMarkers.clear()
			self._latlngMarkers.load(tmp)
			self._latlngMarkers.dirty = 0
			tmp = []
		}

		const mapBounds = self._map.getBounds()

		//Only re-draw what we are showing on the map.

		const mapBoxCoords = {
			minX: mapBounds.getWest(),
			minY: mapBounds.getSouth(),
			maxX: mapBounds.getEast(),
			maxY: mapBounds.getNorth(),
		}

		self._latlngMarkers.search(mapBoxCoords).forEach(function (e) {
			//Readjust Point Map
			const pointPos = self._map.latLngToContainerPoint(e.data.getLatLng())

			const iconSize = e.data.options.icon.options.iconSize
			const adj_x = iconSize[0] / 2
			const adj_y = iconSize[1] / 2

			const newCoords = {
				minX: pointPos.x - adj_x,
				minY: pointPos.y - adj_y,
				maxX: pointPos.x + adj_x,
				maxY: pointPos.y + adj_y,
				data: e.data,
			}

			tmp.push(newCoords)

			//Redraw points
			self._drawMarker(e.data, pointPos)
		})

		//Clear rBush & Bulk Load for performance
		this._markers.clear()
		this._markers.load(tmp)
	},

	_initCanvas: function () {
		this._canvas = L.DomUtil.create('canvas', 'leaflet-canvas-icon-layer leaflet-layer')
		const originProp = L.DomUtil.testProp([
			'transformOrigin',
			'WebkitTransformOrigin',
			'msTransformOrigin',
		])
		// @ts-ignore
		this._canvas.style[originProp] = '50% 50%'

		const size = this._map.getSize()
		this._canvas.width = size.x
		this._canvas.height = size.y

		this._context = this._canvas.getContext('2d')

		const animated = this._map.options.zoomAnimation && L.Browser.any3d
		L.DomUtil.addClass(this._canvas, 'leaflet-zoom-' + (animated ? 'animated' : 'hide'))
	},

	addOnClickListener: function (listener) {
		this._onClickListeners.push(listener)
	},

	addOnHoverListener: function (listener) {
		this._onHoverListeners.push(listener)
	},

	_executeListeners: function (event) {
		if (!this._markers) return

		const me = this
		const x = event.containerPoint.x
		const y = event.containerPoint.y

		if (me._openToolTip) {
			me._openToolTip.closeTooltip()
			delete me._openToolTip
		}

		const ret = this._markers.search({ minX: x, minY: y, maxX: x, maxY: y })

		if (ret && ret.length > 0) {
			me._map._container.style.cursor = 'pointer'

			if (event.type === 'click') {
				const hasPopup = ret[0].data.getPopup()
				if (hasPopup) ret[0].data.openPopup()

				me._onClickListeners.forEach(function (listener) {
					listener(event, ret)
				})
			}

			if (event.type === 'mousemove') {
				const hasTooltip = ret[0].data.getTooltip()
				if (hasTooltip) {
					me._openToolTip = ret[0].data
					ret[0].data.openTooltip()
				}

				me._onHoverListeners.forEach(function (listener) {
					listener(event, ret)
				})
			}
		} else {
			me._map._container.style.cursor = ''
		}
	},
})
// @ts-ignore
L.canvasMarkerLayer = function (options) {
	// @ts-ignore
	return new CanvasMarkerLayer(options)
}

// 20-09-21 可以使用es6的方式将自定义的 CanvasMarkerLayer 导出，也可以使用上面的的方式进行实例化，主要需要考虑一下如何获取 options
export { CanvasIconLayer }
