<template>
	<div class="home">
		<div class="layout-top">
			<div class="layout-right"><RealdataMapView></RealdataMapView></div>
		</div>
		<!-- 温带预报系统底部的主要操作按钮栏 -->
		<div class="layout-bottom"><RealdataSubNavMenuView></RealdataSubNavMenuView></div>
		<DisplayTabsView :maxCount="5"></DisplayTabsView>
		<!-- <WaveGridForecastDataFormView></WaveGridForecastDataFormView> -->
		<StationDataFormView
			:isFinished="isFinished"
			:distStationAstronmictideList="distStationAstronmictideList"
			:distStationRealdataList="distStationRealdataList"
			:distStationsAlertlevelList="distStationsAlertlevelList"
			:distStationBaseInfoList="distStationBaseInfoList"
			:distStationNameDicts="distStationNameDicts"
		></StationDataFormView>
		<!-- <div><StationTideFormView></StationTideFormView></div> -->
		<StationBreviaryListView
			:isLoading="isLoading"
			:isFinished="isFinished"
			:distStationAstronmictideList="distStationAstronmictideList"
			:distStationRealdataList="distStationRealdataList"
			:distStationsAlertlevelList="distStationsAlertlevelList"
			:distStationBaseInfoList="distStationBaseInfoList"
			:distStationNameDicts="distStationNameDicts"
			:distStationSurgeRealdataExtremumList="distStationSurgeRealdataExtremumList"
		></StationBreviaryListView>
		<!-- <StationExtremumListView :tyNum="tyNum"></StationExtremumListView> -->
		<ThumbListView></ThumbListView>
		<HeaderLogoView title="业务化海洋观测系统"></HeaderLogoView>
		<WdLegendListView></WdLegendListView>
	</div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { Getter, Mutation, State, namespace } from 'vuex-class'

import MainNavMenuView from '@/components/nav/MainNavMenuView.vue'
import RealdataSubNavMenuView from '@/components/nav/RealdataSubNavMenuView.vue'
// import MainMapView from '@/views/map/MapView.vue'
import ForecastMapView from '@/views/map/ForecastMapView.vue'
import RealdataMapView from '@/views/map/RealdataMapView.vue'
import ThumbListView from '@/components/thumbs/thumbListView.vue'
import HeaderLogoView from '@/components/header/headerLogoView.vue'
import WdLegendListView from '@/components/toolsBar/wdLegendListView.vue'
import WaveGridForecastDataFormView from '@/components/forms/WaveGridForecastDataForm.vue'
import StationDataFormView from '@/components/forms/StationDataFormView.vue'
import StationBreviaryListView from '@/components/table/stationBreviaryListView.vue'
import StationSurgeDataFormView from '@/components/forms/StationSurgeDataFormView.vue'
import RegionStatisticsCard from '@/components/cards/regionStatisticsCard.vue'
import DisplayTabsView from '@/components/table/father/displayTabsView.vue'

// 默认值
import { DEFAULT_DATE, DEFAULT_TIMESTAMP, DEFAULT_TY_NUM } from '@/const/default'
// vuex
import {
	SET_WAVE_PRODUCT_ISSUE_DATETIME,
	GET_WAVE_PRODUCT_LAYER_TYPE,
	SET_WAVE_PRODUCT_ISSUE_TIMESTAMP,
	GET_ISSUE_TS,
	GET_TIMESPAN,
	GET_END_DT,
	GET_START_DT,
} from '@/store/types'
import { LayerTypeEnum } from '@/enum/map'
// interface
import { IHttpResponse } from '@/interface/common'
// api
import { loadRecentWaveProductIssus } from '@/api/wave'
import moment from 'moment'
import { MS_UNIT } from '@/const/unit'
import { IStationInfo } from '@/interface/station'
import { StationBaseInfoMidModel } from '@/middle_model/station'
import {
	loadAllStationRealdataMaximumList,
	loadDistAstronomictideList,
	loadDistStationRealdataList,
	loadDistStationRealdataExtremumList,
} from '@/api/surge'
import { loadDistStationBaseInfoList, loadDistStationsAlertLevelList } from '@/api/station'

// middle_model
import { DistStationSurgeListMidModel } from '@/middle_model/surge'

/** + 24-03-11 实况Home页 */
@Component({
	components: {
		MainNavMenuView,
		RealdataSubNavMenuView,
		// MainMapView,
		ForecastMapView,
		ThumbListView,
		HeaderLogoView,
		WdLegendListView,
		WaveGridForecastDataFormView,
		StationDataFormView,
		RegionStatisticsCard,
		StationBreviaryListView,
		RealdataMapView,
		DisplayTabsView,
	},
})
export default class RealdataHomeView extends Vue {
	/** 海洋站基础信息 集合 */
	distStationBaseInfoList: StationBaseInfoMidModel[] = []

	/** + 24-03-13 起止时间范围内所有站点的实况增水极值列表(每个站点指定时间范围内有高高潮，低高潮等，非唯一)
	 *  目前未使用
	 */
	distStationSurgeRealdataMaximumList: {
		station_code: string
		issue_ts: number
		surge: number
	}[] = []

	/** 不同站点的极值集合——唯一(每日极值——精确至min) */
	distStationSurgeRealdataExtremumList: {
		station_code: string
		issue_ts: number
		surge: number
	}[] = []

	/** + 24-03-14 所有站点的警戒潮位集合 */
	distStationsAlertlevelList: {
		station_code: string
		alert_tide_list: number[]
		alert_level_list: number[]
	}[] = []

	/** 所有站点天文潮集合 */
	distStationAstronmictideList: DistStationSurgeListMidModel[] = []

	/** 所有站点实况集合 */
	distStationRealdataList: DistStationSurgeListMidModel[] = []

	/** 海洋站名称中英文对照字典 */
	distStationNameDicts: { name: string; chname: string; sort: number }[] = []

	/** 控制加载遮罩 */
	isLoading = false
	/** 通知子组件所有异步请求均执行结束 */
	isFinished = false

	/** 一次性加载所有异步请求 */
	async initLoad() {
		this.isLoading = false
		this.isFinished = false
		// 一次性加载所有所需异步请求
		return Promise.all([
			this.loadDistStationRealdataList(this.issueTs, this.endTs),
			this.loadDistStationAlertlevelList(),
			this.loadDistStationAstronomictideList(this.issueTs, this.endTs),
			this.loadDistStationBaseInfoList(),
			this.loadDistStationRealdataExtremumList(this.issueTs, this.endTs),
		]).then(() => {
			console.log('执行所有异步请求完毕')
			this.isLoading = true
			this.isFinished = true
			this.loadDistStationNameDicts(this.distStationBaseInfoList)
		})
	}

	mounted() {
		this.isFinished = false
		this.initLoad()
	}

	//TODO:[*] 24-03-14 测试时暂时替换为固定值
	/** 当前的发布时间 单位 s */
	// @Getter(GET_ISSUE_TS, { namespace: 'common' })
	issueTs = 1708344000
	endTs = 0

	//TODO:[*] 24-03-14 测试时暂时替换为固定值
	/** 起止时间间隔 单位s  */
	// @Getter(GET_TIMESPAN, { namespace: 'common' })
	timespan = 82800

	/** 结束时间戳 (issueTs+ timespan) 单位 s */
	// get endTs(): number {
	// 	return this.issueTs + this.timespan
	// }

	/** 从站点基础信息集合提取 站点code:name 字典
	 * this.distStationBaseInfoList
	 */
	loadDistStationNameDicts(val: StationBaseInfoMidModel[]) {
		let stationDicts = []
		stationDicts = val.map((temp) => {
			return { name: temp.stationCode, chname: temp.stationName, sort: temp.sort }
		})
		this.distStationNameDicts = stationDicts
	}

	/** 加载所有站点的实况极值集合
	 * (每个站点指定时间范围内有高高潮，低高潮等，非唯一)
	 *  暂时不使用
	 */
	loadDistStationRealdataMaximumList(startTs: number, endTs: number) {
		// this.isLoading = true
		return loadAllStationRealdataMaximumList(startTs, endTs)
			.then((res) => {
				if (res.status == 200) {
					// TODO:[-] 23-08-28 由于distStationsTotalSurgeList需要传入子组件中，排序放在外侧执行
					// const sortedRes = res.data.sort((a, b) => {
					// 	return a.sort - b.sort
					// })
					this.distStationSurgeRealdataMaximumList = res.data
				}
			})
			.then(() => {
				// this.isLoading = false
			})
	}

	/** 加载所有站点的实况极值(分钟级)
	 * 24-03-28 bug:之前未作为 Promise<void> 出现了隐藏的bug
	 */
	loadDistStationRealdataExtremumList(startTs: number, endTs: number) {
		return loadDistStationRealdataExtremumList(startTs, endTs).then((res) => {
			if (res.status == 200) {
				this.distStationSurgeRealdataExtremumList = res.data
			}
		})
	}

	/** 加载所有站点实况集合 */
	loadDistStationRealdataList(startTs: number, endTs: number) {
		// this.isLoading = true
		return loadDistStationRealdataList(startTs, endTs)
			.then((res) => {
				if (res.status == 200) {
					// TODO:[-] 23-08-28 由于distStationsTotalSurgeList需要传入子组件中，排序放在外侧执行
					this.distStationRealdataList = res.data.map((temp) => {
						return new DistStationSurgeListMidModel(
							temp.station_code,
							temp.ts_list,
							temp.surge_list
						)
					})
				}
			})
			.then(() => {
				// this.isLoading = false
				console.log('loadDistStationRealdataList over')
			})
	}

	/** 加载所有站点的警戒潮位集合 */
	loadDistStationAlertlevelList() {
		return loadDistStationsAlertLevelList()
			.then((res) => {
				if (res.status == 200) {
					this.distStationsAlertlevelList = res.data
				}
			})
			.then(() => {
				console.log('loadDistStationAlertlevelList over')
			})
	}

	/** 加载所有站点的天文潮集合 */
	loadDistStationAstronomictideList(startTs, endTs) {
		return loadDistAstronomictideList(startTs, endTs)
			.then((res) => {
				if (res.status == 200) {
					this.distStationAstronmictideList = res.data.map((temp) => {
						return new DistStationSurgeListMidModel(
							temp.station_code,
							temp.forecast_ts_list,
							temp.tide_list
						)
					})
				}
			})
			.then(() => {
				console.log('loadDistStationAstronomictideList over')
			})
	}

	/** 加载所有站点的基础信息集合 */
	loadDistStationBaseInfoList() {
		return loadDistStationBaseInfoList()
			.then((res) => {
				if (res.status == 200) {
					this.distStationBaseInfoList = res.data.map((temp) => {
						return new StationBaseInfoMidModel(
							temp.pid,
							temp.code,
							temp.name,
							temp.lat,
							temp.lon,
							temp.sort
						)
					})
				}
			})
			.then(() => {
				console.log('loadDistStationBaseInfoList over')
			})
	}

	@Getter(GET_END_DT, { namespace: 'common' })
	getEndDt: Date

	@Getter(GET_START_DT, { namespace: 'common' })
	getStartDt: Date

	get DtOpts(): { getStartDt: Date; getEndDt: Date } {
		const { getStartDt, getEndDt } = this
		return { getStartDt, getEndDt }
	}

	@Watch('DtOpts')
	onDtOp(val: { getStartDt: Date; getEndDt: Date }) {
		this.issueTs = moment(val.getStartDt).valueOf() / MS_UNIT
		this.endTs = moment(val.getEndDt).valueOf() / MS_UNIT
		// this.issueTs = val.getStartDt.getTime()
		// this.endTs = val.getEndDt.getTime()
		this.initLoad()
	}
}
</script>

<style scoped lang="less">
@import '../styles/base';
.home {
	@center();
	flex-direction: column;
	.layout-top {
		height: 100%;
		// background: green;
		display: flex;
		flex-direction: row;
		.layout-left {
			margin: 5px;
			background: #34495e;
			border-radius: 8px;
			box-shadow: 0 0 10px 0px black;
		}
		.layout-right {
			margin-top: 5px;
			width: 100%;
			background: #34495e;
			border-radius: 8px;
			margin-right: 5px;
			margin-bottom: 5px;
			box-shadow: 0 0 10px 0px black;
			// 防止地图溢出
			overflow: hidden;
		}
	}
	.layout-bottom {
		height: 50px;
		// TODO:[-] 22-10-17 win 系统中的浏览器会出现垂直和水平的滚动条
		// width: 100%;
		background: #34495e;
		border-radius: 8px;
		margin: 5px;
		box-shadow: 0 0 10px 0px black;
		display: flex;
		align-content: center;
		justify-content: center;
	}
}
</style>
