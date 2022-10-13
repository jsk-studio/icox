<template>
<el-table
    :data="table.data"
    @selection-change="onSelectionChange"
    @sort-change="onSortChange"
    :ref="r => tableRef = r"
    :height="fixheight"
    :key="state.stableKey"
>
    <TableColumn 
        v-for="(l, i) in state.list" 
        v-bind="l"
        :stableKey="state.stableKey"
        :key="`${l.name}-${i}`"
    />
</el-table>
</template>
<script lang="ts" setup>
import { useScopeModule, useScopeState, useFaasParams } from "../../sandbox";
import { computed, defineProps, watch, unref, reactive, ref } from 'vue'
import TableColumn from './TableColumn.vue'
import { tryCall } from "../../utils";
const props = defineProps(['list', 'source', 'onChange', 'initdeps', 'fixheight' ])
const ctx = useScopeModule('table')
const table = useScopeState('table', ctx.scopeID) as any
const faasParams = useFaasParams()
const params = computed(() => unref(ctx.props.params) || {})
const state = reactive({ stableKey: 1, loading: true, prelist: [] as any[], list: [] as any[] })
const tableRef = ref()

// TODO: defalutSort 无效设置, 推测是由于动态 list 的问题
const defaultSort = computed(() => {
    const filter = unref(params)
    if (!filter?.order) {
        return
    }
    const sortStr = ['ascending','descending'].find(x => x.startsWith(filter.sort)) || ''
    return { prop: filter.order, order: sortStr }
})


watch(() => unref(table)?.data, (val) => {
    let mlist = tryCall(props.list, faasParams) as any[]
    if (!state.prelist.length && mlist.length && val.length) {
        // 产生的问题为, 当设置 table 高度并且 column fixed 之后, 会导致 column fixed 的定位错误
        // 原因由于 table 需要先渲染 column 再设置数据, 当数据设置完成后, 再动态改变设置 column 不生效
        // 只有首次渲染会出现问题, 所以解决方案为当首次加载之后更新数据列表, 但理论上当 table column 的 key 不匹配需要重新渲染时都会出现此问题
        // WORKROUND: 解决当 table 设置高度之后, 页面 column 的展示问题
        // 升级 element 版本后, 解决了此问题
        // setTimeout(() => {
        //     if (!val) {
        //         return
        //     }
        //     ctx.mergeState({ data: [ ...val ] })
        // }, 50)
    }
    mlist = mlist.filter(l => tryCall(l.visible, faasParams) ?? true)
    state.prelist = mlist
    // WORKAROUND: 在列表完成变化或者变更时, 重置 defaultSort
    unref(tableRef)?.sort(unref(defaultSort)?.prop, unref(defaultSort)?.order)
    state.list = mlist
})

ctx.mergeState({ data: [] })

const fetchData = async () => {
    state.loading = true
    const res = await props.source(faasParams)
    // 暂无 loading 逻辑
    state.loading = false
    ctx.mergeState({
        data: res.list,
        pager: res.pager,
    })
    state.stableKey++
    ctx.props.onPager(res.pager || {})
}

watch(params, async () => {
    fetchData()
})


const onSelectionChange = (val: any) => {
    props.onChange?.(val)
    ctx.props.onChange?.(val)
}

const onSortChange = ({ order, prop }: any) => {
    const s = unref(defaultSort)
    // 当 defaultSort 变更时进行请求
    if (s && order === s.order && prop === s.prop) {
        return
    }
    const sortStr = ['asc','desc'].find(x => order?.startsWith(x)) || ''
    ctx.props.onSubmit({
        order: prop,
        sort: sortStr,
    })
}


</script>
<style lang="scss" scoped>

</style>