<template>
    <!-- <span style="background:rgba(155,155,155,.5);z-index:9999">
        debug: {{props.name}}, {{computedType}}
    </span> -->
    <template v-if="computedType === 'button'">
        <TreeRender
            v-if="inner && inner.buttonType === 'group'"
            :tree="{ type: 'ButtonGroup', props: {
                list: attrs ? [attrs] : (inner.list || []) }
            }"
            :key="`${name}-${computedLabel}-${computedDisabled}`"
            :args="{ 
                name: computedName,
                disabled: computedDisabled,
                scope: {
                    row: ctx.props.defaultValue,
                },
            }" 
        />
        <el-button
            v-else
            class="form-button"
            @click="onButtonAction" 
            size="mini"
            :style="style"
            :name="computedName"
            v-bind="attrs"
        >{{label}}</el-button>
    </template>
    <template v-else-if="['block', 'multiple'].includes(computedType) && (custom || complexType)">
        <TreeRender 
            v-if="computedName.startsWith('@') || (form && form.data[computedName] !== null)"
            :tree="{ component: custom || complexType }"
            :key="`${name}-${computedLabel}-${computedDisabled}-${listNames}`"
            :args="{ 
                inner: computedInner,
                name: computedName,
                disabled: computedDisabled,
                scope: {
                    onChange: onDataChange,
                    getParams, getParams,
                    options: state.options,
                    list: list,
                },
            }" 
        />
    </template>
<el-form-item
    :style="[style, itemBottomOffset]"
    :prop="computedRules.prop"
    :rules="computedRules.rules"
    :key="`${computedRules.prop}-${name}`"
    v-bind="attrs"
    :ref="ref => itemRef = ref"
    :show-message="checkboxLoaded"
    v-else-if="rulesLoaded && checkboxLoaded && computedType !== 'hidden'"
>
    <template v-if="computedLabel" #label>
        <span>{{computedLabel}}</span>
        <el-tooltip v-if="tooltipText" popper-class="popper-text" placement="top">
            <template #content>
                <div v-html="tooltipText" />
            </template>
            <i class="el-icon-info" style="margin-left: 5px" />
        </el-tooltip>
    </template>
    <template v-if="custom || complexType" >
        <TreeRender 
            v-if="form && (form.data[computedName] !== null || computedName.includes('&'))"
            :tree="{ component: custom || complexType }"
            :key="`${name}-${computedLabel}-${computedDisabled}`"
            :args="{ 
                inner: computedInner,
                name: computedName,
                disabled: computedDisabled,
                scope: {
                    onChange: onDataChange,
                    getParams,
                    options: state.options,
                    list: list,
                },
            }" 
        />
        <!-- <div>{{computedName}}:{{JSON.stringify(form.data[computedName])}}</div> -->
    </template>
    <template v-else-if="computedType === 'select'">
        <el-select
            size="mini"
            :name="computedName"
            v-model="form.data[computedName]" 
            @change="onChange" 
            :disabled="computedDisabled"
            v-bind="bindInnerAttrs"
        >
            <el-option 
                v-for="o in state.options" 
                :label="o.label" 
                :value="o.val"
                :key="`${o.val}-${o.label}`"
            />
        </el-select>
    </template>
    <template v-else-if="computedType === 'input'">
        <el-input
            :key="props.name"
            :name="computedName"
            size="mini" 
            v-model="form.data[computedName]" 
            :disabled="computedDisabled"
            clearable
            v-bind="bindInnerAttrs"
            class="form-text-input"
        />
    </template>
    <template v-else-if="computedType === 'number'">
        <el-input-number
            :key="props.name"
            :name="computedName"
            size="mini"
            v-model="state.numberModel"
            @change="onChange"
            :disabled="computedDisabled"
            :controls="false"
            v-bind="bindInnerAttrs"
            class="form-text-input"
        />
    </template>
    <template v-else-if="computedType === 'text'">
        <el-input 
            v-if="computedDisabled"
            :name="computedName"
            size="mini" 
            :model-value="computedTextValue"
            disabled
            v-bind="bindInnerAttrs"
            class="form-text-input"
        />
        <template v-else>
            {{ computedTextValue }}
        </template>
    </template>
    <template v-else-if="computedType === 'checkbox'">
        <el-checkbox-group
            size="mini" 
            class="form-radio-group"
            v-model="form.data[computedName]" 
            :name="computedName"
            @change="onChange" 
            :disabled="Array.isArray(computedDisabled) ? false : computedDisabled"
            v-bind="bindInnerAttrs" 
        >
            <el-checkbox
                v-for="o in state.options" 
                :label="o.val" 
                :key="`${o.val}-${o.label}`"
                :disabled="Array.isArray(computedDisabled) ? computedDisabled.includes(o.val) : false"
            >
                {{ o.label }}
            </el-checkbox>
        </el-checkbox-group>
    </template>
    <template v-else-if="computedType === 'radio'">
        <el-radio-group 
            size="mini" 
            v-model="form.data[computedName]" 
            @change="onChange" 
            :name="computedName"
            class="form-radio-group"
            :class="{ 'radio-split-btn': inner && 'btn' === inner.radioType }"
            :disabled="computedDisabled"
            v-bind="bindInnerAttrs" 
        >
            <template v-if="inner && ['label', 'btn'].includes(inner.radioType)">
                <el-radio-button 
                    v-for="o in state.options" 
                    :label="o.val"
                    :key="`${o.val}-${o.label}-label`"
                >
                    {{ o.label }}
                </el-radio-button>
            </template>
            <template v-else>
                <el-radio
                    v-for="o in state.options" 
                    :label="o.val" 
                    :border="inner && inner.radioBorder"
                    :key="`${o.val}-${o.label}`"
                >
                    {{ o.label }}
                </el-radio>
            </template>
        </el-radio-group>
    </template>
</el-form-item>
</template>
<script lang="ts" setup>
import { defineProps, watch, computed, reactive, onMounted, inject, provide, unref, onUnmounted, ref, customRef } from 'vue'
import { useScopeState, useFaasParams, useScopeContext } from '../../sandbox';
import TreeRender from '../../render/TreeRender.vue';
import DatePicker from './DatePicker.vue'
import MutipleGroup from './MutipleGroup.vue'
import { cloneDeep, debounce } from 'lodash';
import { tryCall, parseDeepkey, renameParams } from '../../utils';
import { get as _get, set as _set, has as _has } from 'lodash'


const props = defineProps([
    // stable 属性
    'name', // 映射 key
    'type',  // 表单类型: select, input, date, button, radio, number, textarea
    'custom', // 自定义组件: RenderTree
    'attrs', // 表单绑定属性: any
    'style', // 样式绑定属性抽离: style
    'inner', // 根据 type 绑定相关属性: any
    'list', // 自定义选项列表 string array
    'action', // 交互行为: submit/reset
    'deps', // 依赖项 keys: string array
    'visible', // form 注入
    // fass 注入, 指参数可以是一个函数
    'label', // 标签项: fass 类型 string
    'source', // 数据源: fass 类型 pool array
    'defaultValue', // 默认值: fass 类型 any
    'params', // 注入属性: faas 类型 any
    'disabled', // 是否禁用: faas 类型 boolean
    'tooltip', // 提示消息: faas 类型 html
])


const itemRef = ref()
const form = useScopeState('form') as any
const ctx = useScopeContext('form')
const sandbox = inject('form:sandbox') as any
const faasParams = useFaasParams()
const computedName = computed(() => {
    return props.name?.split('/')[0]
})

const mutiple = inject('mutiple-group', {}) as any
const mutipleVal = computed(() => {
    if (!mutiple.depkey || !mutiple.depval) {
        return {}
    }
    const valMap = unref(form).data?.[mutiple.depkey] || {}
    const nameKey = unref(computedName).replace(`${mutiple.depkey}.`, '').split('.')[0]
    return {
        [mutiple.depval]: nameKey,
        ...valMap[nameKey]
     }
})
// provide('mutiple-group', mutiple)

const computedType = computed(() => {
    let mtype: any = (!props.custom && props.type) || (props.source ? 'select' : 'input')
    if (props.type === 'textarea') {
        mtype = 'input'
    }
    if (props.custom && props.type === 'block') {
        mtype = 'block'
    }
    return mtype
})

const listNames = computed(() =>
    props.list?.map((x: any) => x.name).join('-')
)
const itemBottomOffset = computed(() => {
    if (['input', 'number'].includes(unref(computedType))) {
        return { 'margin-bottom': '14px' }
    }
})

const state = reactive({
    options: [] as any[],
    unmounted: false,
    inited: false,
    beforeInited: {},
    model: null,
    defval: undefined,
    checkboxLoaded: computedType.value !== 'checkbox',
    numberModel: undefined as any,
    numberDefault: props.inner?.precision > 0 || props.inner?.forceNumber ? null : undefined,
})

const complexTypeMap = {
    date: DatePicker,
    multiple: MutipleGroup,
} as any

const complexType = computed(() => {
    return complexTypeMap[computedType.value]
})

const computedRules = computed(() => {
    const rules = unref(form).rules?.[props.name] || unref(mutiple?.rules)?.[props.name]
    if (!rules) {
        return {}
    }
    const rule = rules[0]
    return { prop: rule.ruleName, rules }
})

const rulesLoaded = computed(() => {
    const mData = unref(form).data
    const mRules = unref(computedRules)
    if (!mRules.prop) {
        return true
    }
    for (const prop of mRules.prop.split('&')) {
        if (!_has(mData, prop)) {
            return false
        }
    }
    return true
    // return !mRules.prop || (mRules.prop && _has(mData, mRules.prop))
})

const checkboxLoaded = computed(() => {
    const mData = unref(form).data
    if (computedType.value === 'checkbox') {
        return Array.isArray(_get(mData, unref(computedName)))
    }
    return true
})

const bindInnerAttrs = computed(() => {
    if (!props.inner) {
        return
    }
    const cloneInner = {
        ...props.inner
    }
    delete cloneInner.radioType
    delete cloneInner.radioBorder
    delete cloneInner.disabled

    // 宽高太常用, 调整基本
    renameParams(cloneInner, {
        width: 'style.width',
    })
    if (props.type === 'textarea') {
        cloneInner.type = 'textarea'
    }
    return cloneInner
})

const computedTextValue = computed(() => {
    const val = unref(form).data[unref(computedName)]
    if (!state.options) {
        return val
    }
    return state.options.find(o => o.val === val)?.label ?? val
})

const computedInner = computed(() => ({
    ...props.inner,
    disabled: tryCall(props.inner?.disabled, getParams)
}))

const getParams = () => {
    const mform = unref(form)
    const res = {
        ...faasParams,
        form: parseDeepkey({ ...mform?.data, ...unref(mutipleVal) }),
        mode: unref(sandbox.mode) || unref(ctx.props.mode),
        raw: unref(ctx.props.defaultValue),
        rowName: unref(computedName),
        rowType: unref(computedType),
        selectSources: unref(sandbox.selectSources),
    } as any
    // 如果是 filter 的 form, 则需要实时同步覆盖 filter 的变化
    // 原则上 filter 中不需要拿到 分页/排序相关信息, 简化 api 采用覆盖策略, 如果需要则可以通过 query
    if (mform?.type === 'filter') {
        res.filter = mform?.data
    }
    return {
        ...res,
        params: tryCall(props.params, res, {})
    }
}

const tooltipText = computed(() => {
    const tips = tryCall(props.tooltip, getParams)
    return [].concat(tips).filter(Boolean)[0]
})

const computedDisabled = computed(() => {
    const defvals = unref(ctx.props.defaultValue)
    const mName = unref(computedName)
    if (_has(defvals, mName) && sandbox.initdeps?.includes(mName)) {
        // 数据表重置逻辑, 为重置成首次加载后的值, 所以在存在全局默认值的情况下, 默认不可修改编辑
        return true
    }
    return tryCall(props.disabled, getParams)
})

watch(() => state.options, (val) => {
    ctx.props.onLoadedSource?.(unref(computedName), val)
    sandbox.onLoadedSource?.(unref(computedName), val)
})

const computedLabel = computed(() => {
    const labels = tryCall(props.label, getParams)
    return [].concat(labels).filter(Boolean)[0]
})
async function refreashSource(watchs?: any) {
    const mtype = unref(computedType)
    if (mtype === 'button') {
        return
    }
    const data = unref(form).data
    if (!data) {
        return
    }
    const deps: any[] = [].concat(props.deps).filter(Boolean)
    const curParams = getParams()
    if (typeof props.source === 'function') {
        // 如果依赖列表中不存在请求值, 则不处理
        let flag = true
        const depvals = []
        for (const depkey of deps) {
            // WORKAROUND: 兼容特殊 case, 主要处理 hidden 类型带来的影响, 以及列表页和详情页机制不一致的问题
            if (
                data[depkey] === null 
                || (
                    data[depkey] === undefined
                    && unref(form).type !== 'filter' 
                    && unref(form).type !== 'dialog' 
                )
            ) {
                flag = false
            } else {
                depvals.push(depkey)
            }
        }
        if (!flag) {
            return
        }
        for (const depkey of depvals) {
            ctx.props.clearFilterDefaultValue?.(depkey, data[depkey])
        }
        state.options = await props.source(curParams)
    }
    
    let defaultValue = props.defaultValue ?? null
    const formDefaultValue = unref(sandbox.defaultValue) || unref(ctx.props.defaultValue) || {}
    // 目前大多数情况下, options 的默认值为首项的预期远超于其它
    if (props.defaultValue === undefined && ['select', 'radio'].includes(mtype)) {
        defaultValue = ({ options }: any) => options[0]
    }
    const mName = unref(computedName)
    let ctxDefaultValue = _get(formDefaultValue, mName)
    if (mName.includes('&')) {
        ctxDefaultValue = mName.split('&').map((n: any) => _get(formDefaultValue, n) ?? null)
        const mtype = unref(computedType)
        const empts = [null, undefined] as any[]
        if (mtype === 'date') {
            empts.push('')
        }
        if (ctxDefaultValue.filter((x: any) => !empts.includes(x)).length === 0) {
            ctxDefaultValue = null
        }
    }
    if (!state.inited && ctxDefaultValue !== null && ctxDefaultValue !== undefined) {
        if (!['select'].includes(mtype) || state.options.some(o => o.val === ctxDefaultValue)) {
            defaultValue = ctxDefaultValue
        }
        if (mtype === 'select' && Array.isArray(ctxDefaultValue)) {
            defaultValue = ctxDefaultValue
        }
        if (!deps || (watchs && deps.every(dep => watchs[dep] !== null))) {
            state.inited = true
        }
    } else if (!watchs && ctxDefaultValue !== null && ctxDefaultValue !== undefined) {
        // 更新默认值并清空
        defaultValue = ctxDefaultValue
        if (!Array.isArray(defaultValue)) {
            ctx.props.clearDefaultValue(mName, defaultValue)
        } else {
            for (let i = 0; i < defaultValue.length; i++) {
                const names = mName.split('&')
                ctx.props.clearDefaultValue(names[i], defaultValue[i])
            }
        }
        
    } else if (data[mName] && !deps.some(dep => watchs?.[dep] !== null)) {
        // 非选择组件, 根据依赖维持默认值逻辑
        if (!['input', 'number'].includes(mtype)) {
            // 如果依赖项变化但不是当前组件的依赖, 则不更新默认值
            defaultValue = data[mName]
        }
    } 
    if (typeof defaultValue === 'function' && state.options) {
        // 如果默认值是函数, 则计算默认值
        const v = await defaultValue({
            ...curParams,
            options: state.options
        })
        defaultValue = v?.val ?? v ?? null
    } else if (typeof defaultValue === 'function') {
        const v = await defaultValue({
            ...curParams,
        })
        defaultValue = v?.val ?? v ?? null
    }
    if (state.unmounted) {
        return
    }
    if (mtype === 'input') {
        defaultValue = defaultValue ?? ''
    }
    if (mtype === 'checkbox') {
        defaultValue = defaultValue ?? []
    }
    if (mtype === 'number') {
        if (typeof defaultValue === 'string') {
            defaultValue = Number(defaultValue) || null
        }
        defaultValue = defaultValue ?? state.numberModel ?? state.numberDefault ?? props.defaultValue
        state.numberModel = defaultValue
        state.defval = defaultValue ?? null
        sandbox.setDefaultValue?.(mName, state.defval)
    }
    if (state.defval === undefined) {
        state.defval = defaultValue ?? null
        sandbox.setDefaultValue?.(mName, state.defval)
    }
    if (mName.includes('&')) {
        const names = mName.split('&')
        const d = {} as any
        for (let i = 0; i < names.length; i++) {
            const n = names[i];
            d[n] = defaultValue?.[i]
        }
        sandbox.setFormData(d)
    } else {
        sandbox.setFormData({ [unref(computedName)]: defaultValue })
    }
    onChange()
}

onMounted(async () => {
    if (Array.isArray(props.source)) {
        state.options = props.source
    }
    await refreashSource()
})
onUnmounted(() => {
    state.unmounted = true
    sandbox.cleanFormData?.({ [unref(computedName)]: null })
    onChange()
})

const watchValues = computed(() => {
    const data = unref(form).data
    const deps = [].concat(props.deps).filter(Boolean)
    if (!deps.length || !data) {
        return
    }
    const values = {} as any
    for (const dep of deps) {
        if (dep === unref(computedName)) {
            continue
        }
        const depval = _get(data, dep)
        if (depval === null) {
            continue
        }
        values[dep] = depval
    }
    return JSON.stringify(values)
})

const onRefreashSource = debounce(async (val) => {
    await refreashSource(val)
}, 20)

watch(watchValues, async (val) => {
    sandbox.setFormData({ [unref(computedName)]: null })
    await onRefreashSource(JSON.parse(val || '{}'))
})

const onButtonAction = () => {
    if (props.action === 'submit') {
        sandbox.submit?.()
    } else if (props.action === 'reset') {
        sandbox.reset?.()
    }
}

// WORKAOUNRD: number 兼容
watch(() => state.numberModel, val => {
    if (state.numberModel === undefined) {
        setTimeout(() => {
            state.numberModel = typeof props.defaultValue === 'number' ? props.defaultValue : state.defval 
        })
    }
    const data = unref(form).data
    if (computedType.value === 'number' && val !== data[unref(computedName)]) {
        if (state.defval === undefined) {
            return
        }
        sandbox.setFormData({ [unref(computedName)]: val ?? props.defaultValue ?? null })
    }
})
watch(() => unref(form).data[unref(computedName)], val => {
    if (unref(computedType) === 'number') {
        if (state.defval === undefined) {
            return
        }
        state.numberModel = val ?? state.numberDefault
    }
})

const onChange = (val?: any) => {
    if (props.action === 'submit') {
        sandbox.submit?.()
    }
    if (!sandbox.initdeps) {
        return
    }
    if (val !== undefined && sandbox.initdeps.includes(unref(computedName))) {
        sandbox.reset?.()
    }
}

const onDataChange = debounce((data?: any) => {
    if (data) {
        const names = unref(computedName).split('&')
        if (names.length > 1) {
            if (data.length !== names.length) {
                console.error('更新值不匹配: '+ props.name, data)
            }
            const d = {} as any
            for (let i = 0; i < names.length; i++) {
                const n = names[i];
                d[n] = data[i]
            }
            sandbox.setFormData(d)
        } else {
            sandbox.setFormData({ [unref(computedName)]: data })
        }
    }
    onChange()
}, 50)

</script>
<style lang="scss" scoped>
.form-radio-group {
    display: flex;
    height: 100%;
    align-items: center;
}
.form-text-input {
    width: 160px;
}
.form-button {
    margin-bottom: 10px;
}
</style>