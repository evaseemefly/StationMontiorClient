<template>
	<transition name="legend-fade">
		<div id="station-level-legend" v-show="true">
			<font>{{ legendTitle }}</font>
			<div class="card-list-bar">
				<div
					class="card-info"
					:key="icon.key"
					:class="[icon.styleCls]"
					v-for="icon in iconList"
				>
					<i :class="icon.iconCls">{{ icon.name }}</i>
				</div>
			</div>
		</div>
	</transition>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Getter, Mutation, State, namespace } from 'vuex-class'
// + 22-02-17 海洋站潮位颜色对应关系图例
import { GET_SHOW_STATION_ICON } from '@/store/types'

/** + 24-09-03 观测站种类图例 */
@Component({})
export default class SiteCategoryLegend extends Vue {
	mydata: any = null
	legendTitle = '海洋站图例'
	iconList: Array<{
		iconCls: string
		name: string
		key: number
		isActive: boolean
		styleCls: string
	}> = [
		{ iconCls: '', name: '海洋站', key: 1, isActive: false, styleCls: 'green' },
		{ iconCls: '', name: '浮标', key: 2, isActive: false, styleCls: 'blue' },
		{ iconCls: '', name: '暂停使用', key: 5, isActive: false, styleCls: 'red' },
	]
	getBaseMapType(area: { code: number }): string {
		if (this.iconList.length > 0) {
			return 'my-primary'
		}
		return ''
	}
	get computedTest() {
		return null
	}

	@Getter(GET_SHOW_STATION_ICON, { namespace: 'station' }) getShowStationIcon
}
</script>
<style scoped lang="less">
// @import '../../styles/common/card';
@import '../../styles/common/card';
@import '../../styles/base-color';
#station-level-legend {
	margin: 2px;
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	font {
		font-size: 14px;
		color: white;
		text-shadow: 0 0 4px black;
	}
	.el-switch {
		margin-left: 15px;
	}
	@legend();
}
// 加入过度动画效果
.legend-fade-enter-active,
.legend-fade-leave-active {
	transition: all 1s;
}
.legend-fade-enter, .legend-fade-leave-to
/* .list-leave-active for below version 2.1.8 */ {
	opacity: 0;
	transform: translateX(30px);
}
</style>
