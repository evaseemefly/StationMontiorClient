class DistStationWindListMidModel {
	/**  */
	stationCode: string
	/** 时间戳集合 */
	tsList: number[]
	/** 风速集合 */
	wsList: number[]
	/** 风向集合 */
	wdList: number[]

	constructor(stationCode: string, tsList: number[], wsList: number[], wdList: number[]) {
		this.stationCode = stationCode
		this.tsList = tsList
		this.wsList = wsList
		this.wdList = wdList
	}
}

export { DistStationWindListMidModel }
