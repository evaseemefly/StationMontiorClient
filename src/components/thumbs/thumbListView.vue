<template>
	<!-- <transition enter-active-class="animated fadeInDown delay-2s"> -->
	<div class="thumb-list animated fadeInDown animate__delay-3s">
		<!-- <TySearchThumbView title="潮位详情查询"></TySearchThumbView> -->
		<StationExtremumListThumbView title="潮位站极值列表"></StationExtremumListThumbView>
		<!-- <StationSurgeListThumbView title="潮位站详情"></StationSurgeListThumbView> -->
	</div>
	<!-- </transition> -->
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

// import BaseThumbView from '@/components/thumbs/baseThumbView.vue'
import TySearchThumbView from '@/components/thumbs/tySearchThumbView.vue'
import StationExtremumListThumbView from '@/components/thumbs/stationExtremumListThumbView.vue'
import StationSurgeListThumbView from '@/components/thumbs/stationSurgeListViewThumbView.vue'
@Component({
	components: { TySearchThumbView, StationExtremumListThumbView, StationSurgeListThumbView },
})
export default class ThumbListView extends Vue {}
</script>
<style scoped lang="less">
.thumb-list {
	display: flex;
	position: absolute;
	top: 0px;
	left: 100px;
	z-index: 998;
	// z-index: 9999;
}
</style>
