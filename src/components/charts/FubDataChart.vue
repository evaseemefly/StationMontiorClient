<template>
	<div
		id="station_scalar_form"
		class="my-detail-form"
		v-loading="isLoading"
		element-loading-spinner="el-icon-loading"
		element-loading-background="rgba(49, 59, 89, 0.733)"
	>
		<div class="left-section"></div>
		<div class="right-section">
			<!-- 对于非集合路径才提供叠加天文潮位的选项 -->
			<div class="observe-kind-select">
				<el-select v-model="weatherKind" placeholder="请选择">
					<el-option
						v-for="item in weatherKinds"
						:key="item.id"
						:label="item.title"
						:value="item.kind"
					>
						<span style="float: left">{{ item.title }}</span>
						<span style="float: right; color: #8492a6; font-size: 13px">{{
							item.subtitle
						}}</span>
					</el-option>
				</el-select>
			</div>

			<div id="observe_chart"></div>
			<div class="down-section">
				<ObserveElementValsTableView :obsVals="obsVals"></ObserveElementValsTableView>
			</div>
		</div>
	</div>
</template>
<script lang="ts">
import * as echarts from 'echarts'
import chroma from 'chroma-js'

import { ObserveElementMidModel } from '@/middle_model/obs'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import ObserveElementValsTableView from '@/components/table/ObserveElementValsTable.vue'
import { ObserveElementEnum, WeatherKindEnum } from '@/enum/element'
import { number } from 'echarts'
import { fortmatData2YMDHM } from '@/util/filter'
import { getDate } from '@/util/dateUtil'

/** fub data chart */
@Component({ components: { ObserveElementValsTableView } })
export default class FubDataChart extends Vue {
	isLoading = false
	/** 站点的各种观测要素及实况集合 */
	@Prop({ type: Array, default: () => [] })
	obsVals: ObserveElementMidModel[]

	/** 选择的气象要素种类(含海洋-海浪) */
	weatherKind: WeatherKindEnum = WeatherKindEnum.WIND

	/** 下拉框对应的要素 */
	weatherKinds: { kind: WeatherKindEnum; title: string; subtitle: string }[] = [
		{ kind: WeatherKindEnum.WIND, title: '风要素', subtitle: '风速+最大风速' },
		{ kind: WeatherKindEnum.WAVE, title: '海浪要素', subtitle: '平均波高+有效波高' },
		{ kind: WeatherKindEnum.AIRPRESSURE, title: '气压', subtitle: '气压' },
	]

	/** 当前的图表charts对象(唯一) */
	myChart: echarts.ECharts = null

	yAxisMax = 30
	yAxisMin = 0
	chartSubTitle = ''

	seriesMap: Map<ObserveElementEnum, string> = new Map([
		[ObserveElementEnum.WS, '风速'],
		[ObserveElementEnum.WSM, '最大风速'],
		[ObserveElementEnum.YBG, '有效波高'],
		[ObserveElementEnum.BG, '平均波高'],
		[ObserveElementEnum.BP, '气压'],
	])

	/** 根据选择的气象要素加载不同的chart */
	initChart(kind: WeatherKindEnum): void {
		switch (kind) {
			case WeatherKindEnum.AIRPRESSURE:
				this.loadAirPressureChart()
				break
			case WeatherKindEnum.WIND:
				this.loadWindChart()
				break
			case WeatherKindEnum.WAVE:
				this.loadWaveChart()
				break
			default:
				break
		}
	}

	/** 加载海浪要素至chart */
	loadWaveChart(): void {
		/** 从当前传入的 obsVals 过滤海浪要素 */
		const waveObs = this.obsVals.filter((temp) => {
			return (
				temp.elementType == ObserveElementEnum.YBG ||
				temp.elementType == ObserveElementEnum.BG
			)
		})

		// 加载最大风速以及风速
		const tsList: number[] = waveObs[0].tsList
		// 设置最大值
		let maxVal = 0

		const obsVals: { yList: number[]; fieldName: ObserveElementEnum }[] = waveObs.map(
			(temp) => {
				const tempMax: number = Math.max(...temp.valList)
				if (tempMax > maxVal) {
					maxVal = tempMax
				}
				return { fieldName: temp.elementType, yList: temp.valList }
			}
		)
		this.yAxisMax = maxVal
		this.loadChart(tsList, obsVals, '海浪要素')
	}

	/** 加载气压要素要素至chart */
	loadAirPressureChart(): void {
		/** 从当前传入的 obsVals 过滤海浪要素 */
		const bpObs = this.obsVals.filter((temp) => {
			return temp.elementType == ObserveElementEnum.BP
		})

		// 加载最大风速以及风速
		const tsList: number[] = bpObs[0].tsList
		let maxVal = 0
		const obsVals: { yList: number[]; fieldName: ObserveElementEnum }[] = bpObs.map((temp) => {
			const tempMax: number = Math.max(...temp.valList)
			if (tempMax > maxVal) {
				maxVal = tempMax
			}
			return { fieldName: temp.elementType, yList: temp.valList }
		})
		this.yAxisMax = maxVal
		this.loadChart(tsList, obsVals, '气压要素')
	}

	/** 加载风要素至chart
	 * 加载风要素从当前 obsVals 中获取风要素相关信息，并初始化 chart
	 */
	loadWindChart(): void {
		const that = this
		/** 风要素相关的结果 */
		const filterWindRes = this.obsVals.filter((temp) => {
			return [ObserveElementEnum.WS, ObserveElementEnum.WSM].includes(temp.elementType)
		})
		// 加载最大风速以及风速
		const tsList: number[] = filterWindRes[0].tsList
		// 设置最大值
		let maxVal = 0
		const obsVals: { yList: number[]; fieldName: ObserveElementEnum }[] = filterWindRes.map(
			(temp) => {
				const tempMax: number = Math.max(...temp.valList)
				if (tempMax > maxVal) {
					maxVal = tempMax
				}
				return { fieldName: temp.elementType, yList: temp.valList }
			}
		)
		this.yAxisMax = maxVal
		this.loadChart(tsList, obsVals, '风要素')
	}

	//yVals: { yList: number[]; fieldName: string }[],

	loadChart(
		xList: number[],
		yVals: { yList: number[]; fieldName: ObserveElementEnum }[],
		title: string
	): void {
		// areaVals: { vals: number[]; fieldName: string }=null
		// yVals: { yList: number[]; fieldName: string }[]=[]

		const xDates: Date[] = xList.map((temp) => {
			return getDate(temp)
		})
		const that = this
		const echartsId = 'observe_chart'
		const nodeDiv = document.getElementById(echartsId)
		let myChart: echarts.ECharts = null
		// TODO:[-] 23-08-24 若当前 mychart 已经被初始化，则需要先销毁
		if (this.myChart != null) {
			// [ECharts] Instance ec_1692844450070 has been disposed
			// this.myChart.dispose()
			myChart = echarts.getInstanceByDom(nodeDiv)
		} else {
			myChart = echarts.init(nodeDiv)
		}
		if (nodeDiv) {
			// There is a chart instance already initialized on the dom.

			let legendData: {
				elementType: ObserveElementEnum
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
				const elementFieldName: string = this.seriesMap.get(element.fieldName)
				const tempLegend: {
					elementType: ObserveElementEnum
					name: string
					itemStyle: {
						color: string
					}
					textStyle: {
						color: string
					}
				} = {
					elementType: element.fieldName,
					name: elementFieldName,
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
						// data: [{ xAxis: that.currentForecastDtIndex }],
					},
				}
				series.push(tempSeries)
			}

			//
			that.yAxisMax = Math.max(...[that.yAxisMax])

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
						for (let index = 0; index < params.length; index++) {
							const temp = params[index]
							/** 对应的 fieldName 枚举 int -> str */
							const tempSeriesName: string = temp.seriesName
							/** fieldName 枚举 str->int */
							const tempEnumIndex: number = parseInt(tempSeriesName)
							/** fieldName 枚举 */
							const tempElementEnum = ObserveElementEnum[tempEnumIndex]
							const seriesName: string = that.seriesMap.get(tempEnumIndex)
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
						data: xDates,
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
			// TODO:[*] 23-04-03
			// ERROR:`setOption` should not be called during main process.
			myChart.setOption(option)
			myChart.getZr().on('click', (params) => {
				console.log(`点击所有区域${params}`)
			})
			myChart.on('timelinechanged', (params) => {
				console.log(`时间轴中的时间点发生改变:${params}`)
			})
			if (!this.myChart) {
				this.myChart = myChart
			}
		}
	}

	// @Watch('obsVals')
	// onObsVals(val: ObserveElementMidModel[]): void {
	// 	this.loadWindChart()
	// }

	// @Watch('weatherKind')
	// onWeatherKind(kind: WeatherKindEnum): void {
	// 	this.initChart(kind)
	// }

	/** 监听 obsVals与weatherKind发生变化 */
	get getObsOpts(): { obsVals: ObserveElementMidModel[]; weatherKind: WeatherKindEnum } {
		const { obsVals, weatherKind } = this
		return { obsVals, weatherKind }
	}

	@Watch('getObsOpts')
	onObsOpts(val: { obsVals: ObserveElementMidModel[]; weatherKind: WeatherKindEnum }): void {
		this.initChart(val.weatherKind)
	}
}
</script>
<style lang="less">
@import '../../styles/station/station-chart.less';
// @import url('../../styles/base-form.less');
// TODO:[-] 24-05-16 由于element-ui 的下拉框组件的 z-index 默认为2003，而本form的组件z-index为9998，需要手动设置element-ui的层级级别，注意需要去掉scoped!
.el-select-dropdown.el-popper {
	z-index: 9999 !important;
}
.my-detail-form {
	height: 100%;
	width: 100%;
}
// 观测要素chart
#observe_chart {
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
		.observe-kind-select {
			width: 200px;
			.el-select-dropdown {
				z-index: 9999 !important;
			}
			.el-select-dropdown.el-popper {
				z-index: 9999 !important;
			}
		}
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
