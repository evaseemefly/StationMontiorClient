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
					@click="checkSubTitle(index)"
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
import { GET_SHOW_STATION_SURGE_FORM } from '@/store/types'
import { DistStationSurgeListMidModel } from '@/middle_model/surge'
/** + 24-03-21 海洋站数据显示form 包含 tabs 以及 charts 组件 */
@Component({ components: { StationDataChart } })
export default class StationDataFormView extends Vue {
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

	@Getter(GET_SHOW_STATION_SURGE_FORM, { namespace: 'station' }) getIsShow: boolean

	subTitles: { title: string; code: string }[] = [{ title: '石浦', code: 'SPU' }]
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
