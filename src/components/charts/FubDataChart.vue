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
			<div id="observe_chart"></div>
			<div class="down-section">
				<ObserveElementValsTableView :obsVals="obsVals"></ObserveElementValsTableView>
			</div>
		</div>
	</div>
</template>
<script lang="ts">
import { ObserveElementMidModel } from '@/middle_model/obs'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import ObserveElementValsTableView from '@/components/table/ObserveElementValsTable.vue'
import { ObserveElementEnum, WeatherKindEnum } from '@/enum/element'

/** fub data chart */
@Component({ components: { ObserveElementValsTableView } })
export default class FubDataChart extends Vue {
	/** 站点的各种观测要素及实况集合 */
	@Prop({ type: Array, default: () => [] })
	obsVals: ObserveElementMidModel[]

	/** 选择的气象要素种类(含海洋-海浪) */
	weahterKind: WeatherKindEnum = WeatherKindEnum.WIND

	/** 根据选择的气象要素加载不同的chart */
	initChart(kind: WeatherKindEnum): void {}

	/** 加载海浪要素至chart */
	loadWaveChart(): void {
		/** 从当前传入的 obsVals 过滤海浪要素 */
		const waveObs = this.obsVals.filter((temp) => {
			return (
				temp.elementType == ObserveElementEnum.YBG ||
				temp.elementType == ObserveElementEnum.BG
			)
		})
	}

	/** 加载气压要素要素至chart */
	loadAirPressureChart(): void {}

	/** 加载风要素至chart */
	loadWindChart(): void {}
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
