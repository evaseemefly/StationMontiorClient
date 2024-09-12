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
		<!-- <DisplayTabsView :maxCount="5"></DisplayTabsView> -->
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
			:startTs="issueTs"
			:endTs="endTs"
			:isFinished="isLoadSiteFinished"
			:distStationAstronmictideList="distStationAstronmictideList"
			:distStationRealdataList="distStationRealdataList"
			:distStationsAlertlevelList="distStationsAlertlevelList"
			:distStationBaseInfoList="distStationBaseInfoList"
			:distStationWindRealdataList="distStationWindRealdataList"
			:distStationNameDicts="distStationNameDicts"
			:allSiteRealdataList="selectedSiteRealdataList"
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
import {
	DEFAULT_DATE,
	DEFAULT_TIMESTAMP,
	DEFAULT_TY_NUM,
	DEFAULT_VAL,
	DEFAULT_VAL_LIST,
	MAX_SURGE,
} from '@/const/default'
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
	SET_STATIONS_D85_LIST,
	GET_STATIONS_D85_LIST,
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
import {
	loadDistStationBaseInfoList,
	loadDistStationsAlertLevelList,
	loadStationsRealdataPerclock,
} from '@/api/station'
import { getConsulKV } from '@/api/opts'
import { loadAllFubsBaseInfo, loadFubsRealdataPerclock } from '@/api/fub'
import { loadSitesRealdataListPerclock } from '@/api/realdata'

// middle_model
import { DistStationSurgeListMidModel } from '@/middle_model/surge'
import { DistStationWindListMidModel } from '@/middle_model/wind'
import { ObservationTypeEnum } from '@/enum/common'
import { RouterView } from 'vue-router'
import { fillDefaultVal2List, standardSurgeAndTsVals } from '@/util/filter'
import station from '@/store/modules/station'

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

	/** 所有站点实况集合
	 * TODO:[*] 24-06-27 此处存在歧义，此处为选中的站点的实况集合
	 */
	distStationRealdataList: DistStationSurgeListMidModel[] = []

	/** @deprecated TODO:[*] 24-06-27 目前选中的站点实况集合  */
	selecetdStationRealdataList: DistStationSurgeListMidModel[] = []

	/** 所有站点的风要素集合 */
	distStationWindRealdataList: DistStationWindListMidModel[] = []

	/** 海洋站名称中英文对照字典 */
	distStationNameDicts: { name: string; chname: string; sort: number }[] = []

	/** 所有浮标站点的基础信息集合 */
	allFubBaseInfoList: FubBaseInfoMidModel[] = []

	/** TODO:[-] 24-05-08 所有站点的各要素集合
	 * - 24-05-28 缺少根据站点分类请求 fub | station 接口(目前只请求 fub 接口)
	 * 选中的站点的实况(fub|station)
	 */
	selectedSiteRealdataList: ObserveValueMidModel[] = []

	/** 所有站点(含:station|fub) */
	allSites: SiteBaseInfoMidModel[] = []

	/** 所有浮标站点的 codes */
	allFubsCodes: string[] = []

	/** 控制加载遮罩 */
	isLoading = false
	/** 通知子组件所有异步请求均执行结束 */
	isFinished = false

	/** asyc 加载选定站点实况 */
	isLoadSiteFinished = false

	/** TODO:[*] 24-06-20 加载所有静态数据——海洋站与浮标 静态数据 */
	async initStaticsData() {
		this.allSites = []
		this.allFubsCodes = []
		return Promise.all([this.loadAllStationBaseInfoList(), this.loadAllFubsBaseInfo()])
	}

	/** 一次性加载所有异步请求 */
	async initLoad(startTs: number, endTs: number) {
		this.isLoading = false
		this.isFinished = false

		// 一次性加载所有所需异步请求
		return Promise.all([
			this.loadDistStationSurgeRealdataList(startTs, endTs),
			this.loadDistStationAlertlevelList(),
			this.loadDistStationAstronomictideList(startTs, endTs),
			// TODO:[-] 24-06-20 注意此处存在一个隐藏的bug，所有站点与浮标的基础信息应只在页面首次加载（或刷新时加载一次即可——静态数据），不需要每次有监听变量发生改变就重新加载一次
			// this.loadAllStationBaseInfoList(),
			this.loadDistStationRealdataExtremumList(startTs, endTs),
		])
			.then(() => {
				console.log('执行所有异步请求完毕')
				this.loadDistStationNameDicts(this.distStationBaseInfoList)
			})
			.finally(() => {
				console.log('执行RealData final')
			})
			.catch(() => {
				console.log('执行RealData -> initLoad 出现异常')
			})
	}

	/**
	 * 执行加载实况(loadSitesRealdata)以及是否加载静态统计数据(initStatisticalData)
	 * @param startDt
	 * @param endDt
	 * @param sites
	 * @param isUpdateStaticData 是否加载静态数据，默认加载
	 */
	async initRealData(
		startDt: Date,
		endDt: Date,
		sites: SiteBaseDigestMidModel[],
		isUpdateStaticData = true
	) {
		// TODO:[-] 24-06-20 此处加载的 start 与 end time 与传入的时间有歧义
		const startTs = moment(startDt).valueOf() / MS_UNIT
		const endTs = moment(endDt).valueOf() / MS_UNIT
		// TODO:[-] 24-06-20 加载各静态及统计信息之前由onDtOp监听并执行，现统一修改于onSitesOpts 顺序执行

		let promiseSeqences = [this.loadSitesRealdata(sites, startTs, endTs)]
		if (isUpdateStaticData) {
			promiseSeqences.push(this.initStatisticalData(startTs, endTs))
		}

		// Promise.all([
		// 	// TODO:[*] 24-09-11 不需要每次都加载静态数据
		// 	this.initStatisticalData(startTs, endTs),
		// 	this.loadSitesRealdata(sites, startTs, endTs),
		// ]).then(() => {
		// 	// TODO:[-] 24-06-20 此处修改为加载统计数据与加载站点实况均加载完毕后再更新loaded开关
		// 	this.setLoaded()
		// })

		Promise.all(promiseSeqences).then(() => {
			// TODO:[-] 24-06-20 此处修改为加载统计数据与加载站点实况均加载完毕后再更新loaded开关
			this.setLoaded()
		})
	}

	mounted() {
		this.isFinished = false
		// TODO:[-] 24-06-28 页面加载时根据 GET_START_DT 与 GET_END_DT 获取起止时间
		this.issueTs = moment(this.getStartDt).valueOf() / MS_UNIT
		this.endTs = moment(this.getEndDt).valueOf() / MS_UNIT
		// TODO:[-] 24-06-20 此处重构:只在页面加载时进行静态数据的加载(initStaticsData) -> 加载其他数据(initLoad)
		this.initStaticsData()
			.then(() => {
				this.initRealData(this.getStartDt, this.getEndDt, this.getSites)
			})
			.finally(() => {
				// TODO:[-] 24-06-27 注意加载静态信息(stations | fubs)信息后不修改加载完毕变量,统计信息未加载完毕
				// this.setLoaded()
			})
		// getConsulKV('station_base_config').then((res) => {
		// 	console.log(`获取consul中的kv值:${res.data}`)
		// })
	}

	/** TODO:[*] 24-06-20 设置子组件加载完毕开关(执行则全部加载完毕) */
	setLoaded() {
		this.isLoading = true
		this.isLoadSiteFinished = true
		this.isFinished = true
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

	/** 加载所有站点实况集合
	 * @deprecated 24-06-24
	 * TODO:[*] 24-06-27 需要调用此方法，注意添加 distStationRealdataList 变量(全站点——海洋站)
	 */
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
							if (
								DEFAULT_VAL_LIST.includes(temp.surge_list[index]) ||
								temp.surge_list[index] > MAX_SURGE
							) {
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

	/** [-] 24-05-07 加载指定站点的实况
	 * - 24-06-04 此处修改为与 fub获取所有要素的接口签名一致
	 * 此方法暂时为备份,不再使用，重写
	 * @deprecated 已弃用
	 */
	loadSitesRealdatabackup(sites: SiteBaseDigestMidModel[], startTs: number, endTs: number) {
		let that = this
		// TODO:[-] 24-05-21 此处修改为监听到 sites 发生变化，统一更新一次
		let sitesRealdata: ObserveValueMidModel[] = []
		that.selectedSiteRealdataList = []
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
		that.selectedSiteRealdataList = sitesRealdata
	}

	/** TODO:[-] 24-05-07 加载指定站点的实况
	 * - 24-06-04 此处修改为与 fub获取所有要素的接口签名一致
	 */
	async loadSitesRealdata(sites: SiteBaseDigestMidModel[], startTs: number, endTs: number) {
		let that = this

		this.isLoadSiteFinished = false
		/** 站点实况集合
		 * TODO:[-] 24-05-21 此处修改为监听到 sites 发生变化，统一更新一次
		 */
		let sitesRealdata: ObserveValueMidModel[] = []
		// TODO:[-] 24-06-14 每次load之前不要清空当前allSiteRealdataList会触发子组件执行hide操作
		// that.allSiteRealdataList = []
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

		/** 以下根据观测站类型进行遍历的promise方法集合 */
		let promises = []
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
			// TODO:[-] 24-06-06 应该修改为根据不同的观测手段请求不同的接口拼接接口结果
			let loadRealdataFunc = loadStationsRealdataPerclock
			switch (tempType) {
				case ObservationTypeEnum.STATION:
					loadRealdataFunc = loadStationsRealdataPerclock
					break
				case ObservationTypeEnum.FUB:
					loadRealdataFunc = loadFubsRealdataPerclock
					break
				default:
					break
			}
			promises.push(
				loadRealdataFunc(codes, startTs, endTs).then((res) => {
					if (res.status == 200) {
						console.log(`RealdataHomeView加载:${tempType}ing`)
						res.data.map((s) => {
							const tempCode: string = s.code
							// TODO:[*] 24-08-01 对于d85的处理不放在此处进行
							// const tempD85filter = that.getStationsD85List.filter((val) => {
							// 	return val.code == tempCode
							// })
							// /** 当前 code 对应的d85差值 */
							// const tempD85: number =
							// 	tempD85filter.length > 0 ? tempD85filter[0].d85 : DEFAULT_VAL
							const tempObsType: ObservationTypeEnum = s.obs_type
							const tempObsValues: ObserveElementMidModel[] = s.observation_list.map(
								(o) => {
									let standardVals: (number | null)[] = fillDefaultVal2List<
										number | null
									>(o.val_list, DEFAULT_VAL_LIST)
									// // TODO:[*] 24-08-01 此处加入对于所选站点实况-d85
									// standardVals = standardVals.map((val) => val - tempD85)
									return new ObserveElementMidModel(
										o.station_code,
										o.element_type,
										o.ts_list,
										standardVals
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
			)
		}
		await Promise.all(promises)
			.then(() => {
				console.log(
					`RealdataHomeView.vue -> allSiteRealdataList: 加载全部promises结束,count:${sitesRealdata.length}`
				)
				// TODO:[-] 24-06-12 引发后续bug的根源，之前是将此赋值放在整个 Promise 外侧引发了bug
				that.selectedSiteRealdataList = sitesRealdata
				// this.isLoadSiteFinished = true
			})
			.catch(() => {
				// TODO:[-] 24-06-14 在执行加载 sites realdata 的异步操作中的 catch 与 finally 中加入失败或未加载则清空实况的操作(clearSitesRealdata)
				this.clearSitesRealdata()
			})
			.finally(() => {
				if (sitesRealdata.length == 0) {
					this.clearSitesRealdata()
				}
			})
	}

	/** TODO:[-] 24-06-14 清空 allSiteRealdataList 统一在此方法处执行 */
	private clearSitesRealdata() {
		console.log(`RealdataHomeView.vue -> clearSitesRealdata`)
		this.selectedSiteRealdataList = []
	}

	/** 加载所有站点的基础信息集合
	 *  + 24-07-31 并通过为 vuex 赋值 d85 list
	 */
	loadAllStationBaseInfoList() {
		const that = this
		this.distStationBaseInfoList = []
		let stationsD85List: { code: string; d85: number }[] = []
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
						if (temp.is_in_use == true) {
							const tempStationInstance = new StationBaseInfoMidModel(
								temp.pid,
								temp.code,
								temp.name,
								temp.lat,
								temp.lon,
								temp.sort
							)
							this.distStationBaseInfoList.push(tempStationInstance)

							stationsD85List.push({
								code: tempStationInstance.stationCode,
								d85: temp.d85,
							})
						} else {
							console.log(`未使用的站点:${temp.name}`)
						}
						const tempSite: SiteBaseInfoMidModel = new SiteBaseInfoMidModel(
							temp.code,
							temp.name,
							temp.lat,
							temp.lon,
							ObservationTypeEnum.STATION,
							temp.sort,
							temp.is_in_use
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
				console.log('set stations d85 list!')
				this.setStationsD85List(stationsD85List)
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

	// @Watch('getSites')
	// onSites(val: SiteBaseDigestMidModel[]) {
	// 	this.loadSitesRealdata(val, this.issueTs, this.endTs)
	// }

	get SitesOpts(): { getStartDt: Date; getEndDt: Date; getSites: SiteBaseDigestMidModel[] } {
		const { getStartDt, getEndDt, getSites } = this
		return { getStartDt, getEndDt, getSites }
	}

	/** TODO:[*] 24-06-17 此处替换原@Watch('getSites') 的操作，需要监听起止时间的变化 */
	@Watch('SitesOpts')
	onSitesOpts(
		newVal: { getStartDt: Date; getEndDt: Date; getSites: SiteBaseDigestMidModel[] },
		oldVal: { getStartDt: Date; getEndDt: Date; getSites: SiteBaseDigestMidModel[] }
	) {
		console.log(
			`RealdataHomeView.vue -> onSitesOpts 监听到:${newVal.getStartDt},${
				newVal.getEndDt
			},${newVal.getSites.map((temp) => {
				return temp.stationCode
			})}发生变化`
		)

		/** 是否需要触发统计数据 */
		const isUpdateStaticData = !(
			newVal.getStartDt.getTime() == oldVal.getStartDt.getTime() &&
			newVal.getEndDt.getTime() == oldVal.getEndDt.getTime()
		)
		// TODO:[-] 24-06-20 此处加载的 start 与 end time 与传入的时间有歧义
		this.initRealData(newVal.getStartDt, newVal.getEndDt, newVal.getSites, isUpdateStaticData)
	}

	/** 获取当前选定的站点 */
	@Getter(GET_SITE, { namespace: 'station' })
	getSites: SiteBaseDigestMidModel[]

	/** 获取所有站点的d85高程差值 */
	@Getter(GET_STATIONS_D85_LIST, { namespace: 'station' })
	getStationsD85List: { code: string; d85: number }[]

	/** 设置所有站点的d85高程差集合 */
	@Mutation(SET_STATIONS_D85_LIST, { namespace: 'station' })
	setStationsD85List: { (val: { code: string; d85: number }[]): void }

	/** TODO:[*] 24-06-20
	 * 根据起止时间加载
	 * 警戒潮位
	 * 天文潮
	 * 各个站点极值
	 */
	initStatisticalData(startTs: number, endTs: number): Promise<void> {
		this.issueTs = startTs
		this.endTs = endTs
		// TODO:[-] 24-06-21 此处导致对子组件处理天文潮计算造成潜在的bug——此部分应放置在 onSitesOpts 统一执行
		return this.initLoad(startTs, endTs)
	}

	/** @deprecated */
	@Watch('DtOpts')
	onDtOp(val: { getStartDt: Date; getEndDt: Date }) {
		// this.issueTs = moment(val.getStartDt).valueOf() / MS_UNIT
		// this.endTs = moment(val.getEndDt).valueOf() / MS_UNIT
		// // TODO:[-] 24-06-21 此处导致对子组件处理天文潮计算造成潜在的bug——此部分应放置在 onSitesOpts 统一执行
		// return this.initLoad()
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

function Deprecated() { throw new Error('Function not implemented.') }
