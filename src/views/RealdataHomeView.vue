<template>
	<div class="home">
		<div class="layout-top">
			<div class="layout-right">
				<RealdataMapView
					:isLoading="isLoading"
					:isFinished="isFinished"
					:stationInfoList="distStationBaseInfoList"
					:distStationRealdataList="distStationRealdataList"
					:fubInfoList="allFubBaseInfoList"
					:sitesInfoList="allSites"
				></RealdataMapView>
			</div>
		</div>
		<!-- 温带预报系统底部的主要操作按钮栏 -->
		<div class="layout-bottom"><RealdataSubNavMenuView></RealdataSubNavMenuView></div>
		<DisplayTabsView :maxCount="5"></DisplayTabsView>
		<!-- <WaveGridForecastDataFormView></WaveGridForecastDataFormView> -->
		<!-- TODO:[-] 24-05-10 暂时不使用 -->
		<!-- <StationDataFormView
			:isFinished="isFinished"
			:distStationAstronmictideList="distStationAstronmictideList"
			:distStationRealdataList="distStationRealdataList"
			:distStationsAlertlevelList="distStationsAlertlevelList"
			:distStationBaseInfoList="distStationBaseInfoList"
			:distStationWindRealdataList="distStationWindRealdataList"
			:distStationNameDicts="distStationNameDicts"
		></StationDataFormView> -->
		<SiteDataFormView
			:isFinished="isFinished"
			:distStationAstronmictideList="distStationAstronmictideList"
			:distStationRealdataList="distStationRealdataList"
			:distStationsAlertlevelList="distStationsAlertlevelList"
			:distStationBaseInfoList="distStationBaseInfoList"
			:distStationWindRealdataList="distStationWindRealdataList"
			:distStationNameDicts="distStationNameDicts"
			:allSiteRealdataList="allSiteRealdataList"
			:allSites="allSites"
		></SiteDataFormView>
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
import SiteDataFormView from '@/components/forms/SiteDataFormView.vue'
import StationBreviaryListView from '@/components/table/stationBreviaryListView.vue'
import StationSurgeDataFormView from '@/components/forms/StationSurgeDataFormView.vue'
import RegionStatisticsCard from '@/components/cards/regionStatisticsCard.vue'
import DisplayTabsView from '@/components/table/father/displayTabsView.vue'

// 默认值
import { DEFAULT_DATE, DEFAULT_TIMESTAMP, DEFAULT_TY_NUM, DEFAULT_VAL_LIST } from '@/const/default'
// vuex
import {
	SET_WAVE_PRODUCT_ISSUE_DATETIME,
	GET_WAVE_PRODUCT_LAYER_TYPE,
	SET_WAVE_PRODUCT_ISSUE_TIMESTAMP,
	GET_ISSUE_TS,
	GET_TIMESPAN,
	GET_END_DT,
	GET_START_DT,
	GET_SITE,
} from '@/store/types'
import { LayerTypeEnum, StationIconLayerEnum } from '@/enum/map'
// interface
import { IHttpResponse } from '@/interface/common'
// api
import { loadRecentWaveProductIssus } from '@/api/wave'
import moment from 'moment'
import { MS_UNIT } from '@/const/unit'
import { IStationInfo } from '@/interface/station'
import { StationBaseInfoMidModel } from '@/middle_model/station'
import { SiteBaseDigestMidModel, SiteBaseInfoMidModel } from '@/middle_model/site'
import { FubBaseInfoMidModel } from '@/middle_model/fub'
import { ObserveElementMidModel, ObserveValueMidModel } from '@/middle_model/obs'
import {
	loadAllStationRealdataMaximumList,
	loadDistAstronomictideList,
	loadDistStationRealdataList,
	loadDistStationRealdataExtremumList,
} from '@/api/surge'
import { loadDistStationWindRealdataList } from '@/api/wind'
import { loadDistStationBaseInfoList, loadDistStationsAlertLevelList } from '@/api/station'
import { loadAllFubsBaseInfo } from '@/api/fub'
import { loadSitesRealdataListPerclock } from '@/api/realdata'

// middle_model
import { DistStationSurgeListMidModel } from '@/middle_model/surge'
import { DistStationWindListMidModel } from '@/middle_model/wind'
import { ObservationTypeEnum } from '@/enum/common'

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
		SiteDataFormView,
	},
})
export default class RealdataHomeView extends Vue {
	/** 所有海洋站基础信息 集合 */
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

	/** 所有站点的风要素集合 */
	distStationWindRealdataList: DistStationWindListMidModel[] = []

	/** 海洋站名称中英文对照字典 */
	distStationNameDicts: { name: string; chname: string; sort: number }[] = []

	/** 所有浮标站点的基础信息集合 */
	allFubBaseInfoList: FubBaseInfoMidModel[] = []

	/** TODO:[-] 24-05-08 所有站点的各要素集合 */
	allSiteRealdataList: ObserveValueMidModel[] = []

	/** 所有站点(含:station|fub) */
	allSites: SiteBaseInfoMidModel[] = []

	/** 所有浮标站点的 codes */
	allFubsCodes: string[] = []

	/** 控制加载遮罩 */
	isLoading = false
	/** 通知子组件所有异步请求均执行结束 */
	isFinished = false

	/** 一次性加载所有异步请求 */
	async initLoad() {
		this.isLoading = false
		this.isFinished = false
		this.allSites = []
		this.allFubsCodes = []
		// 一次性加载所有所需异步请求
		return Promise.all([
			this.loadDistStationSurgeRealdataList(this.issueTs, this.endTs),
			this.loadDistStationAlertlevelList(),
			this.loadDistStationAstronomictideList(this.issueTs, this.endTs),
			this.loadAllStationBaseInfoList(),
			this.loadDistStationRealdataExtremumList(this.issueTs, this.endTs),
			this.loadDistStationWindRealdataList(this.issueTs, this.endTs),
			//TODO:[*] 24-04-25 加载所有浮标站点基础信息
			this.loadAllFubsBaseInfo(),
		])
			.then(() => {
				console.log('执行所有异步请求完毕')
				this.isLoading = true
				this.isFinished = true
				this.loadDistStationNameDicts(this.distStationBaseInfoList)
			})
			.finally(() => {
				this.isFinished = true
				this.isLoading = true
				console.log('执行RealData final')
			})
			.catch(() => {
				console.log('执行RealData -> initLoad 出现异常')
				// this.isFinished = true
				// this.isLoading = true
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
		return loadDistStationRealdataExtremumList(startTs, endTs)
			.then((res) => {
				if (res.status == 200) {
					this.distStationSurgeRealdataExtremumList = res.data
				}
			})
			.catch(() => {
				console.log('loadDistStationRealdataExtremumList catch')
			})
	}

	/** 加载所有站点实况集合 */
	loadDistStationSurgeRealdataList(startTs: number, endTs: number) {
		// this.isLoading = true

		return loadDistStationRealdataList(startTs, endTs)
			.then((res) => {
				if (res.status == 200) {
					//  23-08-28 由于distStationsTotalSurgeList需要传入子组件中，排序放在外侧执行
					// 此处应加入判断，对于包含默认值的替换为None或null
					this.distStationRealdataList = res.data.map((temp) => {
						/** 标准化后的集合 */
						let standardSurgeList: number[] = []
						// 若为缺省值则填充null
						for (let index = 0; index < temp.surge_list.length; index++) {
							if (DEFAULT_VAL_LIST.includes(temp.surge_list[index])) {
								standardSurgeList.push(null)
							} else {
								standardSurgeList.push(temp.surge_list[index])
							}
						}
						return new DistStationSurgeListMidModel(
							temp.station_code,
							temp.ts_list,
							standardSurgeList
						)
					})
				}
			})
			.then(() => {
				// this.isLoading = false
				console.log('loadDistStationRealdataList over')
			})
			.catch(() => {
				console.log('loadDistStationRealdataList catch')
			})
	}

	/** 根据起止时间加载所有站点的风要素实况 */
	loadDistStationWindRealdataList(startTs, endTs) {
		return loadDistStationWindRealdataList(startTs, endTs)
			.then((res) => {
				if (res.status == 200) {
					this.distStationWindRealdataList = res.data.map((temp) => {
						return new DistStationWindListMidModel(
							temp.station_code,
							temp.ts_list,
							temp.ws_list,
							temp.dir_list
						)
					})
				}
			})
			.catch(() => {
				console.log('loadDistStationWindRealdataList catch')
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
			.catch(() => {
				console.log('loadDistStationAlertlevelList catch')
			})
	}

	/** 加载所有浮标站点基础信息集合 */
	loadAllFubsBaseInfo(): Promise<void> {
		let that = this
		return loadAllFubsBaseInfo()
			.then((res) => {
				if (res.status == 200) {
					res.data.forEach((tempFub) => {
						const tempFubInstance = new FubBaseInfoMidModel(
							tempFub.code,
							tempFub.name,
							tempFub.lat,
							tempFub.lon,
							tempFub.fub_type,
							tempFub.fub_kind
						)
						const tempSite: SiteBaseInfoMidModel = new SiteBaseInfoMidModel(
							tempFub.code,
							tempFub.name,
							tempFub.lat,
							tempFub.lon,
							ObservationTypeEnum.FUB
						)
						that.allSites.push(tempSite)
						that.allFubBaseInfoList.push(tempFubInstance)
					})
					// this.allFubBaseInfoList = res.data.map((tempFub) => {
					// 	const tempFubInstance = new FubBaseInfoMidModel(
					// 		tempFub.code,
					// 		tempFub.name,
					// 		tempFub.lat,
					// 		tempFub.lon,
					// 		tempFub.fub_type,
					// 		tempFub.fub_kind
					// 	)
					// 	return tempFubInstance
					// })
				}
			})
			.then((res) => {
				console.log('loading loadAllFubsBaseInfo end')
			})
			.catch(() => {
				console.log('loading loadAllFubsBaseInfo catch')
			})
			.finally(() => {
				console.log('loading loadAllFubsBaseInfo over')
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
			.catch(() => {
				console.log('loadDistStationAstronomictideList catch')
			})
	}

	/** TODO:[-] 24-05-07 加载指定站点的实况 */
	loadSitesRealdata(sites: SiteBaseDigestMidModel[], startTs: number, endTs: number) {
		let that = this
		// TODO:[-] 24-05-21 此处修改为监听到 sites 发生变化，统一更新一次
		let sitesRealdata: ObserveValueMidModel[] = []
		that.allSiteRealdataList = []
		/**
		 * 1- 获取传入的 sites 共有集中 观测站位类型(station|fub)
		 * 2- 根据不同的观测站位类型批量请求
		 * 3- 将返回的结果写入 allSiteRealdataList
		 */

		// 1- 获取传入的 sites 共有集中 观测站位类型(station|fub)
		const obsTypeSet = new Set(
			sites.map((s) => {
				return s.observationType
			})
		)

		/**
		 * TODO:[*] 24-05-20 注意此处批量加载sites未完成site form就已经打开。实际逻辑应为等sites全部加载完毕后再执行 form 中的操作 建议将以下批量调用 loadSiteRealdataListPerclock 方法改为 promise ，等待异步执行全部接手后统一加载 site form 组件
		 */
		// 2- 根据不同的观测站位类型批量请求
		for (const tempType of obsTypeSet) {
			const codes = sites
				.filter((temp) => {
					return temp.observationType == tempType
				})
				.map((site) => {
					return site.stationCode
				})
			// 2-2 批量获取 站位对应的实况
			loadSitesRealdataListPerclock(tempType, codes, startTs, endTs).then((res) => {
				if (res.status == 200) {
					console.log(res.data)
					res.data.map((s) => {
						const tempCode: string = s.code
						const tempObsType: ObservationTypeEnum = s.obs_type
						const tempObsValues: ObserveElementMidModel[] = s.observation_list.map(
							(o) => {
								return new ObserveElementMidModel(
									o.station_code,
									o.element_type,
									o.ts_list,
									o.val_list
								)
							}
						)
						const obsValMid = new ObserveValueMidModel(
							tempCode,
							tempObsType,
							tempObsValues
						)
						sitesRealdata.push(obsValMid)
					})
				}
			})
		}
		that.allSiteRealdataList = sitesRealdata
	}

	/** 加载所有站点的基础信息集合 */
	loadAllStationBaseInfoList() {
		const that = this
		this.distStationBaseInfoList = []
		return loadDistStationBaseInfoList()
			.then((res) => {
				if (res.status == 200) {
					// this.distStationBaseInfoList =
					res.data.map((temp) => {
						// return new StationBaseInfoMidModel(
						// 	temp.pid,
						// 	temp.code,
						// 	temp.name,
						// 	temp.lat,
						// 	temp.lon,
						// 	temp.sort
						// )
						const tempStationInstance = new StationBaseInfoMidModel(
							temp.pid,
							temp.code,
							temp.name,
							temp.lat,
							temp.lon,
							temp.sort
						)
						this.distStationBaseInfoList.push(tempStationInstance)
						const tempSite: SiteBaseInfoMidModel = new SiteBaseInfoMidModel(
							temp.code,
							temp.name,
							temp.lat,
							temp.lon,
							ObservationTypeEnum.STATION
						)
						that.allSites.push(tempSite)
					})
				}
			})
			.then(() => {
				console.log('loadAllStationBaseInfoList end')
			})
			.catch(() => {
				console.log('loadAllStationBaseInfoList catch')
			})
			.finally(() => {
				console.log('loadAllStationBaseInfoList over')
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

	@Watch('getSites')
	onSites(val: SiteBaseDigestMidModel[]) {
		this.loadSitesRealdata(val, this.issueTs, this.endTs)
	}

	/** 获取当前选定的站点 */
	@Getter(GET_SITE, { namespace: 'station' })
	getSites: SiteBaseDigestMidModel[]

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
