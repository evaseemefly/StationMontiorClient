<template>
	<!-- <transition
		enter-active-class="animate__animated animate__fadeIn"
		leave-active-class="animate__animated animate__fadeOut"
	> -->
	<div v-draggable id="station_surge_form" v-if="getIsShow" class="right-station-surge-form">
		<div class="my-detail-form">
			<div class="sub-titles">
				<div
					:class="[
						index == subTitleIndex ? 'actived my-sub-title' : 'unactived my-sub-title',
						item.disabled ? 'disabled' : '',
					]"
					:key="index"
					@click="commitCode(item.code)"
					v-for="(item, index) in subTitles"
				>
					{{ item.title }}
				</div>
				<!-- <div class="my-sub-title right" @click="setExpanded()">最小化</div> -->
			</div>
			<div class="detail-content">
				<StationDataChart
					:startTs="issueTs"
					:endTs="endTs"
					:issueTs="issueTs"
				></StationDataChart>
			</div>
		</div>
	</div>
	<!-- </transition> -->
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Getter, Mutation, State, namespace } from 'vuex-class'

import StationDataChart from '@/components/charts/StationDataChart.vue'
import { GET_SHOW_STATION_SURGE_FORM, GET_STATIONS_CODES } from '@/store/types'
import { DistStationSurgeListMidModel } from '@/middle_model/surge'
import { DEFAULT_STATION_CODE } from '@/const/default'
/** + 24-03-21 海洋站数据显示form 包含 tabs 以及 charts 组件 */
@Component({ components: { StationDataChart } })
export default class StationDataFormView extends Vue {
	/** 当前选中的站点 code */
	selectedCode: string = DEFAULT_STATION_CODE

	/** 标题数组 */
	subTitles: { title: string; code: string }[] = []

	/** 当前 selectedCode 对应的数据集合 */
	stationMergeDataList: {
		realdataList: DistStationSurgeListMidModel
		astronmictideList: DistStationSurgeListMidModel
		alertlevelList: {
			station_code: string
			alert_tide_list: number[]
			alert_level_list: number[]
		}
	} | null = null
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

	/** 由RealdataHomeView 统一传递进本组件 */
	@Prop({ type: Array, default: [] })
	distStationNameDicts: { name: string; chname: string; sort: number }[]

	@Getter(GET_SHOW_STATION_SURGE_FORM, { namespace: 'station' }) getIsShow: boolean

	/** 设置当前选中的站点编号 */
	commitCode(code: string): void {
		this.selectedCode = code
	}

	@Getter(GET_STATIONS_CODES, { namespace: 'station' }) getCodes: string[]

	@Watch('getCodes')
	onCodes(val: string[]): void {
		this.subTitles = []
		for (var i = 0; i < val.length; i++) {
			const filterTemp = this.distStationNameDicts.filter((d) => d.name == val[i])
			if (filterTemp.length > 0) {
				this.subTitles.push({ title: filterTemp[0].chname, code: filterTemp[0].name })
			}
		}
	}

	/** 监听当前选中 code
	 * step1: distStationRealdataList
	 * step2: distStationsAlertlevelList
	 * step3: distStationsAlertlevelList 中过滤
	 * step4: 生成传递给子组件的 mergelist
	 */
	@Watch('selectedCode')
	onSelectedCode(code: string): void {
		const tempFilterAlertRes = this.distStationsAlertlevelList.filter(
			(temp) => temp.station_code == code
		)
		const tempFilterRealdataRes = this.distStationRealdataList.filter(
			(temp) => temp.stationCode == code
		)
		const tempFilterAstronmictideRes = this.distStationAstronmictideList.filter(
			(temp) => temp.stationCode == code
		)
		// const temp = tempFilterRealdataRes.length > 0 ? tempFilterRealdataRes[0] : null
		this.stationMergeDataList = {
			realdataList: tempFilterRealdataRes.length > 0 ? tempFilterRealdataRes[0] : null,
			astronmictideList:
				tempFilterAstronmictideRes.length > 0 ? tempFilterAstronmictideRes[0] : null,
			alertlevelList: tempFilterAlertRes.length > 0 ? tempFilterAlertRes[0] : null,
		}
	}
}
</script>
<style scoped lang="less">
@import '../../styles/station/station-chart';
// + 21-12-06 加入重写的 emelemtnui 样式
@import '../../styles/my-elementui/common';
@import '../../styles/base-form.less';
.test {
	background: rgb(252, 182, 31);
	color: rgb(235, 232, 70);
}

#station_surge_form {
	bottom: 60px;
	left: 50px;
	// @form-base-background();
}
.detail-content {
	@form-base-background();
}
</style>
