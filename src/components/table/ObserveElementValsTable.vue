<template>
	<div
		id="obs_vals_tab"
		v-loading="isLoading"
		element-loading-background="rgba(28, 34, 52, 0.733)"
	>
		<section>
			<div class="table-legend">
				<div
					class="table-legend-row table-legend-title"
					:key="index"
					v-for="(item, index) in obsVals"
				>
					<div class="legend-title">{{ item.elementType | formatObsType2Name }}</div>
					<!-- <div class="legend-unit">h</div> -->
				</div>
			</div>
		</section>
		<table>
			<thead class="thead-dark">
				<tr>
					<th
						scope="col"
						v-for="(item, index) in tsList"
						:key="index"
						@mouseover="toSetHoverIndex(index)"
						:class="index === hoverIndex ? 'activate' : 'un-activate'"
					>
						{{ item | formatTs2DayHM }}
					</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="(itemObs, indexObs) in obsVals" :key="indexObs">
					<!-- TODO:[-] 24-05-11此处应加入风向 -->
					<td
						scope="col"
						v-for="(item, index) in itemObs.valList"
						:key="index"
						:class="index === hoverIndex ? 'activate' : 'un-activate'"
						@mouseover="toSetHoverIndex(index)"
						:style="{ background: obsVal2Color(item, itemObs.elementType) }"
					>
						<!-- Error in render: "TypeError: Cannot read properties of undefined (reading 'WD')" -->
						<span v-if="!isVector(itemObs, item)">{{
							item | formatSurgeFixed2Str
						}}</span>

						<div
							class="row-arrow"
							v-if="isVector(itemObs, item)"
							:style="{ transform: 'rotate(' + item + 'deg)' }"
						>
							<i class="fa-solid fa-arrow-up"></i>
						</div>
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>
<script lang="ts">
import { ObserveElementMidModel } from '@/middle_model/obs'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

import {
	formatDir2Int,
	formatSurgeFixed2Str,
	filterSurgeColorStr,
	filterWindColorStr,
	formatDate2DayHM,
	formatTs2DayHM,
	filterAlertSurgeColorStr,
	filterWaveColor,
	formatObsType2Name,
	filterBPColorStr,
} from '@/util/filter'
import { ObserveElementEnum } from '@/enum/element'
import { DEFAULT_VAL_LIST } from '@/const/default'

/** 单一站点的各个观测要素的 table */
@Component({
	filters: {
		formatDir2Int,
		formatSurgeFixed2Str,
		formatDate2DayHM,
		formatTs2DayHM,
		formatObsType2Name,
	},
})
export default class ObserveElementValsTableView extends Vue {
	isLoading = false
	/** 站点的各种观测要素及实况集合 */
	@Prop({ type: Array, default: () => [] })
	obsVals: ObserveElementMidModel[]

	hoverIndex = 0

	/** 空值集合 */
	defaultVals = DEFAULT_VAL_LIST

	get tsList(): number[] {
		let tsList = []
		if (this.obsVals.length > 0) tsList = this.obsVals[0].tsList
		return tsList
	}

	/** 是否为矢量要素(wd) */
	isVector(item: ObserveElementMidModel, val: number | null): boolean {
		return item.elementType == ObserveElementEnum.WD && !DEFAULT_VAL_LIST.includes(val)
	}

	/** TODO:[-] 24-05-10 根据观测值及要素类型获取线性色标的hex */
	obsVal2Color(val: number, obsType: ObserveElementEnum): string {
		let colorScaleFunc = filterSurgeColorStr
		switch (obsType) {
			case ObserveElementEnum.WS:
				colorScaleFunc = filterWindColorStr
				break
			case ObserveElementEnum.WSM:
				colorScaleFunc = filterWindColorStr
				break
			case ObserveElementEnum.BP:
				colorScaleFunc = filterBPColorStr
				break
			case ObserveElementEnum.YBG:
				colorScaleFunc = filterWaveColor
				break
			default:
				break
		}
		const colorStr: string = colorScaleFunc(val)
		return colorStr
	}

	toSetHoverIndex(index: number): void {}
}
</script>
<style scoped lang="less">
#obs_vals_tab {
	display: flex;
	max-width: 1042px;
	overflow-x: auto;
	overflow-y: hidden;
	section {
		.table-legend {
			color: white;
			width: 60px;
			margin-top: 30px;
			.table-legend-row {
				display: flex;
				align-content: center;
				align-items: center;
				justify-content: space-between;
				// height: 20px;
				width: 60px;
				.legend-title {
					width: 50px;
				}
			}
		}
		.table-legend-title {
			height: 30px;
			margin: 2px;
		}
		.table-legend-item {
			height: 20px;
			margin: 1px;
		}
	}

	table {
		.activate {
			background: #1fdbb6e0 !important;
		}
		thead {
			height: 20px;
			tr {
				th {
					color: white;
					width: 20px;
				}
			}
		}
		tbody {
			tr {
				height: 20px;
				width: 20px;
			}
		}
	}
}
table {
	width: 100%;
}
th {
	color: white;
}
td {
	color: white;
}
.row-arrow {
	color: white;
}
.table-legend-title {
	color: white;
}
</style>
