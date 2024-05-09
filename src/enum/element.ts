/**
 * @description 观测要素枚举
 * @author evaseemefly
 * @date 2024/05/08
 * @enum {number}
 */
enum ObserveElementEnum {
	/**风速 */
	WS = 504,
	/** 风向*/
	WD = 505,
	/**最大风速 */
	WSM = 506,
	/**气温 */
	AT = 503,
	/** 气压 */
	BP = 507,
	/** 平均波高 */
	BG = 508,
	/** 有效波高 */
	YBG = 509,
	/** 有效波周期 */
	YZQ,
}

export { ObserveElementEnum }
