import { ObserveElementEnum } from '@/enum/element'

/** 观测要素接口 */
interface IObserveElement {
	code: string
	tsList: number[]
	valList: number[]
}

/** 单一要素观测mid */
class ObserveElementMidModel implements IObserveElement {
	code: string
	elementType: ObserveElementEnum
	tsList: number[]
	valList: number[]
}

/** 指定site的所有要素mid */
class ObserveValueMidModel {
	code: string
	/** 单一观测要素集合 */
	obsVals: ObserveElementMidModel[]
}

export { ObserveElementMidModel, ObserveValueMidModel }
