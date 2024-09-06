<template>
	<!-- <transition
		enter-active-class="animate__animated animate__fadeIn"
		leave-active-class="animate__animated animate__fadeOut"
	> -->
	<transition enter-active-class="animated fadeInDown" leave-active-class="animated fadeOutUp">
		<div v-draggable id="station_surge_form" v-if="isShow" class="right-station-surge-form">
			<div class="my-detail-form">
				<div class="sub-titles">
					<div class="title-border">
						<div
							:class="[
								index == subTitleIndex
									? 'actived my-sub-title'
									: 'unactived my-sub-title',
								item.disabled ? 'disabled' : '',
							]"
							:key="index"
							@click="commitSite(item)"
							v-for="(item, index) in sites"
						>
							{{ item.name }}
						</div>
					</div>
					<div class="thumb-btn" @click="setExpanded(false)">
						<i class="fa-solid fa-minus"></i>
					</div>
					<!-- <div class="my-sub-title right" @click="setExpanded()">最小化</div> -->
				</div>
				<div class="detail-content">
					<!-- <transition
					enter-active-class="animate__animated animate__fadeInDown"
					leave-active-class="animate__animated animate__fadeOutDown"
				> -->
					<!-- <component
						:is="componetViewName"
						:tideList="tideList"
						:surgeList="surgeList"
						:tsList="tsList"
						:isFinished="isChildFinished"
						:stationCode="selectedCode"
						:alertLevels="alertlevelList"
						:stationName="subTitle"
						:wdList="wdList"
						:wsList="wsList"
						:obsVals="obsVals"
					></component> -->

					<!-- <transition
						enter-active-class="animated fadeIn"
						leave-active-class="animated fadeOut"
						> -->
					<!-- TODO:[-] 24-06-17 此处不使用过渡动画，效果不好 -->
					<component :is="componetViewName" v-bind="dynamicChildrenProps"></component>
					<!-- </transition> -->

					<!-- </transition> -->
					<!-- TODO:[-] 24-06-06 尝试使用动态绑定props -->
					<!-- <StationDataChart v-bind="dynamicChildrenProps"></StationDataChart> -->

					<!-- <FubDataChart :obsVals="obsVals"></FubDataChart> -->
				</div>
			</div>
		</div>
	</transition>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Getter, Mutation, State, namespace } from 'vuex-class'

import StationDataChart from '@/components/charts/StationDataChart.vue'
import FubDataChart from '@/components/charts/FubDataChart.vue'
import DataChart1 from '@/components/charts/DataChart1.vue'
import DataChart2 from '@/components/charts/DataChart2.vue'
import {
	GET_SHOW_STATION_SURGE_FORM,
	GET_STATIONS_CODES,
	GET_STATIONS_D85_LIST,
	SET_SHOW_STATION_SURGE_FORM,
} from '@/store/types'
import { DistStationSurgeListMidModel } from '@/middle_model/surge'
import {
	DEFAULT_SITE_CODE,
	DEFAULT_SITE_NAME,
	DEFAULT_STATION_CODE,
	DEFAULT_STATION_NAME,
	DEFAULT_SURGE_VAL,
	DEFAULT_VAL,
} from '@/const/default'
import { AlertTideEnum } from '@/enum/surge'
import { DistStationWindListMidModel } from '@/middle_model/wind'
import { ObservationTypeEnum } from '@/enum/common'
import { ObserveElementEnum } from '@/enum/element'
import { ObserveElementMidModel, ObserveValueMidModel } from '@/middle_model/obs'
import { SiteBaseDigestMidModel, SiteBaseInfoMidModel } from '@/middle_model/site'
import { standardSurgeSingular } from '@/util/filter'
// import DataChart1 from '../charts/DataChart1.vue'
/** + 24-03-21 海洋站数据显示form 包含 tabs 以及 charts 组件 */
@Component({ components: { StationDataChart, FubDataChart, DataChart1, DataChart2 } })
export default class SiteDataFormView extends Vue {
	/** 当前选中的站点 code */
	selectedCode: string = DEFAULT_STATION_CODE

	/** 是否加载完毕 */
	@Prop({ type: Boolean, default: false })
	isFinished: boolean

	isChildFinished = false

	/** 动态 chart 组件名 */
	componetViewName = ''

	/** 标题数组 */
	subTitles: { title: string; code: string }[] = []

	subTitleIndex = -1

	/** 副标题名称(当前选中的站点name) */
	subTitle = DEFAULT_STATION_NAME

	/** 当前选定站位的观测要素集合 */
	obsVals: ObserveElementMidModel[] = []

	/** 当前选定的站位 */
	selectedSite: SiteBaseDigestMidModel = null

	/** 当前 selectedCode 对应的数据集合 */
	stationMergeDataList: {
		/** 实况(总潮位) */
		realdataList: DistStationSurgeListMidModel
		/** 天文潮 */
		astronmictideList: DistStationSurgeListMidModel
		alertlevelList: {
			station_code: string
			alert_tide_list: number[]
			alert_level_list: number[]
		}
	} | null = null
	/** TODO:[*] 24-06-06 动态子组件的prop */
	dynamicChildrenProps: any = {}

	// get dynamicChildrenProps(): any {
	// 	if (this.componetViewName == 'FubDataChart') {
	// 	}
	// }
	/** 不同站点的天文潮集合
	 * TODO:[*] 24-03-15 此处将数据类型修改为与distStationRealdataList一致
	 */
	@Prop({ type: Array, default: [] })
	distStationAstronmictideList: DistStationSurgeListMidModel[]

	/**@deprecated 24-06-20 暂时废弃
	 * 由 allSiteRealdataList 替代
	 *  不同站点的总潮位集合 */
	@Prop({ type: Array, default: [] })
	distStationRealdataList: DistStationSurgeListMidModel[]

	/**@deprecated 24-06-20 暂时废弃
	 * 由 allSiteRealdataList 替代
	 *  不同站点的风要素集合 */
	@Prop({ type: Array, default: [] })
	distStationWindRealdataList: DistStationWindListMidModel[]

	/** + 24-03-14 所有站点的警戒潮位集合 */
	@Prop({ type: Array, default: () => [] })
	distStationsAlertlevelList: {
		station_code: string
		alert_tide_list: number[]
		alert_level_list: number[]
	}[]

	/** TODO:[*] 24-06-20 选定的站点实况由此部分传入 */
	@Prop({ type: Array, default: () => [] })
	allSiteRealdataList: ObserveValueMidModel[]

	@Prop({ type: Array, default: () => [] })
	allSites: SiteBaseInfoMidModel[]

	/** 由RealdataHomeView 统一传递进本组件 */
	@Prop({ type: Array, default: [] })
	distStationNameDicts: { name: string; chname: string; sort: number }[]

	/** TODO:[*] 24-06-17 用来监听起止时间变化
	 * 起始时间戳
	 */
	@Prop({ type: Number, default: () => 0 })
	startTs: number

	/**TODO:[*] 24-06-17 用来监听起止时间变化
	 * 结束时间戳 */
	@Prop({ type: Number, default: () => 0 })
	endTs: number

	/** 展开显示form由  getIsShow 与 codes 数量共同决定*/
	get isShow(): boolean {
		// TODO:[-] 24-05-21 展开出发条件由 getCodes -> site.length
		return this.getIsShow && this.sites.length > 0
	}

	@Getter(GET_SHOW_STATION_SURGE_FORM, { namespace: 'station' }) getIsShow: boolean

	@Mutation(SET_SHOW_STATION_SURGE_FORM, { namespace: 'station' }) setShowStationForm: {
		(val: boolean): void
	}

	/** 实况数组 */
	realdataList: number[] = []
	/** TODO:[*] 24-06-17 天文潮数组——未更新
	 * 由 distStationAstronmictideList 计算此天文潮数组
	 */
	tideList: number[] = []
	/** TODO:[*] 24-06-17  增水数组——未更新(由于tideList未更新)*/
	surgeList: number[] = []
	/** 对应时间戳数组 */
	tsList: number[] = []

	/** 风向集合 */
	wdList: number[] = []

	/** 风速集合 */
	wsList: number[] = []

	/** 当前code对应的警戒潮位集合 */
	alertlevelList: {
		tide: number
		alert: AlertTideEnum
	}[] = []

	/** TODO:[-] 24-05-09 控制显示不同种类的观测站点 station|fub (显示form有所不同) */
	obsType: ObservationTypeEnum = ObservationTypeEnum.STATION

	// /** 设置当前选中的站点编号 */
	// commitCode(code: string): void {
	// 	this.selectedCode = code
	// 	// const filterSubTitle=this.subTitles.filter(t => t.code===code)
	// 	for (let index = 0; index < this.subTitles.length; index++) {
	// 		const element = this.subTitles[index]
	// 		if (element.code === code) {
	// 			this.subTitleIndex = index
	// 			this.subTitle = element.title
	// 		}
	// 	}
	// }

	/** 24-06-12 从 commitSite 方法中提取出来的初始化动态子组件props的方法*/
	initDynamicChildProps(val: SiteBaseDigestMidModel): void {
		/** 动态组件的名称 */
		let dataComponetViewName = 'StationDataChart'

		// this.componetViewName = dataComponetViewName
		// TODO:[-] 24-06-07 在切换子组件时，若不同类型的组件，切换时会重新加载组件并实现全部生命周期流程，两个相同组件间切换不会执行
		switch (val.observationType) {
			case ObservationTypeEnum.FUB:
				dataComponetViewName = 'FubDataChart'
				this.dynamicChildrenProps = {
					obsVals: this.obsVals,
				}
				break
			case ObservationTypeEnum.STATION:
				dataComponetViewName = 'StationDataChart'
				this.dynamicChildrenProps = {
					tideList: this.tideList,
					surgeList: this.surgeList,
					tsList: this.tsList,
					isFinished: this.isChildFinished,
					stationCode: this.selectedCode,
					alertLevels: this.alertlevelList,
					stationName: this.subTitle,
					wdList: this.wdList,
					wsList: this.wsList,
					startTs: this.startTs,
					endTs: this.endTs,
				}
				break
			default:
				break
		}
		this.componetViewName = dataComponetViewName
	}

	/**
	 *
	 * 选定当前站位
	 *  + 24-06-13 选定站点
	 * step1: 获取当前站点的 obsVals
	 * step2: 为天文潮与实况赋值
	 * step3: 获取站点的警戒潮位
	 * step4: 初始化动态props
	 *
	 * TODO:[*] 24-06-13 此处最好改为在方法中不直接读取this中的属性，而改为由一个方法读取后通过参数传递给不同方法
	 */
	commitSite(val: SiteBaseDigestMidModel): void {
		const selectedIndex = this.sites.findIndex((temp) => {
			return temp.stationCode == val.stationCode
		})
		const site: undefined | SiteBaseDigestMidModel = this.sites[selectedIndex]
		// step1: 获取当前站点的实况集合
		const siteRealdata = this.allSiteRealdataList.filter((t) => t.code === val.stationCode)
		if (site == undefined) {
			return
		}

		this.selectedCode = site.stationCode
		this.selectedSite = site
		this.subTitleIndex = selectedIndex

		// TODO:[-] 24-07-01 此处加入 obsVals对于elementType的生序排列
		if (siteRealdata.length > 0) {
			this.obsVals = siteRealdata[0].obsVals.sort((a, b) => {
				return a.elementType.valueOf() - b.elementType.valueOf()
			})
		}
		// TODO:[-] 24-06-12 以下部分在 onSelectedCode 被提取在 commitSite 方法中
		const code = site.stationCode
		this.isChildFinished = false
		this.clearAlertLevelList()
		// TODO:[-] 24-06-07 注意此处的 distStationRealdataList 有可能是延时的! 这是导致所有bug的关键
		// 满足为海洋站才执行以下操作
		if (site.observationType == ObservationTypeEnum.STATION) {
			// step2: 根据 code 过滤 警戒潮位，实况结果，天文潮结果
			const tempFilterAlertRes = this.distStationsAlertlevelList.filter(
				(temp) => temp.station_code == code
			)
			// TODO:[-] 24-06-20 变更为通过 allSiteRealdataList 过滤实况
			const tempFilterRealdataRes = this.allSiteRealdataList.filter((temp) => {
				return temp.code == code
			})

			/** 当前选定站点 -> code -> 所有观测要素集合 */
			const tempObsVals =
				tempFilterRealdataRes.length > 0 ? tempFilterRealdataRes[0].obsVals : []

			/** 过滤后当前站点对应的潮位集合 */
			const tempSurgeFilter = tempObsVals.filter((temp) => {
				return temp.elementType == ObserveElementEnum.WL
			})

			/** TODO:[*] 24-06-21 当修改了起止时间后天文潮集合并未按照起止时间进行更新? */
			const tempFilterAstronmictideRes = this.distStationAstronmictideList.filter(
				(temp) => temp.stationCode == code
			)
			/** @deprecated
			 *  当前code 对应的风要素集合 */
			const tempFilterWindRes = this.distStationWindRealdataList.filter(
				(temp) => temp.stationCode == code
			)

			/** 过滤后当前站点对应的风速集合 */
			const tempWsFilter = tempObsVals.filter((temp) => {
				return temp.elementType == ObserveElementEnum.WS
			})

			/** 过滤后当前站点对应的风向集合 */
			const tempWdFilter = tempObsVals.filter((temp) => {
				return temp.elementType == ObserveElementEnum.WD
			})

			// TODO:[*] 24-08-01 注意天文潮与实况均需要-d85(增水不影响)
			const d85filter = this.getStationsD85List.filter((val) => {
				return val.code == code
			})
			/** 当前站点(code)对应的d85差值 */
			const d85: number = d85filter.length > 0 ? d85filter[0].d85 : DEFAULT_VAL

			// step2: 为天文潮与实况赋值
			let tempRealdataList = tempSurgeFilter.length > 0 ? tempSurgeFilter[0].valList : []
			/** 标准化后的总潮位集合 */
			// const standardRealDataList = tempRealdataList.map((val) => val - d85)
			// TODO:[-] 24-09-06 加入对实况进行标准化
			const standardRealDataList = standardSurgeSingular(tempRealdataList)
			this.realdataList = standardRealDataList //
			let tempTideList =
				tempFilterAstronmictideRes.length > 0 ? tempFilterAstronmictideRes[0].surgeList : []
			// const standardTideList = tempTideList.map((val) => val - d85)
			const standardTideList = tempTideList
			this.tideList = standardTideList //

			// TODO:[-] 24-06-20 时间戳数组更新逻辑有误. 修改为根据 tempSurgeFilter -> 获取 tsList
			this.tsList = tempSurgeFilter.length > 0 ? tempSurgeFilter[0].tsList : []

			this.surgeList = this.tideList.map((ele, index) => {
				return this.realdataList[index] == null ||
					this.realdataList[index] == DEFAULT_SURGE_VAL
					? null
					: this.realdataList[index] - ele
			})
			this.wdList = tempWdFilter.length > 0 ? tempWdFilter[0].valList : []

			this.wsList = tempWsFilter.length > 0 ? tempWsFilter[0].valList : []

			// step 3: 获取指定站点对应的警戒潮位
			if (tempFilterAlertRes.length > 0) {
				const filterAlers = tempFilterAlertRes[0]
				for (let index = 0; index < filterAlers.alert_level_list.length; index++) {
					const level = filterAlers.alert_level_list[index]
					const tide = filterAlers.alert_tide_list[index]
					this.alertlevelList.push({ tide: tide, alert: level })
				}
			}
			this.isChildFinished = true
		}
		console.log(`当前选定的站点为:${site.stationCode},实况数:count:${this.obsVals.length}`)

		this.initDynamicChildProps(site)
		this.isChildFinished = true
	}

	/** TODO:[-] 24-05-21 通过allSiteRealdataList计算获得当前的站点(baseinfo)集合 */
	get sites(): SiteBaseDigestMidModel[] {
		let sites: SiteBaseDigestMidModel[] = []
		sites = this.allSiteRealdataList.map((s) => {
			const siteDictFilter = this.allSites.filter((d) => d.stationCode == s.code)
			/** 从 distStationNameDicts 找到对应的站点名称 */
			const siteName: string =
				siteDictFilter.length > 0 ? siteDictFilter[0].stationName : DEFAULT_SITE_NAME
			const siteCode: string =
				siteDictFilter.length > 0 ? siteDictFilter[0].stationCode : DEFAULT_SITE_CODE
			const siteObsType =
				siteDictFilter.length > 0
					? siteDictFilter[0].observationType
					: ObservationTypeEnum.UN_TYPE
			return new SiteBaseDigestMidModel(siteCode, siteObsType, siteName)
			// return { code: s.code, obsType: s.obsType }
		})
		return sites
	}

	/** TODO:[*] 24-06-17由于通过监听sites发现起止时间发生变化不太方便，新加入startTs与endTs */
	get siteFormOpts(): {
		isFinished: boolean
		sites: SiteBaseDigestMidModel[]
		startTs: number
		endTs: number
	} {
		const { isFinished, sites, startTs, endTs } = this

		return { isFinished, sites, startTs, endTs }
	}

	@Watch('siteFormOpts')
	onSites(val: {
		isFinished: boolean
		sites: SiteBaseDigestMidModel[]
		startTs: number
		endTs: number
	}) {
		/**
		 * 默认获取最后的val并设置为选中状态
		 * TODO:[-] 24-06-12 sites发生变化默认选定最后一个site
		 *
		 */

		if (val.isFinished) {
			// TODO:[-] 24-06-20 此处出现一个bug: 当选中某个站点切换起止时间，会触发两次
			console.log(
				`SiteDataFormView -> onSites :isFinished:${val.isFinished}, sites count:${
					val.sites.length
				}|codes:${val.sites.map((temp) => {
					return temp.stationCode
				})},startTs:${val.startTs},endTs:${val.endTs}}`
			)
			const codes = val.sites.map((s) => {
				return s.stationCode
			})
			// TODO:[-] 24-06-07 若 sites 为 [] 则不触发commit 操作
			// 此处需要同时监听 isFinished
			if (val.sites.length > 0) {
				console.log(`SiteDataFormView -> sites 发生变化:${codes}`)
				const lastSite: SiteBaseDigestMidModel = val.sites[val.sites.length - 1]
				this.commitSite(lastSite)
			}
		}
	}

	/** 监听当前选中 code
	 * TODO:[*] 24-05-22 此处由 selectedCode -> selectedSite
	 * @deprecated 24-06-13 不需要此方法
	 * step1: distStationRealdataList
	 * step2: distStationsAlertlevelList
	 * step3: distStationsAlertlevelList 中过滤
	 * step4: 生成传递给子组件的 mergelist
	 */
	@Watch('selectedSite')
	onSelectedCode(site: SiteBaseDigestMidModel): void {
		// console.log(`SiteDataFormView -> onSelectedCode:${site.stationCode}`)
		// this.commitSite(site)
	}

	setExpanded(val: boolean) {
		this.setShowStationForm(val)
	}

	/** 清空 this.alertlevellist */
	clearAlertLevelList(): void {
		this.alertlevelList = []
	}

	/** 获取所有站点的d85高程差值 */
	@Getter(GET_STATIONS_D85_LIST, { namespace: 'station' })
	getStationsD85List: { code: string; d85: number }[]
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
// TODO:[-] 24-03-26 新加入的tabs样式
.sub-titles {
	.title-border {
		display: flex;
		border-radius: 2px;
		box-shadow: 0 0 10px 0px black;
		@form-base-background();
	}
	.thumb-btn {
		@form-header-expand();
		top: 15px;
	}
}

// TOTO:[-] 24-05-23 加入了 动态切换组件时的动画效果
.component-fade-enter,
.component-fade-leave-to {
}
</style>
