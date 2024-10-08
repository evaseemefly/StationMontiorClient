import { IconTypeEnum, ObservationTypeEnum } from '@/enum/common'
import { StationIconLayerEnum } from '@/enum/map'
import { Icon } from 'leaflet'

/**
 * @description 将 icon类型枚举 转换为 观测站类型枚举
 * @author evaseemefly
 * @date 2024/05/07
 * @param {IconTypeEnum} val
 * @returns {*}  {ObservationTypeEnum}
 */
const formatIconTypeEnum2ObservationTypeEnum = (val: IconTypeEnum): ObservationTypeEnum => {
	let tempObsType: ObservationTypeEnum = ObservationTypeEnum.STATION
	switch (val) {
		case IconTypeEnum.STATION_STATICS_ICON:
			tempObsType = ObservationTypeEnum.STATION
			break
		case IconTypeEnum.FUB_ICON:
			tempObsType = ObservationTypeEnum.FUB
			break
		default:
			break
	}
	return tempObsType
}

/**
 * @description 将 观测站类型枚举 转换为 icon类型枚举
 * @author evaseemefly
 * @date 2024/09/02
 * @param {ObservationTypeEnum} val
 * @param {boolean} [isUsed=true] 是否是使用中的站点
 * @returns {*}  {IconTypeEnum}
 */
const formatObservationTypeEnum2IconTypeEnum = (
	val: ObservationTypeEnum,
	isUsed = true
): IconTypeEnum => {
	let tempIconType: IconTypeEnum = IconTypeEnum.STATION_STATICS_ICON
	switch (val) {
		case ObservationTypeEnum.STATION:
			tempIconType = IconTypeEnum.STATION_STATICS_ICON
			break
		case ObservationTypeEnum.FUB:
			tempIconType = IconTypeEnum.FUB_ICON
			break
		default:
			break
	}
	// 24-09-02 加入对于不使用的站点的判断
	if (tempIconType == IconTypeEnum.STATION_STATICS_ICON && isUsed == false) {
		tempIconType = IconTypeEnum.STATION_STATICS_UNUSED_ICON
	}
	return tempIconType
}

/**
 * @description 将 StationIconLayerEnum -> ObservationTypeEnum
 * @author evaseemefly
 * @date 2024/05/07
 * @param {StationIconLayerEnum} val
 * @returns {*}  {ObservationTypeEnum}
 */
const formatStationIconLayerEnum2ObservationTypeEnum = (
	val: StationIconLayerEnum
): ObservationTypeEnum => {
	let tempType: ObservationTypeEnum = ObservationTypeEnum.STATION
	switch (val) {
		case StationIconLayerEnum.ICON_STATION:
			tempType = ObservationTypeEnum.STATION
			break
		case StationIconLayerEnum.ICON_FUB:
			tempType = ObservationTypeEnum.FUB
			break
		default:
			break
	}
	return tempType
}

const formatStationIconLayerEnum2IconTypeEnum = (val: StationIconLayerEnum): IconTypeEnum => {
	let tempType: IconTypeEnum = IconTypeEnum.STATION_STATICS_ICON
	switch (val) {
		case StationIconLayerEnum.ICON_STATION:
			tempType = IconTypeEnum.STATION_STATICS_ICON
			break
		case StationIconLayerEnum.ICON_FUB:
			tempType = IconTypeEnum.FUB_ICON
			break
		default:
			break
	}
	return tempType
}

export {
	formatIconTypeEnum2ObservationTypeEnum,
	formatObservationTypeEnum2IconTypeEnum,
	formatStationIconLayerEnum2ObservationTypeEnum,
	formatStationIconLayerEnum2IconTypeEnum,
}
