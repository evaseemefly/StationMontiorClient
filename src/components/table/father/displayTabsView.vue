<template>
	<div id="display_stations_tab">
		<div v-for="(station, index) in displayStations" :key="index">
			<DispalyStationCard :name="station" :code="station"></DispalyStationCard>
		</div>
	</div>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import DispalyStationCard from '@/components/cards/displayStationCard.vue'
import { GET_STATIONS_CODES } from '@/store/types'
import { Getter } from 'vuex-class'
/** 显示tab组件(父组件) */
@Component({
	components: { DispalyStationCard },
})
export default class DisplayTabsView extends Vue {
	/** 可显示的最多站点数量 */
	@Prop({ type: Array, required: false, default: 4 })
	maxCount: number

	/** 当前显示的站点 */
	displayStations: string[] = []

	@Watch('getCodes')
	onCodes(val: string[]) {
		this.displayStations = val
	}

	@Getter(GET_STATIONS_CODES, { namespace: 'station' }) getCodes: string[]
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
