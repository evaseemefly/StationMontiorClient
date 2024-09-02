import { DEFAULT_SITE_NAME } from '@/const/default'
import { ObservationTypeEnum } from '@/enum/common'

/**
 * 站点基础信息
 */
class SiteBaseInfoMidModel {
	// rid: number
	stationCode: string
	stationName: string
	lat: number
	lon: number
	sort = -1
	/** 观测站点类型 : station|fub */
	observationType: ObservationTypeEnum = ObservationTypeEnum.STATION
	/** 是否在使用中 */
	isInUsed = true

	/**
	 * 观测站基础信息mid model
	 * @param code
	 * @param name
	 * @param lat
	 * @param lon
	 * @param obsType
	 * @param sort
	 */
	constructor(
		code: string,
		name: string,
		lat: number,
		lon: number,
		obsType: ObservationTypeEnum,
		sort = -1,
		inUsed = true
	) {
		// this.rid = rid
		this.stationCode = code
		this.stationName = name
		this.lat = lat
		this.lon = lon
		this.observationType = obsType
		this.sort = sort
		this.isInUsed = inUsed
	}
}

/**
 * TODO:[-] 24-05-07 + 只用来存储 code 与 observationType
 */
class SiteBaseDigestMidModel {
	stationCode: string
	name: string
	/** 观测站点类型 : station|fub */
	observationType: ObservationTypeEnum = ObservationTypeEnum.STATION

	/**
	 * 观测站摘要信息mid model
	 * @param code
	 * @param obsType
	 */
	constructor(code: string, obsType: ObservationTypeEnum, name: string = DEFAULT_SITE_NAME) {
		this.stationCode = code
		this.name = name
		this.observationType = obsType
	}
}

export { SiteBaseInfoMidModel, SiteBaseDigestMidModel }
