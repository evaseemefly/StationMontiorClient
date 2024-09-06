<template>
	<div
		id="map_content"
		v-loading="!isLoading"
		element-loading-background="rgba(28, 34, 52, 0.733)"
	>
		<l-map
			ref="basemap"
			:zoom="zoom"
			:center="center"
			:options="mapOptions"
			:maxZoom="mapOptions.maxZoom"
			:minZoom="mapOptions.minZoom"
			id="ceshimap"
		>
			<l-tile-layer :url="url" :attribution="attribution"></l-tile-layer>
			<!-- <l-wms-tile-layer
				:baseUrl="ninelineWMS.url"
				:layers="ninelineWMS.options.layer"
				:format="ninelineWMS.options.format"
				:transparent="ninelineWMS.options.transparent"
			></l-wms-tile-layer> -->
			<!-- 南海岛礁 -->
			<!-- <l-wms-tile-layer
				:baseUrl="southlandWMS.url"
				:layers="southlandWMS.options.layer"
				:format="southlandWMS.options.format"
				:transparent="southlandWMS.options.transparent"
			></l-wms-tile-layer> -->

			<!-- TODO:[-] 20-08-26 新加入的世界国境线 -->
			<!-- <l-wms-tile-layer
				:baseUrl="worldLineWMS.url"
				:layers="worldLineWMS.options.layer"
				:format="worldLineWMS.options.format"
				:transparent="worldLineWMS.options.transparent"
				:zIndex="worldLineWMS.options.zindex"
			></l-wms-tile-layer> -->

			<LCircle
				:lat-lng="currentLatlng"
				:opacity="boxOptions.colorOpacity"
				:color="boxOptions.background"
				:fillColor="boxOptions.background"
				:fillOpacity="boxOptions.backgroundOpacity"
				:visible="getSelectLoop"
			></LCircle>
		</l-map>
		<!-- 不适用图层切换菜单 -->
		<LayersNavMenuView></LayersNavMenuView>
	</div>
</template>
<script lang="ts">
// vue 相关组件
import { Component, Prop, Vue, Watch, Emit } from 'vue-property-decorator'
import { Getter, Mutation, State, namespace } from 'vuex-class'
import { mixins } from 'vue-class-component'
// gis引擎组件
import * as L from 'leaflet'
import {
	LMap,
	LTileLayer,
	LMarker,
	LPopup,
	LPolyline,
	LPolygon,
	LCircle,
	LIcon,
	LWMSTileLayer,
	LGeoJson,
	LRectangle,
	// LeafletHeatmap
} from 'vue2-leaflet'

// mixin
import { WMSMixin } from '@/views/map/mixin/wmsMixin'
import { MapMixin } from '@/views/map/mixin/mapMixin'
// mid model
import { FilterTyMidModel, TyRealDataMongoMidModel } from '@/middle_model/typhoon'
import { ISearchTyStationParams } from '@/middle_model/api_params'
import { TyphoonCircleStatus, TyCMAPathLine } from '@/middle_model/leaflet_plugin'
import {
	addFubsIcon2Map,
	addStaticSitesIcon2Map,
	addStationIcon2Map,
	IconTyphoonCirlePulsing,
} from '@/middle_model/icon'
// 接口类
import { IStationIcon, IStationInfo } from '@/interface/station'
import { IHttpResponse } from '@/interface/common'
import { IPoint } from '@/interface/geo'
import { ITyphoonParams4Station } from '@/interface/station'

// store
import {
	GET_IS_SELECT_LOOP,
	GET_BOX_LOOP_RADIUS,
	GET_CURRENT_TY,
	SET_DATE_STEP,
	GET_BASE_MAP_KEY,
	GET_WAVE_PRODUCT_ISSUE_DATETIME,
	GET_WAVE_PRODUCT_ISSUE_TIMESTAMP,
	GET_WAVE_PRODUCT_LAYER_TYPE,
	GET_CURRENT_FORECAST_DT,
	SET_BOX_LOOP_LATLNG,
	GET_SCALAR_SHOW_TYPE,
	SET_STATION_CODE,
	SET_SHOW_STATION_SURGE_FORM,
	GET_REGION_PID,
	GET_STATION_CODE,
	GET_NOW,
	GET_ISSUE_TS,
	SET_ISOSURGE_COLOR_SCALE_STR_LIST,
	SET_ISOSURGE_COLOR_SCALE_VAL_RANGE,
	SET_IS_SHOW_RASTER_LEGEND,
	SET_SCALAR_SHOW_TYPE,
	SET_RASTER_COLOR_SCALE_RANGE,
	SET_STATIONS_BASEINFO_LIST,
	PUSH_STATIONS_CODE,
	SET_OBSERVATION_TYPE,
	PUSH_SITE,
} from '@/store/types'
// 默认常量
import {
	DEFAULT_BOX_LOOP_RADIUS,
	DEFAULT_BOX_LOOP_RADIUS_UNIT,
	DEFAULT_BOX_LOOP_LATLNG,
	DEFAULT_LAYER_ID,
	DEFAULT_DATE,
	DEFAULT_TY_CODE,
	DEFAULT_TY_NAME_CH,
	DEFAULT_TY_NAME,
	DEFAULT_TY_NUM,
	DEFAULT_STATION_NAME,
	DEFAULT_SURGE_VAL,
	DEFAULT_STATION_CODE,
	DEFAULT_TIMESTAMP,
} from '@/const/default'
// enum
import {
	IconTypeEnum,
	ObservationTypeEnum,
	ScalarShowTypeEnum,
	StationIconShowTypeEnum,
} from '@/enum/common'
import { MenuType, TyScatterMenuType } from '@/enum/menu'
import { LayerTypeEnum, MapLayerEnum, RasterLayerEnum, StationIconLayerEnum } from '@/enum/map'

// api
import { loadTyRealDataList, loadStationTideDataList } from '@/api/typhoon'
import {
	loadStationDetailDataList,
	loadStationNameDict,
	loadInlandStationMaxSurge,
} from '@/api/station'
// 各类插件
import { TyMiniMarker } from '@/plugins/customerMarker'
import {
	AbsBaseTyHeatmap,
	AbsBaseTyScatter,
	TyRadiusHeatMap,
	TyRadiusScatter,
	TyUniqueFilterScatter,
	TyUniquerFilterHeatMap,
} from '@/plugins/scatter'
// 工具类
import { convertTyRealDataMongo2TyCMAPathLine } from '@/middle_model/util'
import moment from 'moment'
import { ITyPath } from '@/interface/typhoon'
import { Collapse, Loading } from 'element-ui'
import station from '@/store/modules/station'
// 第三方插件
// 当前布局会导致此热图插件出错，暂时无法解决
// 以前使用的 heatmap 出现了问题，暂时不使用
// 方式1: 使用 heatmap.js 并使用对应 leaflet-heatmap.js 插件
import 'heatmap.js'
import HeatmapOverlay from '@/plugins/leaflet-heatmap.js'

// 其余组件
import LayersNavMenuView from '@/components/nav/LayersNavMenuView.vue'

// 引入事件总线
import { EventBus } from '@/bus/BUS'
import {
	TO_CLEAR_ALL_LAYER,
	TO_FILTER_TY_PATH_LIST,
	TO_GET_UNIQUE_TY_SEARCH_READ_DATA,
} from '@/bus/types'
import { FilterType4ScattersEnum, FilterTypeEnum } from '@/enum/filter'
import { MS_UNIT } from '@/const/unit'
import { ISurgeRasterLayer, SurgeRasterGeoLayer } from './raster'
import { Sosurface } from './isosurface'
import { DEFAULT_COLOR_SCALE } from '@/const/colorBar'
import wave from '@/store/modules/wave'
import { WaveArrow } from './arrow'
import { StationBaseInfo } from './station'
import { WaveBarOptType } from '@/middle_model/geo'
import { loading } from '@/common/common'

// - 23-03-27 api
import { loadSurgeListByRecently } from '@/api/surge' // 获取所有潮位站距离当前最近的潮值
import { loadAllStationStatusJoinGeoInfo, loadAllStationLastSurge } from '@/api/station'
import { StationBaseInfoMidModel } from '@/middle_model/station'
import { IWdSurgeLayerOptions } from './types/types'
import { IScale } from '@/const/colorBar'
import { getIntegerList } from '@/util/math'
import { DistStationSurgeListMidModel } from '@/middle_model/surge'
import { FubBaseInfoMidModel } from '@/middle_model/fub'
import { SiteBaseDigestMidModel, SiteBaseInfoMidModel } from '@/middle_model/site'
import {
	formatIconTypeEnum2ObservationTypeEnum,
	formatStationIconLayerEnum2IconTypeEnum,
	formatStationIconLayerEnum2ObservationTypeEnum,
} from '@/util/format'

/**
 * 实况 map view
 * 实况的站点基础集合由父组件传入
 *
 */
@Component({
	components: {
		// LMarker,
		// LMap,
		// LTileLayer,
		// LPolyline,
		// LCircle,
		// LIcon,
		// LWMSTileLayer,
		// LGeoJson,
		// LPolygon,
		// LRectangle,
		'l-marker': LMarker,
		'l-map': LMap,
		'l-tile-layer': LTileLayer,
		'l-polyline': LPolyline,
		LCircle,
		'l-icon': LIcon,
		'l-wms-tile-layer': LWMSTileLayer,
		'l-geo-json': LGeoJson,
		'l-polygon': LPolygon,
		'l-rectangle': LRectangle,
		LayersNavMenuView,
	},
	mixins: [WMSMixin, MapMixin],
})
export default class RealdataMapView extends Vue {
	zoom = 6
	center: number[] = [32.45, 125.8833]
	url = 'http://128.5.9.79:82/map/{z}/{x}/{y}.png'
	// url =
	// 	'https://webrd04.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}'
	// url = 'http://tileserver.memomaps.de/tilegen/{z}/{x}/{y}.png'
	// TODO:[-] 20-11-09 新加入的 map 相关的一些基础静态配置
	mapOptions: { preferCanvas: boolean; minZoom: number; maxZoom: number; render: any } = {
		preferCanvas: true,
		minZoom: 3,
		// 可缩放的最大 level
		maxZoom: 11,
		// 目前已经使用了 canvas 渲染
		render: L.canvas(),
	}

	/** + 24-03-28 由 RealdataHomeView 父组件 => 站点基础信息集合，在地图中进行加载 */
	@Prop({ type: Array, default: () => [] })
	stationInfoList: StationBaseInfoMidModel[]

	/** + 24-04-25 由 RealdataHomeView 父组件 => 站点浮标信息集合，在地图中进行加载 */
	@Prop({ type: Array, default: () => [] })
	fubInfoList: FubBaseInfoMidModel[]

	/** + 24-03-29 由 RealdataHomeView 父组件 => 站点实况集合，在地图中进行加载 */
	@Prop({ type: Array, default: () => [] })
	distStationRealdataList: DistStationSurgeListMidModel[]

	/** + 24-05-06 所有站点信息(含：fub|station) */
	@Prop({ type: Array, default: () => [] })
	sitesInfoList: SiteBaseInfoMidModel[]

	@Prop({ type: Boolean, default: false })
	isFinished: boolean

	/** 控制加载遮罩 */
	@Prop({ type: Boolean, default: false })
	isLoading: boolean

	isSelectLoop = false

	/** 当前窗口正在加载 */
	loading = false
	/** 当前点击的位置 */
	currentLatlng: L.LatLng = new L.LatLng(28, 130)

	/** 目前添加至map的markers id 集合 */
	markersIdList: number[] = []

	/** vuex common now 当前时间 */
	@Getter(GET_NOW, { namespace: 'common' })
	now: Date

	/** TODO:[-] 23-02-02 注意修改为通过监听 预报时间戳来执行加载操作(监听 预报Date 会出现多次赋相同值触发多次的问题) */
	forecastTimestamp = 0
	/** 圈选选项 */
	boxOptions = {
		color: '#1abc9c',
		colorOpacity: 0.6,
		background: '#1abc9c',
		backgroundOpacity: 0.7,
	}

	/** 当前的海洋站潮位list */
	surgeStationList: IStationInfo[] = []

	/** true:进行地图打点操作 */
	@Getter(GET_IS_SELECT_LOOP, { namespace: 'map' }) getSelectLoop: boolean

	@Getter(GET_BOX_LOOP_RADIUS, { namespace: 'map' }) getBoxLoopRadius: number

	@Getter(GET_CURRENT_TY, { namespace: 'typhoon' }) getCurrentTy

	/** 获取栅格图层的显示类型 */
	@Getter(GET_SCALAR_SHOW_TYPE, { namespace: 'common' }) getScalarType: ScalarShowTypeEnum

	created() {}

	mounted() {
		const issueTs = this.getIssueTs
		// TODO:[-] 23-11-20 取消在页面初始化时执行 initMaxSurge 的操作，放在 getMaxSurgeOpt 中
		// this.initMaxSurge(issueTs, ScalarShowTypeEnum.ISOSURFACE)
	}

	/** 清除当前选定的圈选位置的中心点 */
	private clearCurrentLatlng(): void {
		this.currentLatlng = null
	}

	private clearLayersByIds(ids: number[]): void {
		const that = this
		ids.forEach((id) => {
			// @ts-ignore
			that.clearLayerById(id)
		})
	}

	/** 加载 station surge form -- 新增观测手段: fub|station */
	private loadStationAndShow(
		code: string,
		obsType: StationIconLayerEnum = StationIconLayerEnum.ICON_STATION
	): void {
		// this.setStationCode(code)
		this.pushStationsCodes(code)
		this.setShowStationSurgeForm(true)
		this.setObservationType(obsType)
	}

	/** TODO:[-] 24-05-06 新加入的显示站点(fub|station)两种类型的实况数据——显示内容不同 */
	private loadSiteAndShow(
		code: string,
		obsType: ObservationTypeEnum = ObservationTypeEnum.STATION
	): void {
		// this.setStationCode(code)
		this.pushStationsCodes(code)
		// TODO:[-] 24-05-07 测试一下将SiteBaseDigestMidModel类型push至vuex数组中
		// TODO:[-] 24-05-20 注意此处当点击了指定站点后，并为完全加载完查询的站点实况数据，就展开了site form，此时site form中的部分步骤就被执行，会存在数据未加载的情况
		this.pushSite(new SiteBaseDigestMidModel(code, obsType))
		this.setShowStationSurgeForm(true)
		// this.setObservationType(obsType)
	}

	/** 添加当前 site */
	@Mutation(PUSH_SITE, { namespace: 'station' })
	pushSite: { (val: SiteBaseDigestMidModel): void }

	/** 设置台风的时间间隔步长 */
	@Mutation(SET_DATE_STEP, { namespace: 'common' }) setDateStep

	/** 设置当前潮位站 code */
	@Mutation(SET_STATION_CODE, { namespace: 'station' }) setStationCode

	/** 添加当前code至 codes 中 */
	@Mutation(PUSH_STATIONS_CODE, { namespace: 'station' })
	pushStationsCodes: { (code: string): void }

	/** 设置 显示|隐藏 station surge form */
	@Mutation(SET_SHOW_STATION_SURGE_FORM, { namespace: 'station' }) setShowStationSurgeForm

	/** 设置 station surge fomr 的观测手段 STATION|FUB */
	@Mutation(SET_OBSERVATION_TYPE, { namespace: 'station' })
	setObservationType: { (val: StationIconLayerEnum): void }

	@Mutation(SET_RASTER_COLOR_SCALE_RANGE, { namespace: 'common' }) setRasterColorScaleRange: (
		val: IScale
	) => void

	/** 设置是否显示 raster layer 图例 */
	@Mutation(SET_IS_SHOW_RASTER_LEGEND, { namespace: 'map' })
	setIsShowRasterLayerLegend

	/** 获取当前地图key */
	@Getter(GET_BASE_MAP_KEY, { namespace: 'map' }) getBaseMapKey

	/** 获取当前的预报时间(不再监听此变量，改为监听forecastTimestamp. ts=Date.getTime() ) */
	@Getter(GET_CURRENT_FORECAST_DT, { namespace: 'common' })
	getForecastDt: Date

	@Getter(GET_REGION_PID, { namespace: 'station' })
	getRegionPid: number

	@Watch('getForecastDt')
	onForecastDt(val: Date) {
		this.forecastTimestamp = val.getTime()
	}

	@Getter(GET_STATION_CODE, { namespace: 'station' })
	getStationCode: string

	/** 设置当前圈选中心位置 */
	@Mutation(SET_BOX_LOOP_LATLNG, { namespace: 'map' }) setBoxLoopLatlng: (val: L.LatLng) => void

	/** 设置字典基础信息集合 */
	@Mutation(SET_STATIONS_BASEINFO_LIST, { namespace: 'station' }) setStationsBaseInfo: (
		val: StationBaseInfoMidModel[]
	) => void

	/** 当前发布时间戳 */
	@Getter(GET_ISSUE_TS, { namespace: 'common' })
	getIssueTs: number

	/**@deprecated
	 * 加载国内wd各个站位的最大增水 */
	loadInlandStationMaxSurgeList(issueTs: number, is_recent = true): void {
		const mymap: L.Map = this.$refs.basemap['mapObject']
		const that = this
		this.clearLayersByIds(this.markersIdList)
		if (is_recent) {
			this.surgeStationList = []
			// step1: 加载大陆的指定发布时间的168小时站点增水极值集合
			// TODO:[-] 23-11-09 由于加载168小时站点增水耗时较长，加入了全局loading
			const loadInstance = Loading.service({
				lock: true,
				fullscreen: true,
				text: '加载中……',
				background: 'rgba(28, 34, 52, 0.733)',
			})
			loadInlandStationMaxSurge(issueTs)
				.then(
					(
						res: IHttpResponse<
							{
								code: string
								surge: number
								name: string
								lat: number
								lon: number
							}[]
						>
					) => {
						let tempStationList: IStationInfo[] = []
						res.data.forEach((temp) => {
							tempStationList.push({
								station_code: temp.code,
								name: temp.name,
								gmt_realtime: new Date(issueTs), // 注意此处为str->date
								lat: temp.lat,
								lon: temp.lon,
								surge: temp.surge,
							})
						})
						this.surgeStationList = tempStationList
					}
				)
				.then((_) => {
					that.markersIdList = addStationIcon2Map(
						mymap,
						this.surgeStationList,
						10,
						[{ name: '123', chname: '' }],
						(msg: { code: string; name: string }) => {
							console.log(`当前点击了code:${msg.code},name:${msg.name}`)
							that.loadStationAndShow(msg.code)
						},
						IconTypeEnum.FIXED_STATION_SURGE_ICON,
						StationIconShowTypeEnum.SHOW_STATION_STATUS,
						that.now
					)
					that.zoom2Country()
				})
				.finally(() => {
					loadInstance.close()
				})
		}
	}

	/** @deprecated 24-06-27
	 *   24-03-29 将不同站点的总潮位添加至map */
	addDistStationTotalSurge2Map() {
		const mymap: L.Map = this.$refs.basemap['mapObject']
		const that = this
		let tempStationList: IStationInfo[] = []
		// step1: 将 distStationRealdataList 与 stationInfoList 合并生成 surgeStationList
		for (let index = 0; index < this.distStationRealdataList.length; index++) {
			const element = this.distStationRealdataList[index]
			const filterStationBaseInfo = this.stationInfoList.filter((temp) => {
				return temp.stationCode == element.stationCode
			})
			const tempStation = filterStationBaseInfo.length > 0 ? filterStationBaseInfo[0] : null
			/** 当前站点surge极值 */
			const surgeMax = Math.max(...element.surgeList)
			const surgeMaxIndex = element.surgeList.findIndex((temp) => {
				return temp == surgeMax
			})
			/** 当前站点surge极值对应的时间戳 */
			const surgeMaxTs = element.tsList[surgeMaxIndex]
			const tempStationSurge = {
				station_code: tempStation !== null ? tempStation.stationCode : DEFAULT_STATION_CODE,
				name: tempStation !== null ? tempStation.stationName : DEFAULT_STATION_NAME,
				gmt_realtime: new Date(surgeMaxTs), // 注意此处为str->date
				lat: tempStation !== null ? tempStation.lat : DEFAULT_BOX_LOOP_LATLNG[0],
				lon: tempStation !== null ? tempStation.lon : DEFAULT_BOX_LOOP_LATLNG[1],
				surge: surgeMax,
			}

			tempStationList.push(tempStationSurge)
			this.surgeStationList = tempStationList
		}
		that.markersIdList = addStationIcon2Map(
			mymap,
			this.surgeStationList,
			10,
			[{ name: '123', chname: '' }],
			(msg: { code: string; name: string }) => {
				console.log(`当前点击了code:${msg.code},name:${msg.name}`)
				that.loadStationAndShow(msg.code)
			},
			IconTypeEnum.FIXED_STATION_SURGE_ICON,
			StationIconShowTypeEnum.SHOW_STATION_STATUS,
			that.now
		)
		that.zoom2Country()
	}

	/** TODO:[*] 24-04-26 添加 this.fubInfoList 至map */
	addDistFubs2Map() {
		const mymap: L.Map = this.$refs.basemap['mapObject']
		const that = this

		addFubsIcon2Map(
			mymap,
			this.fubInfoList,
			(msg: { code: string; name: string; iconType: IconTypeEnum }) => {
				console.log(`当前点击了code:${msg.code},name:${msg.name},layerType:${msg.iconType}`)

				that.loadStationAndShow(msg.code)
			}
		)
	}

	/** TODO:[-] 24-05-06 添加所有站点(sites: station|fub)至地图中 */
	addAllSites2Map() {
		const mymap: L.Map = this.$refs.basemap['mapObject']
		const that = this
		// 24-06-27 每次加载前先清除 markers layer
		this.clearLayersByIds(this.markersIdList)

		const groupdIds: number[] = addStaticSitesIcon2Map(
			mymap,
			this.sitesInfoList,
			(msg: { code: string; name: string; iconType: IconTypeEnum }) => {
				console.log(`当前点击了code:${msg.code},name:${msg.name},layerType:${msg.iconType}`)
				// TODO:[*] 24-09-03 若为未使用站点则提示，不加载
				if (msg.iconType == IconTypeEnum.STATION_STATICS_UNUSED_ICON) {
					that.$alert(`站点:${msg.name}目前未使用，无法加载!`)
					return
				}
				/** 当前site的站点类型 */
				const obsType = formatIconTypeEnum2ObservationTypeEnum(msg.iconType)
				that.loadSiteAndShow(msg.code, obsType)
			}
		)
		this.markersIdList = groupdIds
	}

	@Watch('isFinished')
	onIsFinished(val: boolean) {
		if (val) {
			// this.addDistStationTotalSurge2Map()
			// this.addDistFubs2Map()
			// TODO:[-] 24-05-06 添加所有站点至地图，包含 station 与 fub
			this.addAllSites2Map()
		}
	}

	/** 将地图缩放至当前 surgeStationList  */
	zoom2Country(): void {
		if (this.surgeStationList.length > 0) {
			const tempStation = this.surgeStationList[0]

			const tempPostion = new L.LatLng(tempStation.lat, tempStation.lon)
			const mymap: L.Map = this.$refs.basemap['mapObject']
			mymap.setView(tempPostion)
		}
	}

	/** + 23-03-27 加载 潮位站基础信息集合 -> 生成一个集合 */
	async loadBaseStationList(): Promise<void> {
		const stationBaseInfo = new StationBaseInfo()
		await stationBaseInfo.getAllInlandStationInfo()
		this.setStationsBaseInfo(stationBaseInfo.allStationBaseInfoList)
	}

	@Watch('getSelectLoop')
	onSelectLoop(val: boolean): void {}

	@Watch('getStationCode')
	onStationCode(val: string): void {
		this.loadStationAndShow(val)
	}

	get getMaxSurgeOpt(): { getIssueTs: number; getScalarType: ScalarShowTypeEnum } {
		const { getIssueTs, getScalarType } = this
		return { getIssueTs, getScalarType }
	}

	@Watch('getBaseMapKey')
	onBaseMapKey(val: MapLayerEnum): void {
		const mymap: L.Map = this.$refs.basemap['mapObject']
		switch (true) {
			// case val === MapLayerEnum.SATELITE_MAP:
			//     this.url = `https://api.maptiler.com/maps/hybrid/256/{z}/{x}/{y}.jpg?key=${MAPTITLELAYER_TOKEN_KEY}`
			case val === MapLayerEnum.SATELITE_MAP:
				this.url = 'http://tileserver.memomaps.de/tilegen/{z}/{x}/{y}.png'

				// this.getMapBoxLayerClass('0TuB9SR4KyaoCi4FUrPM').addTo(mymap)
				break
			case val === MapLayerEnum.SIMPLE_MAP:
				// 使用 geoq 的底图
				this.url =
					'https://map.geoq.cn/arcgis/rest/services/ChinaOnlineStreetPurplishBlue/MapServer/tile/{z}/{y}/{x}'
				break
		}
	}
}
</script>
<style lang="less">
@import '../../styles/base';
@import '../../styles/map/my-leaflet';
@import '../../styles/typhoon/typhoonDivicon';
@import '../../styles/station/stationIcon';
@import '../../styles/isosurface/isosurface';

.leaflet-control-attribution {
	a {
		svg {
			visibility: hidden;
		}
	}
}

#map_content {
	// 此处放在base.less中的@centermap中
	// padding: 10px;
	flex: 5;
	display: flex;
	flex-direction: column;
	// 留出右侧的 信息栏 的位置
	// margin-right: 50px;
	@centermap();
	@center();

	#process {
		display: flex;
		z-index: 1500;
		width: 100%;

		.progress {
			width: 100%;
		}
	}

	// TODO:[-] 20-06-18 添加的 overlayer 的样式
	.leaflet-control-layers-list label {
		color: black !important;
	}

	// 20-08-04 覆盖一下leaflet的control-zoom 样式
	.leaflet-control-container {
		.leaflet-top {
			top: 60px;
		}
	}
}
</style>
