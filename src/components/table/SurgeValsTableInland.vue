<template>
	<div
		id="wave_dir_table"
		v-loading="isLoading"
		element-loading-background="rgba(28, 34, 52, 0.733)"
	>
		<section>
			<div class="wave-table-legend">
				<div class="table-legend-row table-legend-title">
					<div class="legend-title">时间</div>
					<div class="legend-unit">h</div>
				</div>
				<div class="table-legend-row table-legend-item">
					<div class="legend-title">总潮位</div>
					<div class="legend-unit">cm</div>
				</div>
				<div class="table-legend-row table-legend-item">
					<div class="legend-title">天文潮</div>
					<div class="legend-unit">cm</div>
				</div>
				<div class="table-legend-row table-legend-item">
					<div class="legend-title">增水</div>
					<div class="legend-unit">cm</div>
				</div>
				<div class="table-legend-row table-legend-item">
					<div class="legend-title">风速</div>
					<div class="legend-unit">m/s</div>
				</div>
				<div class="table-legend-row table-legend-item">
					<div class="legend-title">风向</div>
					<div class="legend-unit">.</div>
				</div>
			</div>
		</section>
		<table>
			<thead class="thead-dark">
				<tr>
					<th
						scope="col"
						v-for="(item, index) in forecastDtList"
						:key="index"
						@mouseover="toSetHoverIndex(index)"
						:class="index === hoverIndex ? 'activate' : 'un-activate'"
					>
						{{ item | formatDate2DayHM }}
					</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td
						scope="col"
						v-for="(item, index) in totalSurgeList"
						:key="index"
						:class="index === hoverIndex ? 'activate' : 'un-activate'"
						@mouseover="toSetHoverIndex(index)"
						:style="{ background: toAlertColor(item) }"
					>
						{{ item | formatSurgeFixed2Str }}
					</td>
				</tr>
				<tr>
					<td
						scope="col"
						v-for="(item, index) in tideList"
						:key="index"
						:class="index === hoverIndex ? 'activate' : 'un-activate'"
						@mouseover="toSetHoverIndex(index)"
					>
						{{ item | formatSurgeFixed2Str }}
					</td>
				</tr>
				<tr>
					<td
						scope="col"
						v-for="(item, index) in surgeList"
						:key="index"
						:style="{ background: surge2Color(item) }"
						:class="index === hoverIndex ? 'activate' : 'un-activate'"
						@mouseover="toSetHoverIndex(index)"
					>
						{{ item | formatSurgeFixed2Str }}
					</td>
				</tr>
				<tr>
					<td
						scope="col"
						v-for="(item, index) in limitWsList"
						:key="index"
						:style="{ background: wind2Color(item) }"
						:class="index === hoverIndex ? 'activate' : 'un-activate'"
						@mouseover="toSetHoverIndex(index)"
					>
						{{ item | formatSurgeFixed2Str }}
					</td>
				</tr>
				<tr>
					<td
						scope="col"
						v-for="(item, index) in limitWdList"
						:key="index"
						:style="{ background: wind2Color(limitWsList[index]) }"
						:class="index === hoverIndex ? 'activate' : 'un-activate'"
						@mouseover="toSetHoverIndex(index)"
					>
						<div
							class="row-arrow"
							v-show="!isHideDir(item)"
							:style="{ transform: 'rotate(' + item + 'deg)' }"
						>
							<i class="fa-solid fa-arrow-up"></i>
						</div>
						<span v-show="isHideDir(item)">-</span>
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import {
	formatDir2Int,
	formatSurgeFixed2Str,
	filterSurgeColorStr,
	filterWindColorStr,
	formatDate2DayHM,
	formatTs2DayHM,
	filterAlertSurgeColorStr,
} from '@/util/filter'
import { DEFAULT_SURGE_TD_STEP, DEFAULT_VAL, DEFAULT_VAL_LIST, NULL_DIR } from '@/const/default'
import { AlertTideEnum } from '@/enum/surge'
import { MS_UNIT } from '@/const/unit'
import { ObserveElementEnum } from '@/enum/element'
/** 风暴潮 tab */
@Component({ filters: { formatDir2Int, formatSurgeFixed2Str, formatDate2DayHM, formatTs2DayHM } })
export default class SurgeValsTableInLand extends Vue {
	MAX_SPLIT_LIST_COUNT = 240
	MAX_WS_COUNT = 240
	@Prop({ type: Boolean, default: false })
	isLoading: boolean

	/** 总潮位 */
	// @Prop({ type: Array, default: [] })
	// surgeList: number[]

	/** 天文潮位 */
	@Prop({ type: Array, default: [] })
	tideList: number[]

	/** 增水 */
	@Prop({ type: Array, default: [] })
	surgeList: number[]

	/** 风速集合 */
	@Prop({ type: Array, default: [] })
	wsList: number[]

	/** 风向集合  */
	@Prop({ type: Array, default: [] })
	wdList: number[]

	/** 风速时间戳集合 */
	@Prop({ type: Array, default: [] })
	wsTsList: number[]

	/** TODO:[*] 24-03-26
	 *  当前 code 对应的警戒潮位
	 * 需要由父组件传入
	 */
	@Prop({ type: Array, default: [] })
	alertLevels: { tide: number; alert: AlertTideEnum }[]

	/** 对应的预报时间戳集合 */
	@Prop({ type: Array, default: [] })
	forecastDtList: { val: Date }[]

	@Prop({ type: Number, default: 0 })
	propHoverIndex: number

	/** 当前移入的index索引 */
	hoverIndex = 0

	toRotate(val: number): string {
		let rotateStr = `rotate(${val}}deg);`
		return rotateStr
	}

	toSetHoverIndex(index: number): void {
		this.hoverIndex = index
	}

	/** 根据增水获取对应的线性色标中对应的颜色 */
	surge2Color(val: number): string {
		return filterSurgeColorStr(val)
	}

	/** 根据风速获取对应的线性色标中对应的颜色 */
	wind2Color(val: number): string {
		return filterWindColorStr(val)
	}

	/** 获取当前潮值对应的警戒颜色 */
	toAlertColor(val: number): string {
		/** 升序排列的 警戒潮位潮值集合 */
		const alertTides: number[] = this.alertLevels
			.map((temp) => {
				return temp.tide
			})
			.sort((a, b) => {
				return a - b
			})
		return filterAlertSurgeColorStr(val, alertTides)
	}

	@Watch('propHoverIndex')
	onPropHoverIndex(val: number): void {
		this.hoverIndex = val
	}

	get totalSurgeList(): number[] {
		let total: number[] = this.surgeList.map((val, index) => {
			return val + this.tideList[index]
		})
		return total
	}

	/** 限制长度后及对空数组填充'-'的限制风速集合 */
	get limitWsList(): number[] {
		let splittedWsList: number[] = []
		if (this.wsList.length == 0) {
			splittedWsList = Array.from({ length: this.MAX_WS_COUNT }).map((_) => {
				return DEFAULT_VAL
			})
		} else {
			splittedWsList = this.wsList.slice(0, this.MAX_WS_COUNT)
		}
		return splittedWsList
	}

	/** 限制长度后及对空数组填充'-'的限制风向集合 */
	get limitWdList(): number[] {
		let splittedWdList: number[] = []
		if (this.wdList.length == 0) {
			splittedWdList = Array.from({ length: this.MAX_WS_COUNT }).map((_) => {
				return DEFAULT_VAL
			})
		} else {
			splittedWdList = this.wdList.slice(0, this.MAX_WS_COUNT)
		}
		return splittedWdList
	}

	isHideDir(val: number): boolean {
		// return val == NULL_DIR || val == -9999
		return DEFAULT_VAL_LIST.includes(val)
	}
}
</script>
<style scoped lang="less">
#wave_dir_table {
	display: flex;
	max-width: 1042px;
	overflow-x: auto;
	overflow-y: hidden;
	section {
		.wave-table-legend {
			color: white;
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
</style>
