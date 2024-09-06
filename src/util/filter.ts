import moment from 'moment'

import {
	DEFAULT_DATE,
	DEFAULT_PRODUCT_TYPE_NAME,
	DEFAULT_SURGE_VAL,
	DEFAULT_VAL,
	MAX_SURGE,
	MAX_WS,
} from '@/const/default'
import { TyphoonLevelEnum } from '@/enum/typhoon'
import { LayerTypeEnum } from '@/enum/map'
import { getDateDiffMs } from '@/util/dateUtil'
import chroma from 'chroma-js'
import { AlertTideEnum } from '@/enum/surge'
import { ObserveElementEnum } from '@/enum/element'
/**
 * 将时间转换为指定的格式(str)
 *
 * @param {Date} now
 * @returns {string}
 */
const fortmatData2YMDHM = (now: Date): string => {
	if (now === DEFAULT_DATE) {
		return '-'
	} else {
		return moment(now).format('YYYY-MM-DD HH:mm')
	}
}
const fortmatData2MDHM = (now: Date | number): string => {
	return moment(now).format('MM-DD HH:mm')
}
const formatData2YMDH = (now: Date): string => {
	return moment(now).format('YYYY-MM-DD HH')
}
const formatDate2YMD = (now: Date): string => {
	return moment(now).format('YYYY-MM-DD')
}

const formatDate2MD = (now: Date): string => {
	return moment(now).format('MM-DD')
}

const formatDate2HM = (now: Date): string => {
	return moment(now).format('HH:mm')
}

const formatDate2DayHM = (now: Date): string => {
	return moment(now).format('DD HH:mm')
}

/** 将时间戳(单位:s)转换为 dd HH:mm */
const formatTs2DayHM = (ts: number): string => {
	const dt: Date = new Date(ts * 1000)
	const dtStr: string = moment(dt).format('DD HH:mm')
	const temp = new Date(1697626800 * 1000)
	return dtStr
}

const fortmatDate = (now: Date, formatStr: string) => {
	if (now === DEFAULT_DATE) {
		return '-'
	}
	return moment(now).format(formatStr)
}

const formatOnlyFirstCol = (val: { name: string; key: number }): string => {
	return val.key === 0 ? val.name : '-'
}

/**
 * @description val左侧填充' ' 至 length=len
 * @author evaseemefly
 * @date 2022/09/16
 * @param {string} val
 * @param {number} len
 * @returns {*}  {string}
 */
const formatPadLeftStr = (val: string, len: number): string => {
	return val.padStart(len)
}

/**
 * @description val 右侧填充 ' ' 至 Length = len
 * @author evaseemefly
 * @date 2022/09/16
 * @param {string} val
 * @param {number} len
 * @returns {*}  {string}
 */
const formatPadRightstr = (val: string, len: number): string => {
	return val.padEnd(len)
}

/**
 * @description 台风级别 enum => str
 * @author evaseemefly
 * @date 2022/09/28
 * @param {TyphoonLevelEnum} val
 * @returns {*}  {string}
 */
const formatTyLevel2Str = (val: string): string => {
	let tyName = ''
	switch (val) {
		// case TyphoonLevelEnum.TS:
		// 	tyName = '热带风暴'
		// 	break
		// case TyphoonLevelEnum.STS:
		// 	tyName = '强热带风暴'
		// 	break
		// case TyphoonLevelEnum.TY:
		// 	tyName = '台风'
		// 	break
		// case TyphoonLevelEnum.STY:
		// 	tyName = '强台风'
		// 	break
		// case TyphoonLevelEnum.SUPERTY:
		// 	tyName = '超强台风'
		// 	break
		case 'TS':
			tyName = '热带风暴'
			break
		case 'STS':
			tyName = '强热带风暴'
			break
		case 'TY':
			tyName = '台风'
			break
		case 'STY':
			tyName = '强台风'
			break
		case 'SuperTY':
			tyName = '超强台风'
			break

		default:
			tyName = '其他'
			break
	}
	return tyName
}

/**
 * @description 根据台风级别获取对应的 class
 * @author evaseemefly
 * @date 2022/09/28
 * @param {TyphoonLevelEnum} val
 * @returns {*}  {string}
 */
const formatTyLevel2Cls = (val: string): string => {
	let tyName = ''
	switch (val) {
		// case TyphoonLevelEnum.TS:
		// 	tyName = 'green'
		// 	break
		// case TyphoonLevelEnum.STS:
		// 	tyName = 'blue'
		// 	break
		// case TyphoonLevelEnum.TY:
		// 	tyName = 'yellow'
		// 	break
		// case TyphoonLevelEnum.STY:
		// 	tyName = 'orange'
		// 	break
		// case TyphoonLevelEnum.SUPERTY:
		// 	tyName = 'red'
		// 	break
		case 'TS':
			tyName = 'green'
			break
		case 'STS':
			tyName = 'blue'
			break
		case 'TY':
			tyName = 'yellow'
			break
		case 'STY':
			tyName = 'orange'
			break
		case 'SuperTY':
			tyName = 'red'
			break
		default:
			tyName = 'other'
			break
	}
	return tyName
}

/**
 * @description 根据 surge 数值获取对应的 color str
 * 此处标准与 middle_model/station.ts -> IconFormStationDetialedMidModel.getAlarmColor 一致
 * @author evaseemefly
 * @date 2022/10/30
 * @param {number} val
 * @returns {*}  {string}
 */
const filterSurgeAlarmColor = (val: number): string => {
	const surge = val
	let colorStr = ''
	switch (true) {
		case surge <= 100:
			colorStr = 'green'
			break
		case surge <= 150:
			colorStr = 'blue'
			break
		case surge <= 200:
			colorStr = 'yellow'
			break
		case surge <= 250:
			colorStr = 'orange'
			break
		case surge > 250:
			colorStr = 'red'
			break
		default:
			break
	}
	return colorStr
}

/**
 * 将观测值进行标准化
 * 对于最大风速与风速超出阈值的返回 DEFAULT_VAL
 * @param vals
 * @param elementType
 * @returns
 */
const standardValSingular = (vals: number[], elementType: ObserveElementEnum) => {
	let filteredVals: number[] = []
	if (elementType === ObserveElementEnum.WS || elementType === ObserveElementEnum.WSM) {
		filteredVals = vals.map((v) => {
			if (v > MAX_WS) {
				return null
			} else {
				return v
			}
		})
	}
	return filteredVals
}

/** TODO:[-] 24-09-06 将潮位数据进行标准化
 * > MAX_SURGE 的赋值为null
 */
const standardSurgeSingular = (
	vals: number[],
	elementType: ObserveElementEnum = ObserveElementEnum.WL
) => {
	let filteredVals: number[] = []
	if (elementType === ObserveElementEnum.WL) {
		filteredVals = vals.map((v) => {
			if (v > MAX_SURGE) {
				return null
			} else {
				return v
			}
		})
	}
	return filteredVals
}

/**
 * @description 静态色标——'#153C83'
 * @author evaseemefly
 * @date 2024/09/04
 * @param {string} [val='#153C83']
 * @returns {*}  {string}
 */
const filterStaticColor = (val: number): string => {
	const colorStr = '#153C83'
	return colorStr
}

const filterSpiderStationStatusCls = (updateDt: Date, now: Date): string => {
	const dtTsDiff = getDateDiffMs(now, updateDt)
	let statusCls = ''
	switch (true) {
		case dtTsDiff < 3 * 60 * 60 * 1000:
			statusCls = 'green'
			break
		case dtTsDiff < 6 * 60 * 60 * 1000:
			statusCls = 'blue'
			break
		case dtTsDiff < 12 * 60 * 60 * 1000:
			statusCls = 'yellow'
			break
		case dtTsDiff <= 24 * 60 * 60 * 1000:
			statusCls = 'orange'
			break
		case dtTsDiff > 24 * 60 * 60 * 1000:
			statusCls = 'red'
			break
		default:
			statusCls = 'other'
			break
	}
	return statusCls
}

const waveScale = chroma
	.scale('#153C83', '#4899D9', '#FFFB58', '#F1C712', '#E79325', '#F22015', '#C40E0F')
	.domain([2, 3, 4, 6, 9, 12, 14])
/**
 * @description 根据输入的浪高获取对应的颜色
 * @author evaseemefly
 * @date 2023/02/09
 * @param {number} val
 * @returns {*}  {string}
 */
const filterWaveColor = (val: number): string => {
	// chroma.scale(['yellow', 'lightgreen', '008ae5']).domain([0, 0.25, 1])
	const scale = chroma
		.scale(['#153C83', '#4899D9', '#FFFB58', '#F1C712', '#E79325', '#F22015', '#C40E0F'])
		.domain([0, 3, 4, 6, 9, 12, 14])
	const colorStr = scale(val).hex()
	return colorStr
}

/**
 * @description 根据增水值显示对应的颜色
 * 与 filterSurgeAlarmColor 遵循风暴潮强度等级分级
 * @author evaseemefly
 * @date 2023/07/25
 * @param {number} val
 * @returns {*}  {string}
 */
const filterSurgeColorStr = (val: number): string => {
	// chroma.scale(['yellow', 'lightgreen', '008ae5']).domain([0, 0.25, 1])
	const scale = chroma
		.scale(['#153C83', '#4899D9', '#FFFB58', '#F1C712', '#E79325', '#F22015', '#C40E0F'])
		.domain([50, 100, 150, 200, 250])
	const colorStr = scale(val).hex()
	return colorStr
}

/**
 * @description color list 获取风速
 * @author evaseemefly
 * @date 2023/11/09
 * @param {number} val
 * @returns {*}  {string}
 */
const filterWindColorStr = (val: number): string => {
	const scale = chroma
		.scale(['#153C83', '#4899D9', '#FFFB58', '#F1C712', '#E79325', '#F22015', '#C40E0F'])
		.domain([5, 8, 10, 14, 18, 21])
	const colorStr = scale(val).hex()
	return colorStr
}

const filterBPColorStr = (val: number): string => {
	const scale = chroma
		.scale(['#153C83', '#4899D9', '#FFFB58', '#F1C712', '#E79325', '#F22015', '#C40E0F'])
		.domain([1000, 990, 980, 970, 960, 950])
	const colorStr = scale(val).hex()
	return colorStr
}

/**
 * @description 根据传入的四色警戒潮位与当前总潮位值获取对应的颜色
 * @author evaseemefly
 * @date 2023/08/29
 * @param {number} val
 * @param {number[]} alertTides
 * @returns {*}  {string}
 */
const filterAlertSurgeColorStr = (val: number, alertTides: number[]): string => {
	const scale = chroma
		.scale(['#4899D9', '#153C83', '#FFFB58', '#F1C712', '#E79325', '#F22015'])
		.domain([0, ...alertTides])
	const colorStr = scale(val).hex()
	return colorStr
}

/**
 * 根据传入的警戒潮位枚举返回对应的警戒潮位title
 * @param val
 * @returns 蓝色警戒潮位|..
 */
const filterAlertTitle = (val: AlertTideEnum): string => {
	let text = ''
	switch (val) {
		case AlertTideEnum.BLUE:
			text = '蓝色警戒潮位'
			break
		case AlertTideEnum.YELLOW:
			text = '黄色警戒潮位'
			break
		case AlertTideEnum.ORANGE:
			text = '橙色警戒潮位'
			break
		case AlertTideEnum.RED:
			text = '红色警戒潮位'
			break
		default:
			break
	}
	return text
}

/**
 * 根据传入的警戒潮位枚举返回对应的警戒潮位的class
 * @param val green|..
 * @returns
 */
const filterAlertColorStr = (val: AlertTideEnum): string => {
	let text = ''
	switch (val) {
		case AlertTideEnum.BLUE:
			text = 'green'
			break
		case AlertTideEnum.YELLOW:
			text = 'yellow'
			break
		case AlertTideEnum.ORANGE:
			text = 'orange'
			break
		case AlertTideEnum.RED:
			text = 'red'
			break
		default:
			break
	}
	return text
}

/**
 * @description 根据字典获取对应的海洋站中文名
 * @author evaseemefly
 * @date 2022/11/09
 * @param {string} code
 * @param {{ name: string; chname: string }[]} [nameDict=[]]
 * @returns {*}  {string}
 */
const filterStationNameCh = (
	code: string,
	nameDict: { name: string; chname: string }[] = []
): string => {
	/** 当前站点英文名 */
	const stationNameEn = code
	const queryName = nameDict.find((temp) => {
		return temp.name === stationNameEn
	})

	/** 当前站点中文名 */
	const stationNameCh = queryName !== undefined ? queryName.chname : stationNameEn
	return stationNameCh
}

/**
 * @description 根据传入的实况增水若<=0则说明最大的增水仍为减水，则返回-;否则 tostring
 * @author evaseemefly
 * @date 2022/12/06
 * @param {number} val
 * @returns {*}  {string}
 */
const filterStationAlertTideVal = (val: number): string => {
	if (val > 0) {
		return val.toString()
	} else {
		return '-'
	}
}

/**
 * 获取产品种类名称
 * @param productType 产品种类枚举
 * @returns 产品对应的名称
 */
const filterProductTypeName = (productType: LayerTypeEnum): string => {
	let productTypeName: string = DEFAULT_PRODUCT_TYPE_NAME
	switch (productType) {
		case LayerTypeEnum.RASTER_LAYER_MWD:
			productTypeName = '平均波向'
			break
		case LayerTypeEnum.RASTER_LAYER_MWP:
			productTypeName = '平均波周期'
			break
		case LayerTypeEnum.RASTER_LAYER_SHWW:
			productTypeName = '风浪波高'
			break
		case LayerTypeEnum.RASTER_LAYER_WVE:
			productTypeName = '有效波高'
			break
		default:
			productTypeName = DEFAULT_PRODUCT_TYPE_NAME
			break
	}
	return productTypeName
}

/**
 * 根据经纬度获取经纬度字符串
 * 保留 saveSpliceNum 有效数字
 * @param latlng
 * @returns
 */
const filterLatlng2Str = (latlng: L.LatLng | undefined): string => {
	let latlngStr = '-'
	/** 需要保留有效数字的位数 */
	const saveSpliceNum = 2
	if (latlng !== undefined) {
		latlngStr = `${latlng.lat.toFixed(saveSpliceNum)}, ${latlng.lng.toFixed(saveSpliceNum)}`
	}

	return latlngStr
}

/**
 * @description 对方向取整
 * @author evaseemefly
 * @date 2023/02/08
 * @param {number} val
 * @returns {*}  {string}
 */
const formatDir2Int = (val: number): string => {
	const dirInt = Math.trunc(val)
	return dirInt.toString()
}

/**
 * @description 将输入的 surge 值转换为 str . 若输入的为 DEFAULT_SURGE_VAL 则输出 -
 * @author evaseemefly
 * @date 2023/02/07
 * @param {number} val
 * @returns {*}  {string}
 */
const formatSurge2Str = (val: number): string => {
	let surgeStr = val.toString()
	if (val === DEFAULT_SURGE_VAL) {
		surgeStr = '-'
	}
	return surgeStr
}

/**
 * @description 将输入的surge保留2为有效数字
 * @author evaseemefly
 * @date 2023/02/08
 * @param {number} val
 * @returns {*}  {string}
 */
const formatSurgeFixed2Str = (val: number | null): string => {
	if (
		val === null ||
		val === DEFAULT_SURGE_VAL ||
		val === -DEFAULT_SURGE_VAL ||
		val === DEFAULT_VAL
	) {
		return '-'
	}
	const surgeStr = val.toFixed(2)
	return surgeStr
}

/**
 * @description 24-09-06 新加入的非矢量要素过滤函数
 * @author evaseemefly
 * @date 2024/09/06
 * @param {number} val
 * @param {ObserveElementEnum} elementType
 */
const formatUnVectorFixed2Str = (val: number, elementType: ObserveElementEnum) => {
	let formatStr = '-'
	if (elementType === ObserveElementEnum.WS || elementType === ObserveElementEnum.WSM) {
		if (val > MAX_WS) {
			formatStr = '*'
		} else {
			formatStr = formatSurgeFixed2Str(val)
		}
	} else {
		formatStr = formatSurgeFixed2Str(val)
	}
	return formatStr
}

const formatSurgeFiexIntStr = (val: number | null): string => {
	return formatSurgeFixed2NumStr(0, val)
}

const formatSurgeFiex1NumStr = (val: number | null): string => {
	return formatSurgeFixed2NumStr(1, val)
}

const formatSurgeFixed2NumStr = (fixedNum: number, val: number | null): string => {
	if (val === null || val === DEFAULT_SURGE_VAL || val === -DEFAULT_SURGE_VAL) {
		return '-'
	}
	const surgeStr = val.toFixed(fixedNum)
	return surgeStr
}
/**
 * @description 将 s -> hour
 * @author evaseemefly
 * @date 2023/04/05
 * @param {number} val
 * @returns {*}  {number}
 */
const formatSecond2Hour = (val: number): number => {
	return val / (60 * 60)
}

const formatContry2Str = (val: {
	id: number
	valCh: string
	valEn: string
	count: number
}): string => {
	if (val !== null) {
		return val.valCh
	}
	return '-'
}

/**
 * @description 根据观测要素获取对应的名称
 * @author evaseemefly
 * @date 2024/05/10
 * @param {ObserveElementEnum} val
 * @returns {*}  {string}
 */
const formatObsType2Name = (val: ObserveElementEnum): string => {
	let name = ''
	switch (val) {
		case ObserveElementEnum.WS:
			name = '风速'
			break
		case ObserveElementEnum.AT:
			name = '气温'
			break
		case ObserveElementEnum.BG:
			name = '平均波高'
			break
		case ObserveElementEnum.BP:
			name = '气压'
			break
		case ObserveElementEnum.WD:
			name = '风向'
			break
		case ObserveElementEnum.YZQ:
			name = '有效波周期'
			break
		case ObserveElementEnum.WSM:
			name = '最大风速'
			break
		case ObserveElementEnum.YBG:
			name = '有效波高'
			break
		default:
			break
	}
	return name
}

/** TODO:[*] 24-06-24 对于vals数组的缺省值填充指定数值(fillDefault) */
const fillDefaultVal2List = <T>(vals: T[], defaultList: T[], fillDefault: T = null): T[] => {
	// const filledList: T[] = []
	vals.forEach((ele, index) => {
		if (defaultList.includes(ele)) {
			vals[index] = fillDefault
		}
	})
	return vals
}

export {
	fortmatData2YMDHM,
	formatOnlyFirstCol,
	formatPadLeftStr,
	formatPadRightstr,
	formatDate2YMD,
	formatDate2MD,
	formatDate2HM,
	formatDate2DayHM,
	formatTs2DayHM,
	formatTyLevel2Str,
	formatTyLevel2Cls,
	fortmatData2MDHM,
	filterSurgeAlarmColor,
	filterStationNameCh,
	filterStationAlertTideVal,
	filterProductTypeName,
	filterLatlng2Str,
	formatSurge2Str,
	formatDir2Int,
	formatSecond2Hour,
	formatSurgeFixed2Str,
	formatSurgeFiexIntStr,
	formatContry2Str,
	filterWaveColor,
	filterSpiderStationStatusCls,
	filterSurgeColorStr,
	filterWindColorStr,
	formatSurgeFixed2NumStr,
	formatSurgeFiex1NumStr,
	filterAlertSurgeColorStr,
	filterAlertTitle,
	filterAlertColorStr,
	formatObsType2Name,
	filterBPColorStr,
	fillDefaultVal2List,
	filterStaticColor,
	formatUnVectorFixed2Str,
	standardValSingular,
	standardSurgeSingular,
}
