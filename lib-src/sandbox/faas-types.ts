import { RouteLocationRaw } from "vue-router"

export type FaasParams = {
    filter: any, // 当前 filter 数据
    filterSources: any, // @deprecated 建议废弃, filter 的列表 map
    form: any // 当前表单
    last: (name: string, offset: number) => any, // 获取倒序表单
    getters: any // store.getters
    pool: any // 当前渲染的组件列表
    route: any // 当前 route
    router: any // vue-route
    store: any // vuex
    selected: any[] // 被选择的 table 行信息
    unRefs: any // @deprecated 废弃
    wash: any // @deprecated 废弃 
}

type FaasProp<T = any> = T | ((ctx: FaasParams) => (Promise<T> | T) )

type IFaasOps = { label: string, val: any }[]

type FaasConfBase = {
    name: string, // name, match key
    style?: any, // 透传 style
    attrs?: any, // 透传 attrs
    // faas props
    visible?: FaasProp<boolean>, // 是否可见 
    exts?: any[], // @deprecated 继承属性并生成新的元素, 不推荐
}

type FaasFormInner = {
    // 各种 el-element 的属性透传 or 自定义组件属性透传
    radioType?: 'btn' | 'label', // type: radio 生效, radio 样式选择
    radioBorder?: any, // type: radio 生效, 透传 radioBoder
} & any

type FaasConfForm = FaasConfBase & {
    custom?: any, // 自定义组件
    type?: // 默认 select or radiox`
        'select' // 下拉框
        | 'button' // 表单按钮, 与 action 联用
        | 'text' // 纯文本展示
        | 'input' // 文本输入框
        | 'number' // 数字输入框
        | 'textarea' // 区域文本输入框
        | 'radio' // 单选框
        | 'checkbox' // 复选框 
        | 'date' // 日期选择器
        | 'block' // 无 form item label
        | 'multiple' // 表单复制
        | 'hidden'  // 隐藏表单但数值会提交数据
        | 'extends' // 可继承同名属性并且覆盖, 不推荐
    action?: 'submit' | 'reset'
    inner?: FaasFormInner,
    deps?: string[], // 若 source 加载存在数值依赖, 需要补充对应的 key
    rules?: any, // 表单校验 rules
    // faas props
    label?: FaasProp<string>, // 表单 label
    source?: FaasProp<IFaasOps>, // 若值存在, 则默认 select 类型, 否则 input 类型
    tooltip?: FaasProp<any | string>, // 表单 hovertip, 支持 html
    disabled?: FaasProp<boolean>, // 是否禁用
    params?: FaasProp<any>, // 透传的 params 属性
    defaultValue?:  FaasProp<any>, // 表单默认值
}

type FaasConfTable = FaasConfBase & {
    custom?: any, // 自定义组件
    type?: // 默认 text
        'text' // 文本
        | 'video' // 可播放视频
        | 'image' // 图片+放大
        | 'html'  // 自定义 html
        | 'time' // 日期
        | 'selection' // select column
        | 'operation' // operation column
        | 'extends' // 可继承同名属性并且覆盖, 不推荐
    format?: any, // 可配置 日期转换: YYYY-MM-DD, 数值映射: map | string, 最大展示行数: { rows: number } 
    inner?: any // 属性透传
    // faas props
    params?: FaasProp<any>, // 透传的 params 属性
    label?: FaasProp<string>, // 表单 label
    tooltip?: FaasProp<any | string | string[]>, // 数据表 hovertip
    link?: FaasProp<boolean | string | string[]>, // 链接跳转, string 时可以更换链接地址
}

type FaasActionParams = FaasParams & {
    scope?: any, // table scope,
    row?: any, // table scope row
    showDialog: any, // 唤起弹窗
    def?: { 
        text: string, // 按钮文字
    },
}

type FaasActionProp<T = any> = T | ((ctx: FaasActionParams) => (Promise<T> | T))

type FaasConfBtn = FaasConfBase & {
    type?: 'extends' // 可继承同名属性并且覆盖, 不推荐
    text?: FaasActionProp<string>, // 表单 label
    disabled?: FaasActionProp<boolean>, // 是否禁用
    tooltip?: FaasActionProp<any | string>, // 表单 hovertip, 支持 html
    params?: FaasActionProp<any>, // 按钮属性透传至 action
    action?: FaasActionProp<null | undefined | void | RouteLocationRaw | any>, // 按钮 action
}

export type FaasConfRaw = {
    base?: any, // @deprecated 继承某个 raw, 暂定废弃
    form?: FaasConfForm[],
    filter?:  FaasConfForm[],
    table?: FaasConfTable[],
    operation?: FaasConfBtn[],
    action?: FaasConfBtn[],
}
