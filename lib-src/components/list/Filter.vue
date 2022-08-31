<template>
<el-form
    v-if="form.data" 
    :model="form.data"
    @submit="onSubmit"
    :inline="true"
    :key="ctx.scopeID"
>
    <template v-for="(l, i) in mlist" :key="`${l.name}-${state.resetKey}`" >
        <br v-if="i !== 0 && newlines.includes(i)" />
        <FormItem v-bind="l" />
    </template>
</el-form>
</template>

<script lang="ts" setup>
import { provide, defineProps, computed, watch, reactive, onMounted, onUnmounted, unref } from "vue";
import { useScopeModule, useScopeState, useFaasParams } from "../../sandbox";
import FormItem from '../form/FormItem.vue'
import { debounceData, onBeforeSetdata, tryCall } from "../../utils";
import { debounce, flatten, keys } from "lodash"

const props = defineProps(['list', 'initdeps', 'onSubmit'])
const ctx = useScopeModule('form')
const form = useScopeState('form', ctx.scopeID) as any
const defaultData = {} as any
const faasParams = useFaasParams()

const getParams = () => ({
    ...faasParams,
    filter: {
        ...faasParams.filter,
        ...unref(form).data,
    }
})

const originList = tryCall(props.list, getParams)
const defaultList = flatten(originList) as any[]

const state = reactive({ 
    list: defaultList,
    origin: originList,
    unmounted: false,
    inited: false,
    resetKey: 0,
})

const newlines = computed(() => {
    const idxs = [] as any[]
    const list = unref(mlist)
    let offset = 0
    for (let i = 0; i < state.origin.length; i++) {
        const item = state.origin[i]
        if (Array.isArray(item)) {
            const mitem = item.filter(l => tryCall(l.visible, getParams, true))
            if (mitem.length) {
                idxs.push(i + offset)
                offset += mitem.length
                idxs.push(i + offset)
            }
            offset -= 1
            continue
        }
        if (!tryCall(item.visible, getParams, true)) {
            offset -= 1
        }
    }
    return idxs
})

const mlist = computed(() => {
    const list = state.list.filter((l: any) => tryCall(l.visible, getParams, true))
    // WORKAROUND: fix for warning
    for (const l of list) {
        delete l.extExcludes
        delete l.extParent
        delete l.exts
    }
    return list
})

const watchValues = computed(() => {
    const data = unref(form).data
    return JSON.stringify(data)
})

const onDefaultValue = () => {
    for (const l of state.list) {
        if (l.name.startsWith('@')) {
            continue
        }
        const computedName = l.name.split('/')[0]
        defaultData[computedName] = null
    }
    ctx.mergeState({ data: onBeforeSetdata(defaultData), rules: {}, type: 'filter' })
}

const onSubmit = () => {
    if (state.unmounted || !isInitdeps()) {
        return
    }
    const data = { ...unref(form).data }
    for (const l of state.list) {
        if (l.name.startsWith('@')) {
            continue
        }
        const computedName = l.name.split('/')[0]
        const visible = tryCall(l.visible, getParams, true)
        if (!visible) {
            data[computedName] = null
            continue
        }
        if (l.type === 'hidden') {
            // WORKAROUND: filter 下, hidden 类型的值需要写入 query, 特殊处理
            data[computedName] = l.defaultValue
        }
    }
    const submitData = onBeforeSetdata(data)
    props.onSubmit?.(submitData)
    ctx.props.onSubmit?.(submitData)
}

const onReset = () => {
    ctx.props.onResetDefault?.()
    state.resetKey ++
}

const isInitdeps = () => {
    if (!Array.isArray(props.initdeps)) {
        return true
    }
    const list = unref(mlist) as any[]
    const val = unref(form).data
    let flag = true
    for (const initdep of props.initdeps) {
        const computedName = initdep?.split('/')?.[0]
        if (
            (val[computedName] === null || val[computedName] === undefined)
            && list.some(l => computedName && computedName === l.name.split('/')?.[0])
        ) {
            flag = false
            break
        }
    }
    return flag
}

const updateList = debounce(() => {
    state.origin = tryCall(props.list, getParams)
    state.list = flatten(state.origin)
    if (!state.inited && isInitdeps()) {
        state.inited = true
        // 如果在表达中, 存在 submit 自动提交类型的 action, 则完成依赖检测后会自动进行提交
        if (!unref(mlist).some((l: any) => l.action === 'submit' && l.type !== 'button')) {
            setTimeout(onSubmit, 30);
        }
    }
}, 50)

watch(watchValues, () => {
    updateList()
})

onMounted(() => {
    onDefaultValue()
})

onUnmounted(() => {
    state.unmounted = true
    state.inited = false
})

provide('form:sandbox', {
    submit: debounce(onSubmit, 10),
    reset: debounce(onReset, 150),
    setFormData: debounceData((data: any) => {
        if (state.unmounted) {
            return
        }
        ctx.mergeState({ data: onBeforeSetdata(data) })
    }),
    cleanFormData: (data: any) => {
        ctx.mergeState({ data: onBeforeSetdata(data) })
    }
})

</script>
<style lang="scss" scoped>

</style>