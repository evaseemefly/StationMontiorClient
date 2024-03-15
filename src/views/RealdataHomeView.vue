<template>
	<div class="home">
		<div class="layout-top">
			<div class="layout-right"><RealdataMapView></RealdataMapView></div>
		</div>
		<!-- 温带预报系统底部的主要操作按钮栏 -->
		<div class="layout-bottom"><WdSubNavMenuView></WdSubNavMenuView></div>
		<!-- <WaveGridForecastDataFormView></WaveGridForecastDataFormView> -->
		<StationInlandSurgeDataFormView
			:startTs="issueTs"
			:endTs="endTs"
			:issueTs="issueTs"
		></StationInlandSurgeDataFormView>
		<!-- <div><StationTideFormView></StationTideFormView></div> -->
		<StationBreviaryListView
			:startTs="issueTs"
			:endTs="endTs"
			:distStationAstronmictideList="distStationAstronmictideList"
			:distStationRealdataList="distStationRealdataList"
			:distStationsAlertlevelList="distStationsAlertlevelList"
			:distStationBaseInfoList="distStationBaseInfoList"
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
import WdSubNavMenuView from '@/components/nav/WdSubNavMenuView.vue'
// import MainMapView from '@/views/map/MapView.vue'
import ForecastMapView from '@/views/map/ForecastMapView.vue'
import RealdataMapView from '@/views/map/RealdataMapView.vue'
import ThumbListView from '@/components/thumbs/thumbListView.vue'
import HeaderLogoView from '@/components/header/headerLogoView.vue'
import WdLegendListView from '@/components/toolsBar/wdLegendListView.vue'
import WaveGridForecastDataFormView from '@/components/forms/WaveGridForecastDataForm.vue'
import StationInlandSurgeDataFormView from '@/components/forms/StationInlandSurgeDataFormView.vue'
import StationBreviaryListView from '@/components/table/stationBreviaryListView.vue'
import StationSurgeDataFormView from '@/components/forms/StationSurgeDataFormView.vue'
import RegionStatisticsCard from '@/components/cards/regionStatisticsCard.vue'

// 默认值
import { DEFAULT_DATE, DEFAULT_TIMESTAMP, DEFAULT_TY_NUM } from '@/const/default'
// vuex
import {
	SET_WAVE_PRODUCT_ISSUE_DATETIME,
	GET_WAVE_PRODUCT_LAYER_TYPE,
	SET_WAVE_PRODUCT_ISSUE_TIMESTAMP,
	GET_ISSUE_TS,
	GET_TIMESPAN,
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
} from '@/api/surge'
import { loadDistStationBaseInfoList, loadDistStationsAlertLevelList } from '@/api/station'

// middle_model
import { DistStationSurgeListMidModel } from '@/middle_model/surge'

/** + 24-03-11 实况Home页 */
@Component({
	components: {
		MainNavMenuView,
		WdSubNavMenuView,
		// MainMapView,
		ForecastMapView,
		ThumbListView,
		HeaderLogoView,
		WdLegendListView,
		WaveGridForecastDataFormView,
		// StationSurgeDataFormView,
		StationInlandSurgeDataFormView,
		RegionStatisticsCard,
		StationBreviaryListView,
		RealdataMapView,
	},
})
export default class RealdataHomeView extends Vue {
	// issueTs = 1690804800

	/** 当前的海洋站潮位list */
	surgeStationList: IStationInfo[] = []

	/** 海洋站基础信息 集合 */
	distStationBaseInfoList: StationBaseInfoMidModel[] = []

	/** + 24-03-13 所有站点的实况增水极值列表 */
	distStationSurgeRealdataMaximumList: {
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

	isLoading = false

	mounted() {
		// step1: 加载所有站点的当前实况集合
		this.loadDistStationRealdataList(this.issueTs, this.endTs)
		// step2:加载所有站点的警戒潮位集合
		this.loadDistStationAlertlevelList()
		// step3: 加载所有站点的天文潮集合
		this.loadDistStationAstronomictideList(this.issueTs, this.endTs)
		// step4: 加载所有站点的基础信息
		this.loadDistStationBaseInfoList()
	}

	//TODO:[*] 24-03-14 测试时暂时替换为固定值
	/** 当前的发布时间 单位 s */
	// @Getter(GET_ISSUE_TS, { namespace: 'common' })
	issueTs = 1708344000

	//TODO:[*] 24-03-14 测试时暂时替换为固定值
	/** 起止时间间隔 单位s  */
	// @Getter(GET_TIMESPAN, { namespace: 'common' })
	timespan = 82800

	/** 结束时间戳 (issueTs+ timespan) 单位 s */
	get endTs(): number {
		return this.issueTs + this.timespan
	}

	/** { issueTs, startTs, endTs } options */
	get timestampOpt(): { issueTs: number; endTs: number } {
		const { issueTs, endTs } = this
		return { issueTs, endTs }
	}

	@Watch('timestampOpt')
	onTimestampOpt(val: { startTs: number; endTs: number }): void {
		this.loadDistStationRealdataList(val.startTs, val.endTs)
	}

	/** 加载所有站点的实况极值集合
	 * step 1: 加载所有站点的实况及和
	 */
	loadDistStationRealdataMaximumList(startTs: number, endTs: number) {
		this.isLoading = true
		loadAllStationRealdataMaximumList(startTs, endTs)
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
				this.isLoading = false
			})
	}

	/** 加载所有站点实况集合 */
	loadDistStationRealdataList(startTs: number, endTs: number) {
		this.isLoading = true
		loadDistStationRealdataList(startTs, endTs)
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
				this.isLoading = false
			})
	}

	loadDistStationAlertlevelList() {
		loadDistStationsAlertLevelList().then((res) => {
			this.distStationsAlertlevelList = res.data
		})
	}

	loadDistStationAstronomictideList(startTs, endTs) {
		loadDistAstronomictideList(startTs, endTs).then((res) => {
			this.distStationAstronmictideList = res.data.map((temp) => {
				return new DistStationSurgeListMidModel(
					temp.station_code,
					temp.forecast_ts_list,
					temp.tide_list
				)
			})
		})
	}

	/** 加载所有站点的基础信息集合 */
	loadDistStationBaseInfoList() {
		loadDistStationBaseInfoList().then((res) => {
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
		})
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
