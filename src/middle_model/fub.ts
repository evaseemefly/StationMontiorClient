import { ObservationTypeEnum } from '@/enum/common'

/**
 * @description 浮标基础信息 mid model
 * @author evaseemefly
 * @date 2024/04/25
 * @class FubBaseInfoMidModel
 */
class FubBaseInfoMidModel {
	// rid: number
	stationCode: string
	stationName: string
	lat: number
	lon: number
	sort = -1
	fubType: ObservationTypeEnum = ObservationTypeEnum.MOORING_BUOY
	fubKind: ObservationTypeEnum = ObservationTypeEnum.LARGE_BUOY

	/**
	 * 浮标基础信息 mid model
	 * @author evaseemefly
	 * @date 2024/04/25
	 * @param {string} code
	 * @param {string} name
	 * @param {number} lat
	 * @param {number} lon
	 * @param {ObservationTypeEnum} fubType
	 * @param {ObservationTypeEnum} fubKind
	 * @param {*} [sort=-1]
	 * @memberof FubBaseInfoMidModel
	 */
	constructor(
		code: string,
		name: string,
		lat: number,
		lon: number,
		fubType: ObservationTypeEnum,
		fubKind: ObservationTypeEnum,
		sort = -1
	) {
		// this.rid = rid
		this.stationCode = code
		this.stationName = name
		this.lat = lat
		this.lon = lon
		this.fubKind = fubType
		this.fubKind = fubKind
		this.sort = sort
	}
}

export { FubBaseInfoMidModel }
