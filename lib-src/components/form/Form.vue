<template>
<el-form
    v-if="form.data" 
    :model="form.data"
    label-position="right"
    :ref="onFormRef"
    :validate-on-rule-change="false"
    size="mini"
    v-bind="attrs"
>
    <template v-for="(l, i) in mlist" :key="`${l.name}-${mode}`" >
        <br v-if="i !== 0 && newlines.includes(i) && l.type !== 'hidden'" />
        <FormItem v-bind="l" />
    </template>
</el-form>
</template>

<script lang="ts" setup>
import { provide, defineProps, computed, watch, reactive, onMounted, onUnmounted, unref, ref, inject } from "vue";
import { useScopeModule, useScopeState, useFaasParams } from "../../sandbox";
import FormItem from './FormItem.vue'
import { debounceData, tryCall } from "../../utils";
import { cloneDeep, debounce, flatten } from "lodash";
import { x_empty } from "../../utils/x";
import { get as _get, set as _set } from 'lodash'
import { parseDeepkey } from "../../utils";

const props = defineProps(['list', 'attrs', 'rules', 'mode', 'source', 'disabled', 'initdeps', 'onRef' ])
const ctx = useScopeModule('form')
const form = useScopeState('form', ctx.scopeID) as any
const faasParams = useFaasParams()
const formRef = ref()

const getParams = () => ({
    ...faasParams,
    form: parseDeepkey(unref(form).data),
    mode: props.mode || {},
})

const validRequired = (rule: any, value: any, callback: any) => {
    setTimeout(() => {
        value = unref(form).data[rule.ruleName]
        const selected = state.selectSources[rule.ruleName]?.[value] 
            ?? faasParams.filterSources[rule.ruleName]?.[value]
        if (Array.isArray(value) && !value.length) {
            callback(new Error(rule.message))
            return
        }
        const isEmptyVal = ['', null, undefined].includes(value)
        if (!selected && isEmptyVal && rule.message) {
            callback(new Error(rule.message))
        } else {
            callback()
        }
    }, 100);
}

function parseRules(list: any[] = []) {
    const formRules = {} as any
    for (const l of list) {
        if (!l.rules) {
            continue
        }
        const { name: ruleName, more, ...valid } = l.rules
        const computedName = l.name.split('/')[0]
        const trigger = l.source ? 'change' : 'blur'
        const rules = [{
            trigger, 
            ruleName: ruleName || computedName,
            validator: validRequired,
            ...valid,
        }]
        if (Array.isArray(more)) {
            rules.push(...more)
        }
        formRules[l.name] = rules
    }
    return formRules
}

const originList = tryCall(props.list, faasParams)
const defaultList = flatten(originList) as any[]
const defaultRules = parseRules(defaultList)

const state = reactive({ 
    list: defaultList,
    origin: originList,
    rules: defaultRules,
    unmounted: false,
    inited: false,
    stableKey: 0,
    defaultData: {} as any,
    selectSources: {} as any,
})

const onFormRef = (ref: any) => {
    if (ref) {
        ref.curList = unref(mlist)
        ref.ctx = ctx
    }
    formRef.value = ref
    ctx.props.onRef?.(ref)
    props.onRef?.(ref)
}

const mlist = computed(() => {
    const allList = state.list.filter((l: any) => tryCall(l.visible, getParams, true))
    const filterList = [] as any[]
    const list = allList
        .map(({ rules: _, ...l }: any) => {
            const item = {
                ...l,
                disabled: props.disabled || l.disabled,
            }
            if (item.list) {
                filterList.push(...item.list)
                item.list = item.list
                    .map((n: any) => state.list.find((x: any) => x.name === n))
                    .filter(Boolean)
            }
            return item
        })
        .filter((l: any) => !filterList.includes(l.name))
    return list
})

const multipleList = computed(() => {
    const list = []
    for (const l of state.list.filter(l => tryCall(l.visible, getParams, true))) {
        if (l.type === 'multiple') {
            list.push(...l.list)
        }
    }
    return list
})

const newlines = computed(() => {
    const idxs = [] as any[]
    const list = unref(mlist)
    const multiple = unref(multipleList)
    let offset = 0
    for (let i = 0; i < state.origin.length; i++) {
        const item = state.origin[i]
        if (Array.isArray(item)) {
            const mitem = item.filter(l => tryCall(l.visible, getParams, true))
            for (let j = 0; j < mitem.length; j++) {
                const item = mitem[j];
                if (item.newline) {
                    idxs.push(i + j + offset)
                }
            }
            if (mitem.length) {
                const len = mitem.filter(x => !multiple.includes(x.name)).length
                idxs.push(i + offset)
                offset += len
                idxs.push(i + offset)
            }
            offset--
            continue
        }
        if (!tryCall(item.visible, getParams, true)) {
            offset--
        }
    }
    return idxs
})

const onDefaultValue = async () => {
    const defaultData = {} as any
    for (const l of state.list) {
        if (l.name.startsWith('@')) {
            continue
        }
        const computedName = l.name.split('/')[0]
        if (props.initdeps?.includes(computedName)) {
            continue
        }
        defaultData[computedName] = state.defaultData[computedName] ?? null
    }
    ctx.mergeState({ data: defaultData, rules: parseRules(state.list), sources: {}, type: ctx.props.formType })
}
const watchValues = computed(() => {
    const data = unref(form).data
    return JSON.stringify(data)
})

const debounceFormData = debounceData((data: any) => {
    if (state.unmounted) {
        return
    }
    const mData = unref(form).data
    ctx.props.setFormData?.(unref(form).data)
    if (JSON.stringify(mData) !== JSON.stringify(data)) {
        ctx.mergeState({ data, rules: parseRules(state.list) })
        const arr = [] as any[]
        for (const key of Object.keys(data)) {
            const isEmptyArray = Array.isArray(data[key]) && !data[key].length
            if (!x_empty(data[key]) && !isEmptyArray && unref(form).rules[key] && !key.startsWith('@')) {
                arr.push(key)
            }
        }
        setTimeout(() => {
            if (arr.length) {
                formRef.value.validateField(arr)
            }
        })
    }
})

watch(watchValues, async (vals) => {
    const val = unref(form).data
    debounceFormData(val)
    state.origin = await tryCall(props.list, { 
        ...faasParams, 
        form: val, 
    })
    state.list = flatten(state.origin)
})

onMounted(() => {
    onDefaultValue()
})

onUnmounted(() => {
    state.unmounted = true
    state.inited = false
})

const onReset = debounce(() => {
    onDefaultValue()
    setTimeout(() => {
        formRef.value.clearValidate()
    });
}, 30)

const setDefaultValue = (key: any, val: any) => {   
    if (key.startsWith('@')) {
        return
    }
    if (val !== null && state.defaultData[key] === undefined) {
        state.defaultData[key] = val
    }
}

const onLoadedSource = (name: any, val: any[]) => {
    const mapping = {} as any
    for (const v of val) {
        mapping[v.val] = v.label
    }
    state.selectSources[name] = mapping
    ctx.mergeState({ sources: state.selectSources })
}

provide('form:sandbox', {
    setFormData: debounceFormData,
    defaultValue: computed(() =>  props.source || unref(ctx.props.defaultValue) || {}),
    mode: computed(() => props.mode || unref(ctx.props.mode) || {}),
    initdeps: props.initdeps || [],
    reset: onReset,
    setDefaultValue,
    onLoadedSource,
    selectSources: computed(() => state.selectSources),
    ctx,
})

</script>
<style lang="scss" scoped>

</style>