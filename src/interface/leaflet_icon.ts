import { IconTypeEnum } from '@/enum/common'

/**
 * 实现方法 toHtml 类的接口
 *
 * @export
 * @interface IToHtml
 */
export interface IToHtml {
	toHtml(): string
	getClassName(): string
	getStationCode(): string
}

/**
 * @description 可添加至地图中的 icon 实现类几口
 * @author evaseemefly
 * @date 2024/04/25
 * @export
 * @interface IIconImplement
 */
export interface IIconImplement {
	/** fub code 或 station code */
	code: string
	/** 显示的icon名称 */
	name: string
	/** 纬度 */
	lat: number
	/** 经度 */
	lon: number
	/** icon 类型 */
	iconType: IconTypeEnum

	/** 生成对应的 icon html */
	toHtml(): string
	/** 生成对应的 icon cls */
	getClassName(): string
}
