import { ObservationTypeEnum } from '@/enum/common'
import { ObserveElementEnum } from '@/enum/element'

/** 观测要素接口 */
interface IObserveElement {
	code: string
	tsList: number[]
	valList: (number | null)[]
}

/** 单一要素观测mid */
class ObserveElementMidModel implements IObserveElement {
	code: string
	elementType: ObserveElementEnum
	tsList: number[]
	valList: (number | null)[]
	constructor(
		code: string,
		elementType: ObserveElementEnum,
		tsList: number[],
		valList: (number | null)[]
	) {
		this.code = code
		this.elementType = elementType
		this.tsList = tsList
		this.valList = valList
	}
}

/** 指定site的所有要素mid */
class ObserveValueMidModel {
	code: string
	/** 单一观测要素集合 */
	obsVals: ObserveElementMidModel[]
	/** 观测站点类型 */
	obsType: ObservationTypeEnum
	constructor(code: string, obsType: ObservationTypeEnum, obsVals: ObserveElementMidModel[]) {
		this.code = code
		this.obsType = obsType
		this.obsVals = obsVals
	}
}

export { ObserveElementMidModel, ObserveValueMidModel }
