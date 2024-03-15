/**
 * 所有站点的潮位|天文潮集合 mid
 */
class DistStationSurgeListMidModel {
	/**  */
	stationCode: string
	/** 时间戳集合 */
	tsList: number[]
	/** 潮位集合 */
	surgeList: number[]

	constructor(stationCode: string, tsList: number[], surgeList: number[]) {
		this.stationCode = stationCode
		this.tsList = tsList
		this.surgeList = surgeList
	}
}

/** 站点对应的极值及出现时间 */
class StationMaximumSurgeMideModel {
	stationCode: string
	ts: number
	surge: number
	constructor(stationCode: string, ts: number, surge: number) {
		this.stationCode = stationCode
		this.ts = ts
		this.surge = surge
	}
}
export { DistStationSurgeListMidModel, StationMaximumSurgeMideModel }
