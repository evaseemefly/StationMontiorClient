<template>
	<div id="display_stations_tab">
		<div v-for="(station, index) in displayStations" :key="index">
			<DispalyStationCard :name="station"></DispalyStationCard>
		</div>
	</div>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import DispalyStationCard from '@/components/cards/displayStationCard.vue'
/** 显示tab组件(父组件) */
@Component({
	components: { DispalyStationCard },
})
export default class DisplayTabsView extends Vue {
	mydata: any = null
	/** 当前显示的站点 */
	displayStations: string[] = ['DTO', 'SPU', 'QLN', 'HZO']
	mounted() {}
	get computedTest() {
		return null
	}
}
</script>
<style scoped lang="less">
@import url('../../../styles/base-form.less');
#display_stations_tab {
	// @form-base-shadow();
	position: absolute;
	top: 350px;
	left: 150px;
	margin: 10px;

	z-index: 999;
	display: flex;
}
</style>
