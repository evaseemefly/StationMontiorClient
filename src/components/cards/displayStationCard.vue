<template>
	<div id="display_station_card">
		<div class="card-name">{{ name }}</div>
		<div class="card-close" @click="commitRemoveCode(name)">
			<i class="fa-solid fa-minus"></i>
		</div>
	</div>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { REMOVE_STATIONS_CODE } from '@/store/types'
import { Mutation } from 'vuex-class'
/** 显示tab组件(父组件) */
@Component({})
export default class DispalyStationCard extends Vue {
	mydata: any = null
	/** 当前显示的站点 */
	@Prop({ type: String, default: '站点' })
	name: string

	@Prop({ type: String, default: '' })
	code: string

	commitRemoveCode(val: string) {
		this.removeCode(val)
	}

	/** 从 vuex 中删除 stationsCodes 指定 code */
	@Mutation(REMOVE_STATIONS_CODE, { namespace: 'station' })
	removeCode: { (val: string): void }
}
</script>
<style scoped lang="less">
@import url('../../styles/base-form.less');
.card-close {
	@card-close();
}
#display_station_card {
	@form-base-shadow();
	padding: 10px;
	color: white;
	font-size: 1.2rem;
	position: relative;
	margin: 10px;
	@form-base-radius();
	background: linear-gradient(rgba(28, 34, 52, 0.733), rgba(49, 59, 89, 0.733));
	// position: absolute;
	.card-close {
		// padding: 5px;
		// margin-left: 5px;
		// margin-right: 5px;
		// @form-base-shadow();
		// @form-base-radius();
		// @form-base-background();
		// color: white;
		// position: absolute;
		// right: -10px;
		// width: 20px;
		// @card-close();
		// @card-close-button();
	}
}
</style>
