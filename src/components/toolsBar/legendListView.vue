<template>
	<div id="legend_list">
		<SwitchBackgroundMap></SwitchBackgroundMap>
		<!-- <TyphoonLevelLegend></TyphoonLevelLegend> -->
		<StationLevelLegend></StationLevelLegend>
		<GirdColorBar></GirdColorBar>
		<RasterColorBar></RasterColorBar>
	</div>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

import SwitchBackgroundMap from '@/components/toolsBar/switchBackgroundMapBar.vue'
import TyphoonLevelLegend from '@/components/toolsBar/typhoonLevelLegend.vue'
import StationLevelLegend from '@/components/toolsBar/stationLevelLegend.vue'
import GirdColorBar from '@/components/bars/gridColorBar.vue'
import RasterColorBar from '@/components/bars/rasterColorBar.vue'
/** 图例集合汇总视图 */
@Component({
	components: {
		SwitchBackgroundMap,
		TyphoonLevelLegend,
		StationLevelLegend,
		GirdColorBar,
		RasterColorBar,
	},
})
export default class LegendListView extends Vue {}
</script>
<style scoped lang="less">
#legend_list {
	display: flex;
	flex-direction: column-reverse;
	align-items: flex-end; // 副轴向左对齐
	z-index: 5000;
	position: absolute;
	bottom: 100px;
	right: 10px;
}
</style>
