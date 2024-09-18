<template>
	<!-- <transition enter-active-class="animated fadeIn" leave-active-class="animated fadeOut"> -->
	<div
		id="station_scalar_form"
		class="my-detail-form"
		v-loading="isLoading"
		element-loading-spinner="el-icon-loading"
		element-loading-background="rgba(49, 59, 89, 0.733)"
	>
		<div class="left-section">
			<div class="info-card base-info">
				<!-- 增水极值 -->
				<div class="card-top">
					<ExtremumDetailProgressView
						:value="extremumSurge.val"
						title="增水极值"
						:footerText="extremumSurge.dt"
						:lineWidth="84"
						:alertTides="alertLevels"
					></ExtremumDetailProgressView>
					<ExtremumDetailProgressView
						:value="extremumTotalSurge.val"
						title="总潮位极值"
						:footerText="extremumTotalSurge.dt"
						:lineWidth="84"
						:alertTides="alertLevels"
					></ExtremumDetailProgressView>
				</div>
				<div class="card-bottom">
					<div :key="index" v-for="(item, index) in alertLevels">
						<AlertLevelRowView
							:title="item.alert"
							:content="item.tide"
						></AlertLevelRowView>
					</div>
				</div>
			</div>
		</div>
		<div class="right-section">
			<!-- 对于非集合路径才提供叠加天文潮位的选项 -->
			<div id="surge_scalar_chart"></div>
			<div class="down-section">
				<!-- + 23-08-24 不传入 总潮位集合 totalSurgeList 改为在组件内计算生成 -->
				<SurgeValsTableInLand
					:tideList="tideList"
					:forecastDtList="dtList"
					:surgeList="surgeList"
					:propHoverIndex="hoverDtIndex"
					:alertLevels="alertLevels"
					:wsList="wsList"
					:wdList="wdList"
					:wsTsList="windTsList"
					:isLoading="isLoading"
				></SurgeValsTableInLand>
			</div>
		</div>
	</div>
	<!-- </transition> -->
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Getter, Mutation, State, namespace } from 'vuex-class'
import * as echarts from 'echarts'
import * as L from 'leaflet'
import chroma from 'chroma-js'
// 常量
import {
	DEFAULT_ALERT_TIDE,
	DEFAULT_BOX_LOOP_LATLNG,
	DEFAULT_DATE,
	DEFAULT_STATION_CODE,
	DEFAULT_STATION_NAME,
	DEFAULT_SURGE_VAL,
	DEFAULT_VAL,
} from '@/const/default'
// 接口
import { IHttpResponse } from '@/interface/common'

import SurgeValsTableInLand from '@/components/table/SurgeValsTableInland.vue'
import SubNavOffsetTimeItem from '@/components/nav/subItems/SubNavOffsetTimeItem.vue'
import ExtremumDetailProgressView from '@/components/progress/extremumDetailProgressView.vue'
// store
import {
	GET_CURRENT_FORECAST_DT,
	GET_STATIONS_BASEINFO_LIST,
	GET_STATIONS_D85_LIST,
	GET_STATION_CODE,
	GET_SURGE_TD_STEP,
	GET_TIMESPAN,
} from '@/store/types'
//
// api
import { loadInLandAstronomictideList } from '@/api/surge'
import { loadTargetStationSurgeForecastList, loadInLandAlertLevels } from '@/api/forecast/surge'
import { loadStaionRegionCountry, loadStationStaus } from '@/api/station'
import { loadVectorForecastListByPoint } from '@/api/vector'
// 工具方法
// filter
import {
	fortmatData2YMDHM,
	formatTs2DayHM,
	filterProductTypeName,
	filterLatlng2Str,
	formatSurge2Str,
	formatSurgeFixed2Str,
} from '@/util/filter'
import moment from 'moment'

import { LayerTypeEnum } from '@/enum/map'

import { AlertTideEnum } from '@/enum/surge'
import { StationBaseInfoMidModel } from '@/middle_model/station'
import { MS_UNIT } from '@/const/unit'
import AlertLevelRowView from '../rows/alertLevelRow.vue'

/** TODO:[-] 24-09-18 潮位站legend的英文name与中文name的转换 */
const formatterLegendName = (name: string): string => {
	const dict_legend = new Map([
		['tide', '天文潮'],
		['surge', '实况潮位'],
		['difftide', '风暴增水'],
	])
	return dict_legend.has(name) ? dict_legend.get(name) : '默认'
}

@Component({
	filters: {
		filterProductTypeName,
		filterLatlng2Str,
		fortmatData2YMDHM,
		formatSurge2Str,
		formatSurgeFixed2Str,
		formatTs2DayHM,
	},
	components: {
		SurgeValsTableInLand,
		SubNavOffsetTimeItem,
		ExtremumDetailProgressView,
		AlertLevelRowView,
	},
})
export default class StationDataChart extends Vue {
	get isLoading() {
		return !this.isFinished
	}
	// isLoading = false

	offsetNum = 0

	/** 当前的图表charts对象(唯一) */
	myChart: echarts.ECharts = null

	/** 预报时间列表 */
	forecastDtList: Date[] = []
	dtList: Date[] = []
	/** 总潮位集合 : 增水 surge + 天文潮 tide */
	totalSurgeList: number[] = []

	issueTs: Date = new Date()

	/** 当前站点code */
	@Prop({ type: String, default: DEFAULT_STATION_CODE })
	stationCode: string

	/** 天文潮 */
	@Prop({ type: Array, default: () => [] })
	tideList: number[]

	/** 增水(surgeList) */
	@Prop({ type: Array, default: () => [] })
	surgeList: number[]

	/** 风速集合 */
	@Prop({ type: Array, default: () => [], required: false })
	wsList: number[]

	/** 风向集合 */
	@Prop({ type: Array, default: () => [], required: false })
	wdList: number[]

	/** 时间戳数组 */
	@Prop({ type: Array, default: () => [], required: false })
	tsList: number[]

	/** 风场的时间戳集合 */
	@Prop({ type: Array, default: () => [], required: false })
	windTsList: number[]

	/** 数据加载完毕 */
	@Prop({ type: Boolean, default: false, required: false })
	isFinished

	/** 站点name */
	@Prop({ type: String, default: DEFAULT_STATION_NAME, required: false })
	stationName: string

	/** TODO:[*] 24-06-17 用来监听起止时间变化
	 * 起始时间戳
	 */
	@Prop({ type: Number, default: () => 0 })
	startTs: number

	/**TODO:[*] 24-06-17 用来监听起止时间变化
	 * 结束时间戳 */
	@Prop({ type: Number, default: () => 0 })
	endTs: number

	/** 预报值(天文潮)列表 */
	forcastValList: number[] = []

	yAxisMin = 0
	yAxisMax = 0

	chartTitle = 'xxx站潮位'
	chartSubTitle = '--'
	/** 当前的预报产品种类 */
	productType: LayerTypeEnum = LayerTypeEnum.UN_LAYER
	/** 当前选中的位置 */
	latlng: L.LatLng = DEFAULT_BOX_LOOP_LATLNG

	/**TODO:[*] 24-03-26
	 * 警戒潮位不需要需要由父组件传入
	 * 由 this.alertLevels 提取
	 *  */
	alertBlue: number = DEFAULT_ALERT_TIDE
	alertYellow: number = DEFAULT_ALERT_TIDE
	alertOrange: number = DEFAULT_ALERT_TIDE
	alertRed: number = DEFAULT_ALERT_TIDE

	/** + 24-04-02 当前选中的站点的增水极值 */
	extremumSurge: { val: number; dt: Date } = { val: 0, dt: DEFAULT_DATE }

	/** + 24-04-02 当前选中的站点的总潮位极值 */
	extremumTotalSurge: { val: number; dt: Date } = { val: 0, dt: DEFAULT_DATE }

	/** TODO:[*] 24-03-26
	 * 需要由父组件传入
	 * 警戒潮位及对应值 */
	@Prop({ type: Array, default: () => [] })
	alertLevels: { tide: number; alert: AlertTideEnum }[]

	/** 用来绑定当前组件中需要显示的站点基础信息
	 *
	 */
	stationBaseInfo: {
		station_code: string
		station_name: string
		lat: number
		lon: number
		rid: number
		val_en: string
		val_ch: string
		cid: number
		country_en: string
	} = {
		station_code: '-',
		station_name: '-',
		lat: 0,
		lon: 0,
		rid: 0,
		val_en: '',
		val_ch: '',
		cid: 0,
		country_en: '',
	}

	/** 当前站点的经纬度 纬度 */
	lat = 0
	/** 当前站点的经纬度 经度 */
	lon = 0

	seriesMap: Map<string, string> = new Map([
		['tide', '天文潮'], // this.tideList
		['difftide', '增水'], // this.surgeList
		['surge', '实况潮位'], // this.totalSurgeList
	])

	created() {
		console.log('Created StationDataChart Vue')
		// if (this.chartOpts.isFinished) {
		// 	console.log(`StationDataChart mounted -> to do toInitCharts`)
		// 	this.toInitCharts(this.chartOpts.stationCode)
		// }
	}

	/** 鼠标移入 chart 中的 index */
	hoverDtIndex = 0
	/** 表格中的海浪观测数据 */
	tableWaveValsList: { mwd: number; mwp: number; forecastDt: Date }[] = []

	mounted() {
		// 由于 父组件通过 v-if 展示此组件，导致prop 的 isFinished,stationCode 发生变化(理应发生变化时)本组件还未被创建
		// TODO:[-] 24-06-12 注意此处生命周期 created 可以访问数据，但页面中的dom并未渲染，所以初始化echart不能在created 时执行，需要在mounted 中执行
		if (this.chartOpts.isFinished) {
			console.log(`StationDataChart mounted -> to do toInitCharts`)
			this.toInitCharts(this.chartOpts.stationCode)
		}
	}

	loadStationRegionCountry(code: string): void {
		loadStaionRegionCountry(code).then(
			(
				res: IHttpResponse<{
					station_code: string
					station_name: string
					lat: number
					lon: number
					rid: number
					val_en: string
					val_ch: string
					cid: number
					country_en: string
				}>
			) => {
				this.stationBaseInfo = { ...res.data }
				this.lat = this.stationBaseInfo.lat
				this.lon = this.stationBaseInfo.lon
			}
		)
	}

	/** 初始化并加载 echarts
	 * + 23-10-16 加入了 风速 与 风向
	 */
	initCharts(
		xList: Date[],
		yVals: { yList: number[]; fieldName: string }[],
		areaVals: { vals: number[]; fieldName: string },
		title: string,
		selectIndex: number
	): void {
		console.log(`StationDataChart -> initCharts`)
		const that = this
		const echartsId = 'surge_scalar_chart'
		/** TODO:[-] 24-06-13 注意此处有可能为空——为何为空
		 * 由于之前在 created 钩子事件中执行该方法 dom 元素尚未被渲染
		 */
		const nodeDiv: HTMLElement | null = document.getElementById(echartsId)
		// TODO:[-] 24-06-07 会出现不创建 chart 的情况
		if (this.myChart != null || this.myChart != undefined) {
			console.log(`当前this.mychart已经存在`)
		}

		// step1: 初始化 chart 实例
		// TODO:[-] 24-06-13 第二次点击其他站点会出现以下警告 [ECharts] There is a chart instance already initialized on the dom.
		// 尝试在创建前先销毁chart dom
		echarts.dispose(nodeDiv)
		let myChart: echarts.ECharts = echarts.init(nodeDiv)
		// TODO:[-] 23-08-24 若当前 mychart 已经被初始化，则需要先销毁
		// TODO:[-] 24-06-05 注意由于使用了动态组件，切换时每次会重新加载本组件，故不存在mychart，需要重新init 24-6-12 Error: Initialize failed: invalid dom.
		// There is a chart instance already initialized on the dom.

		let legendData: {
			name: string
			itemStyle: {
				color: string
			}
			textStyle: {
				color: string
			}
		}[] = []
		let series = []
		let scale = chroma.scale([
			// '#00429d',
			// '#4771b2',
			'#73a2c6',
			'#a5d5d8',
			'#ffffe0',
			'#ffbcaf',
			'#f4777f',
			'#cf3759',
			'#93003a',
		])
		/** 传入的不同变量的总数 */
		let fieldsCount: number = yVals.length + 1
		for (let index = 0; index < yVals.length; index++) {
			const element = yVals[index]
			const tempLegend: {
				name: string
				itemStyle: {
					color: string
				}
				textStyle: {
					color: string
				}
			} = {
				name: element.fieldName,
				itemStyle: {
					color: scale(index / fieldsCount).hex(),
				},
				textStyle: {
					color: scale(index / fieldsCount).hex(),
				},
			}
			legendData.push(tempLegend)

			const tempSeries = {
				name: element.fieldName,
				type: 'line',
				silent: false,

				lineStyle: { color: scale(index / fieldsCount).hex() },
				emphasis: {
					focus: 'series',
				},
				data: element.yList,
				showSymbol: false,
				smooth: true,
				markPoint: {
					symbol: 'circle',
					symbolSize: 2,
					data: [
						{ type: 'max', name: 'Max' },
						{ type: 'min', name: 'Min' },
					],
					symbolOffset: [0, '-500%'],
					label: {
						color: '#fff',
					},
				},
				markLine: {
					symbol: ['none', 'none'],
					label: { show: false },
					data: [{ xAxis: that.currentForecastDtIndex }],
				},
			}
			series.push(tempSeries)
		}
		// TODO:[-] 23-04-11 加入 area series
		const element = areaVals
		const tempLegend: {
			name: string
			itemStyle: {
				color: string
			}
			textStyle: {
				color: string
			}
		} = {
			name: element.fieldName,
			itemStyle: {
				color: '#f39c12',
			},
			textStyle: {
				color: '#f39c12',
			},
		}
		legendData.push(tempLegend)

		const tempSeries = {
			name: element.fieldName,
			type: 'line',
			silent: false,
			areaStyle: {
				opacity: 0.8,
				color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
					{
						offset: 0,
						color: '#f1c40f',
					},
					{
						offset: 1,
						color: '#e67e22',
					},
				]),
			},
			lineStyle: { color: '#f1c40f' },
			emphasis: {
				focus: 'series',
			},
			data: element.vals,
			showSymbol: false,
			smooth: true,
			markPoint: {
				symbol: 'circle',
				symbolSize: 2,
				data: [
					{ type: 'max', name: 'Max' },
					{ type: 'min', name: 'Min' },
				],
				symbolOffset: [0, '-500%'],
				label: {
					color: '#fff',
				},
			},
			markLine: {
				symbol: ['none', 'none'],
				label: { show: false },
				data: [{ xAxis: that.currentForecastDtIndex }],
			},
		}
		series.push(tempSeries)

		// TODO:[*] 23-07-25 添加四色警戒潮位
		// TODO: 21-08-25 新加入的四色警戒潮位标线
		series.push({
			name: '警戒潮位',
			type: 'line',
			markLine: {
				symbol: 'none', // 虚线不显示端点的圆圈及箭头
				itemStyle: {
					color: 'rgb(19, 184, 196)',
				},
				data: [
					{
						name: '蓝色警戒潮位',
						yAxis: this.alertBlue,
					},
				],
			},
		})
		series.push({
			name: '警戒潮位',
			type: 'line',
			markLine: {
				symbol: 'none',
				itemStyle: {
					color: 'rgb(245, 241, 20)',
				},
				data: [
					{
						name: '黄色警戒潮位',
						yAxis: this.alertYellow,
					},
				],
			},
		})
		series.push({
			name: '警戒潮位',
			type: 'line',
			markLine: {
				symbol: 'none',
				itemStyle: {
					color: 'rgb(235, 134, 19)',
				},
				data: [
					{
						name: '橙色警戒潮位',
						yAxis: this.alertOrange,
					},
				],
			},
		})
		series.push({
			name: '警戒潮位',
			type: 'line',
			markLine: {
				symbol: 'none',
				itemStyle: {
					color: 'rgb(241, 11, 11)',
					lineStyle: {
						cap: 'round',
						type: 'dotted',
					},
				},
				data: [
					{
						name: '红色警戒潮位',
						yAxis: this.alertRed,
					},
				],
			},
		})
		//
		that.yAxisMax = Math.max(
			...[that.yAxisMax, that.alertBlue, that.alertYellow, that.alertOrange, that.alertRed]
		)

		// step2: 创建配置项及数据
		const option = {
			title: {
				text: title,
				subtext: that.chartSubTitle,
				textStyle: {
					color: '#f8f8f7',
				},
			},
			tooltip: {
				trigger: 'axis',
				showContent: true,
				axisPointer: {
					type: 'cross',
				},
				formatter: function (params, ticket, callback) {
					/** 
						 * params[0].name
							'Thu Mar 02 2023 15:00:00 GMT+0800 (中国标准时间)'
							params[1].seriesName
							'tide'
							params[1].value
							2.36
						 */
					//x轴名称
					const dt = params[0].name
					const dtStr: string = fortmatData2YMDHM(dt)
					let html = '' + dtStr + '<br />'
					// TODO:[*] 24-07-15 对于增水显示为 undefined , 增水实际 name为 "difftide"
					for (let index = 0; index < params.length; index++) {
						const temp = params[index]
						const seriesName: string = that.seriesMap.get(temp.seriesName)
						const seriesVal: string = isNaN(temp.value) ? '-' : temp.value
						// 拼接为 line
						const tempHtml = `${seriesName}:${seriesVal}` + '<br />'
						html = html + tempHtml
					}
					return html
				},
			},
			legend: {
				data: legendData,
				right: '10%',
				formatter: function (name: string): string {
					return formatterLegendName(name)
				},
			},
			grid: {
				left: '3%',
				right: '4%',
				bottom: '3%',
				containLabel: true,
			},
			xAxis: [
				{
					type: 'category',
					boundaryGap: false,
					// data: that.forecastDateList,
					data: xList,
					nameTextStyle: {
						color: '#f8f8f7',
					},
					axisLabel: {
						textStyle: {
							color: '#f8f8f7', //字体颜色
							fontSize: 12, //字体大小
						},
						formatter: (val: Date) => {
							return fortmatData2YMDHM(val)
						},
					},
				},
			],
			yAxis: [
				{
					type: 'value',
					nameTextStyle: {
						color: '#f8f8f7',
					},
					axisLabel: {
						textStyle: {
							color: '#f8f8f7', //字体颜色
							fontSize: 12, //字体大小
						},
					},
					min: that.yAxisMin,
					max: that.yAxisMax,
					// scale: true
				},
			],
			series: series,
		}
		// TODO:[-] 22-07-05 加入多条集合路径曲线
		const lineStyle = {
			width: 1,
			opacity: 0.5,
		}

		// TODO:[-] 24-06-05 使用 fub 与 station 动态切换会出现没有 setOption 方法的错误 —— chart 并未被成功创建
		// TypeError: Cannot read properties of undefined (reading 'setOption')
		// step3: 将配置项及数据赋给 chart 实例
		myChart.setOption(option)
		myChart.getZr().on('click', (params) => {
			console.log(`点击所有区域${params}`)
		})
		myChart.on('timelinechanged', (params) => {
			console.log(`时间轴中的时间点发生改变:${params}`)
		})
		this.myChart = myChart

		this.extractExtremumSurge()
		this.extractExtremumTotalSurge()
	}

	testMarkLine(index: number): void {
		if (this.myChart !== null) {
			const options = this.myChart.getOption()
			if (options['series'] !== undefined) {
				// @ts-ignore
				if (options['series'].length > 0) {
					options['series'][0]['markLine'] = {
						symbol: ['none', 'none'],
						label: { show: false },
						data: [{ xAxis: this.currentForecastDtIndex }],
					}
				}
			}
			this.myChart.setOption(options)
			// console.log(options)
		}
	}

	/** + 23-08-30 设置时间偏移量 */
	updateOffset(val: number): void {
		this.offsetNum = val
	}

	/** 23-05-10 修改后的逻辑 forecastDt 为 end date */
	@Getter(GET_CURRENT_FORECAST_DT, { namespace: 'common' }) getForecastDt: Date

	@Getter(GET_STATION_CODE, { namespace: 'station' }) getStationCode: string

	@Getter(GET_SURGE_TD_STEP, { namespace: 'common' }) getSurgeTdStep: number

	@Getter(GET_TIMESPAN, { namespace: 'common' }) getTimespan: number

	/** 获取海洋站的基础信息集合 */
	@Getter(GET_STATIONS_BASEINFO_LIST, { namespace: 'station' })
	getStationBaseInfoList: StationBaseInfoMidModel[]

	@Watch('currentForecastDtIndex')
	onCurrentForecastDtIndex(val: number): void {
		this.testMarkLine(val)
	}

	/** TODO:[-] 23-10-12 注意修改 stationBaseInfo 是再此方法中实现 */
	setStationBaseInfo(stationCode: string): void {
		this.stationCode = stationCode
		const stationTemp = this.getStationBaseInfoList.filter((val) => {
			return val.stationCode === stationCode
		})
		if (stationTemp.length > 0) {
			this.stationBaseInfo.station_code = stationTemp[0].stationCode
			this.stationBaseInfo.val_en = stationTemp[0].stationCode
			this.stationBaseInfo.station_name = stationTemp[0].stationName
			this.stationBaseInfo.val_ch = stationTemp[0].stationName
			this.stationBaseInfo.lat = stationTemp[0].lat
			this.stationBaseInfo.lon = stationTemp[0].lon
		}
	}

	/** 监听到 stationBaseInfo 发生变化提取 lat,lon 赋值给 当前 lat,lon 变量 */
	@Watch('stationBaseInfo', { immediate: true, deep: true })
	onStationBaseInfo(val: {
		station_code: string
		station_name: string
		lat: number
		lon: number
		rid: number
		val_en: string
		val_ch: string
		cid: number
		country_en: string
	}): void {
		this.lat = val.lat
		this.lon = val.lon
	}

	@Watch('getStationCode')
	onGetStationCode(code: string): void {
		this.stationCode = code
		this.setStationBaseInfo(code)
	}

	/** 24-04-02 根据 surgeList 提取对应的极值以及对应时间*/
	extractExtremumSurge(): void {
		const maxVal = Math.max(...this.surgeList)
		const maxValIndex = this.surgeList.findIndex((temp) => {
			return temp == maxVal
		})
		const maxValDt: Date = new Date(this.tsList[maxValIndex] * MS_UNIT)
		this.extremumSurge = { val: maxVal, dt: maxValDt }
	}

	/** 24-04-02 根据 totalSurgeList 提取对应的极值及对应时间 */
	extractExtremumTotalSurge(): void {
		const maxVal = Math.max(...this.totalSurgeList)
		const maxValIndex = this.totalSurgeList.findIndex((temp) => {
			return temp == maxVal
		})
		const maxValDt: Date = new Date(this.tsList[maxValIndex] * MS_UNIT)
		this.extremumTotalSurge = { val: maxVal, dt: maxValDt }
	}

	/** 当前预报时间在 forecastDtList 中的所在 index */
	get currentForecastDtIndex(): number {
		const current: Date = this.getForecastDt
		const filterDtIndex: number = this.forecastDtList.findIndex((temp) => {
			return current.getTime() === temp.getTime()
		})
		return filterDtIndex
	}

	get getChartTile(): string {
		return this.getStationCode + '站潮位'
	}

	/** chart监听的变量(若其一发生改变则初始化chart) */
	get chartOpts(): { isFinished: boolean; stationCode: string; startTs: number; endTs: number } {
		const { isFinished, stationCode, startTs, endTs } = this
		return { isFinished, stationCode, startTs, endTs }
	}

	/** 监听是否完成加载的操作,
	 * 加入根据各类list为 yAxisMax 赋值的步骤
	 */
	@Watch('chartOpts')
	onChartOpts(val: {
		isFinished: boolean
		stationCode: string
		startTs: number
		endTs: number
	}): void {
		// this.loadStationRegionCountry(val.stationCode)
		if (val.isFinished) {
			console.log(`watch chartOpts -> to do toInitCharts`)
			this.toInitCharts(val.stationCode)
		}
	}

	/** 由onChartOpts提取到外部
	 * 初始化charts
	 */
	toInitCharts(code: string) {
		console.log(
			`[-]执行StationDataChart->toInitCharts.${code},surge:count:${this.surgeList.length},tide:count:${this.tideList.length}`
		)
		//step1: 为总潮位赋值
		this.totalSurgeList = []
		// const d85filter = this.getStationsD85List.filter((val) => {
		// 	return val.code == code
		// })

		this.spliceAlerts2Instance(this.alertLevels)
		for (let index = 0; index < this.tideList.length; index++) {
			// TODO:[-] 24-09-06 此处加入判断若增水与天文潮有一个值为null则将总潮位赋值为null
			let element: number | null = null
			if (this.tideList[index] != null && this.surgeList[index] != null) {
				element = this.tideList[index] + this.surgeList[index]
			} else {
				element = null
			}
			this.totalSurgeList.push(element)
		}
		// const d85: number = d85filter.length > 0 ? d85filter[0].d85 : DEFAULT_VAL
		// /** 标准化后的总潮位集合 */
		// const standardTotalSurgeList = this.totalSurgeList.map((val) => val - d85)
		let dtList: Date[] = []
		dtList = this.tsList.map((ts) => {
			return new Date(ts * MS_UNIT)
		})
		this.dtList = dtList
		this.yAxisMax = Math.max(...this.surgeList, ...this.tideList, ...this.totalSurgeList)
		this.yAxisMin = Math.min(...this.surgeList, ...this.tideList, ...this.totalSurgeList)
		this.initCharts(
			dtList,
			[
				{ fieldName: 'surge', yList: this.totalSurgeList },
				{ fieldName: 'tide', yList: this.tideList },
			],
			{ fieldName: 'difftide', vals: this.surgeList },
			'站点实况',
			0
		)
	}

	/** 将传入的 alerts 按照警戒潮位登记 赋值给 alertBlue ....  */
	spliceAlerts2Instance(alerts: { tide: number; alert: AlertTideEnum }[]): void {
		alerts.map((alert) => {
			if (alert.alert == AlertTideEnum.BLUE) {
				this.alertBlue = alert.tide
			}
			if (alert.alert == AlertTideEnum.YELLOW) {
				this.alertYellow = alert.tide
			}
			if (alert.alert == AlertTideEnum.ORANGE) {
				this.alertOrange = alert.tide
			}
			if (alert.alert == AlertTideEnum.RED) {
				this.alertRed = alert.tide
			}
		})
	}
}
</script>
<style scoped lang="less">
@import '../../styles/station/station-chart.less';
// @import url('../../styles/base-form.less');
.my-detail-form {
	height: 100%;
	width: 100%;
}
// 潮位chart
#surge_scalar_chart {
	// height: 100%;
	height: 250px;
	width: 100%;
}
#station_scalar_form {
	// @form-base-background();
	// height: 100%;
	// width: 100%;
	flex-direction: row;
	.left-section {
		background: #2c3e50;
		display: flex;
		// flex: 1;
		// width: 200px;
		flex-direction: row;
		justify-content: center;
		.info-card {
			color: white;
			// width: 45%;
			width: 150px;
			margin: 5px;
			padding: 5px;
			display: flex;
			flex-direction: column;
			h3 {
				display: flex;
				border-bottom: 1px solid #c4ccd6;
				padding: 5px;
				font-size: 18px;
				align-items: center;
				letter-spacing: 0.36px;
			}
			.row {
				// justify-content: space-between;
				display: flex;
				justify-content: space-between;
				font-size: 14px;
				line-height: 24px;
			}
			.card-top {
				display: flex;
				flex-direction: column;
				flex-grow: 5;
			}
			.card-bottom {
				flex-grow: 4;
			}
		}
	}
	.right-section {
		width: 1060px;
		max-width: 1200px;
		padding: 5px;
		margin: 5px;
		display: flex;
		// flex: 5;
		flex-direction: column;
		div.down-section {
			display: flex;
			flex-direction: column;
			align-items: center;
		}
	}
	// 不再使用此种布局
	.upper-section {
		// color: white;
		width: 100%;
		display: flex;
		flex-direction: row;
		justify-content: center;
	}
}
</style>
