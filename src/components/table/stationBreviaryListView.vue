<template>
	<!-- <transition enter-active-class="form-show" leave-active-class="form-hide"> -->
	<transition enter-active-class="animated fadeInDown" leave-active-class="animated fadeOutUp">
		<div
			v-draggable
			id="station_list_main_layout"
			v-show="getIsShow"
			element-loading-background="rgba(28, 34, 52, 0.733)"
		>
			<!-- <div id="station_list_main_layout" v-show="getIsShow" class="animated fadeInDown"> -->
			<!-- <div id="station_list_main_layout" v-show="getIsShow"> -->
			<!-- <div class="animate__animated animate__fadeInDown">测试测试</div> -->
			<StationExtremumListView
				:title="'增水极值'"
				:isLoading="isLoading"
				:isFinished="isFinished"
				:stationNameDict="distStationNameDicts"
				:distStationAstronmictideList="distStationAstronmictideList"
				:distStationTotalSurgeList="distStationRealdataList"
			></StationExtremumListView>
			<StationAlertListView
				:title="'总潮位极值(整点级)'"
				:isFinished="isFinished"
				:isLoading="isLoading"
				:stationNameDicts="distStationNameDicts"
				:distStationsSurgeList="distStationRealdataMaximumList"
				:distStationsAlertlevelList="distStationsAlertlevelList"
			></StationAlertListView>
			<StationAlertListView
				:title="'总潮位极值(分钟级)'"
				:isFinished="isFinished"
				:isLoading="isLoading"
				:stationNameDicts="distStationNameDicts"
				:distStationsSurgeList="distStationRealdataExtremumList"
				:distStationsAlertlevelList="distStationsAlertlevelList"
			></StationAlertListView>
		</div>
	</transition>
</template>
<script lang="ts">
import {
	loadInlandStationList,
	loadStationAlertLevelDataList,
	loadStationNameDict,
} from '@/api/station'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Getter, Mutation, State, namespace } from 'vuex-class'
// 接口
import { IHttpResponse } from '@/interface/common'

import StationAlertListView from './stationAlertListView.vue'
import StationExtremumListView from './stationExtremumListView.vue'
import { AlertTideEnum } from '@/enum/surge'
import { GET_SHOW_STATION_EXTREMUM_FORM } from '@/store/types'
import { IExpandEnum } from '@/enum/common'
import { loadInLandDistStationTotalSurgeList, loadAllStationRealdataMaximumList } from '@/api/surge'
import { DistStationSurgeListMidModel, StationMaximumSurgeMideModel } from '@/middle_model/surge'
import { StationBaseInfoMidModel } from '@/middle_model/station'

// import 'animate.css'

/** - 23-08-17 由于本系统获取增水+天文潮通过一个统一接口获取，将获取逻辑放在外侧 */
@Component({
	components: {
		StationAlertListView,
		StationExtremumListView,
	},
})
export default class StationBreviaryListView extends Vue {
	/** 控制加载遮罩 */
	@Prop({ type: Boolean, default: false })
	isLoading: boolean

	/** 通知子组件所有异步请求均执行结束 */
	@Prop({ type: Boolean, default: false })
	isFinished: boolean

	/** 不同站点的天文潮集合
	 * TODO:[*] 24-03-15 此处将数据类型修改为与distStationRealdataList一致
	 */
	@Prop({ type: Array, default: [] })
	distStationAstronmictideList: DistStationSurgeListMidModel[]

	/** 不同站点的总潮位集合 */
	@Prop({ type: Array, default: [] })
	distStationRealdataList: DistStationSurgeListMidModel[]

	/** + 24-03-14 所有站点的警戒潮位集合 */
	@Prop({ type: Array, default: [] })
	distStationsAlertlevelList: {
		station_code: string
		alert_tide_list: number[]
		alert_level_list: number[]
	}[]

	/** 不同站点的基础信息集合(经纬度、sort、code、name及其他) */
	@Prop({ type: Array, default: [] })
	distStationBaseInfoList: StationBaseInfoMidModel[]

	@Prop({ type: Array, default: [] })
	distStationSurgeRealdataExtremumList: {
		station_code: string
		issue_ts: number
		surge: number
	}[]

	@Prop({ type: Array, default: [] })
	distStationNameDicts: { name: string; chname: string; sort: number }[]

	/** 不同站点的实况极值集合(单一站点只显示一个极值时间——整点级) */
	distStationRealdataMaximumList: StationMaximumSurgeMideModel[] = []

	/** 不同站点的实况极值(分钟级) */
	distStationRealdataExtremumList: StationMaximumSurgeMideModel[] = []

	@Watch('isFinished')
	OnIsFinished(val: boolean) {
		if (val) {
			this.loadDistStationRealdataMaximumList(this.distStationRealdataList)

			this.loadDistStationRealdataExtremumList(this.distStationSurgeRealdataExtremumList)
		}
	}

	/** 根据不同站点的整点实况集合获取对应极值列表 this.distStationRealdataList -> 找到每个站点的极值 */
	loadDistStationRealdataMaximumList(val: DistStationSurgeListMidModel[]) {
		this.distStationRealdataMaximumList = []
		for (let index = 0; index < val.length; index++) {
			const elementStation = val[index]
			// 找到每个站点的总潮位极值及出现时间
			/** 实况中的极值 */
			var max = Math.max(...elementStation.surgeList)
			/** 实况极值所在位置 */
			var indexOfMax = elementStation.surgeList.indexOf(max)
			/** 极值对应的时间戳 */
			var tsOfMax = elementStation.tsList[indexOfMax]
			this.distStationRealdataMaximumList.push(
				new StationMaximumSurgeMideModel(elementStation.stationCode, tsOfMax, max)
			)
		}
	}

	/** 加载不同站点的极值(分钟级) */
	loadDistStationRealdataExtremumList(
		val: {
			station_code: string
			issue_ts: number
			surge: number
		}[]
	) {
		this.distStationRealdataExtremumList = []
		for (let index = 0; index < val.length; index++) {
			const element = val[index]
			this.distStationRealdataExtremumList.push(
				new StationMaximumSurgeMideModel(
					element.station_code,
					element.issue_ts,
					element.surge
				)
			)
		}
	}

	mounted() {
		const self = this
	}

	/** store -> 是否显示fom t:显示 */
	@Getter(GET_SHOW_STATION_EXTREMUM_FORM, { namespace: 'common' }) getShowForm: IExpandEnum

	/** 是否显示当前窗口 条件:getShowForm */
	get getIsShow(): boolean {
		let isShow = false
		switch (this.getShowForm) {
			case IExpandEnum.UN_EXPANDED:
				isShow = false
				break
			case IExpandEnum.EXPANDED:
				// this.setExpanded(true)
				// this.isExpanded = true
				isShow = true
				break
			case IExpandEnum.UN_SELECTED:
				break
		}
		return isShow
	}
}
</script>
<style lang="less">
@import '../../styles/station/station-chart';
#station_list_main_layout {
	position: absolute;
	top: 80px;
	right: 450px;
	// width: 300px;
	// height: 450px;
	// background-color: #20262cd9;
	z-index: 999;
	display: flex;
}
</style>
