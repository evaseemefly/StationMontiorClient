<template>
	<div
		v-draggable
		id="station_list_main_layout"
		v-show="getIsShow"
		v-loading="isLoading"
		element-loading-background="rgba(28, 34, 52, 0.733)"
	>
		<StationExtremumListView
			:stationNameDict="stationNameDict"
			:distStationsTotalSurgeList="distStationsTotalSurgeList"
		></StationExtremumListView>
		<StationAlertListView
			:title="该日极值"
			:stationNameDict="stationNameDict"
			:distStationsSurgeList="distStationsTotalSurgeList"
		></StationAlertListView>
		<StationAlertListView
			:title="整点极值"
			:stationNameDict="stationNameDict"
			:distStationsSurgeList="distStationSurgeRealdataMaximumList"
		></StationAlertListView>
	</div>
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
/** - 23-08-17 由于本系统获取增水+天文潮通过一个统一接口获取，将获取逻辑放在外侧 */
@Component({
	components: {
		StationAlertListView,
		StationExtremumListView,
	},
})
export default class StationBreviaryListView extends Vue {
	@Prop({ type: Number })
	startTs: number

	@Prop({ type: Number })
	endTs: number

	isLoading = false

	/** 海洋站名称中英文对照字典 */
	stationNameDict: { name: string; chname: string; sort: number }[] = []

	/** 不同站点的总潮位集合(surge+tide) 
	 * TODO:[-] 23-08-18 注意此处需要将 以下格式转换为 {
		surge: number
		dt: Date
		realdata: number
		tide: number
	}[]
	*/
	distStationsTotalSurgeList: {
		station_code: string
		sort: number
		forecast_ts_list: number[]
		tide_list: number[]
		surge_list: number[]
	}[] = []

	/** + 24-03-13 所有站点的实况增水极值列表 */
	distStationSurgeRealdataMaximumList: {
		station_code: string
		issue_ts: number
		surge: number
	}[] = []

	mounted() {
		const self = this
		self.stationNameDict = []
		// TODO:[*] 23-11-20 加载首页时会多次触发的加载国内站点集合
		//1- 页面首次加载加载站点对应字典
		loadInlandStationList().then(
			(res: IHttpResponse<{ code: string; name: string; sort: number }[]>) => {
				if (res.status === 200) {
					res.data.length > 0
						? res.data.forEach((temp) => {
								self.stationNameDict.push({
									name: temp.code,
									sort: temp.sort,
									chname: temp.name,
								})
						  })
						: ''
				}
			}
		)
		// this.loadDistStationTotalsSurgeList(this.startTs, this.endTs, this.issueTs)
	}

	/** { issueTs, startTs, endTs } options */
	get timestampOpt(): { startTs: number; endTs: number } {
		const { startTs, endTs } = this
		return { startTs, endTs }
	}

	@Watch('timestampOpt')
	onTimestampOpt(val: { startTs: number; endTs: number }): void {
		this.loadDistStationRealdataList(val.startTs, val.endTs)
	}

	/** 加载所有站点的实况集合
	 * step 1: 加载所有站点的实况及和
	 */
	loadDistStationRealdataList(startTs: number, endTs: number) {
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
<style scoped lang="less">
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
