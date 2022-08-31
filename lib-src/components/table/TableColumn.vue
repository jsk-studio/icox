<template>
<el-table-column
    :type="selectionType"
    :label="computedLabel"
    :prop="computedName"
    align="center"
    :style="style"
    v-bind="bindAttrs"
>
    <template v-if="!selectionType" #default="scope">
        <TableCell 
            :scope="scope" 
            v-bind="cellAttrs"
        />
    </template>
</el-table-column>
</template>
<script lang="ts" setup>
import { computed, defineProps, reactive, unref } from "vue"
import { useFaasParams, useScopeContext } from "../../sandbox";
import TreeRender from "../../render/TreeRender.vue";
import dayjs from 'dayjs'
import TableCell from './TableCell.vue'
import VideoPreview from './VideoPreview.vue'
import { tryCall } from "../../utils";
import { cloneDeep } from "lodash";
const state = reactive({ label: '111' })

const props = defineProps([
    // stable 属性
    'name', // 映射 key
    'type',  // 表格类型: image, operation, html, time, mapper, samesource
    'custom', // 自定义组件: RenderTree
    'attrs', // 表格绑定属性: any
    'style', // 样式绑定属性抽离: style
    'inner', // 根据 type 绑定相关属性: any
    'format', // 根据 type 特定的 value 转换器, 针对 type 映射不同值(string|object), 不支持 faas
    // fass 注入
    'value', // 最终展示结果: faas 类型 any
    'label', // 标签项: fass 类型 string
    'link', // 链接: fass 类型 boolean | string | () => string
    'tooltip', // 提示信息: faas 类型 string | string[]
    'visible', // 是否可见
    // 特殊
    'stableKey', // WORKAROUND: 为了解决列表内刷新的问题
])

const faasParams = useFaasParams()
const computedName = computed(() => {
    return props.name?.split('/')[0]
})

const computedVisible = computed(() => {
    return tryCall(props.visible, faasParams) ?? true
})
const cellAttrs = computed(() => ({
    inner: props.inner,
    format: props.format,
    value: props.value,
    link: props.link,
    tooltip: props.tooltip,
    name: unref(computedName),
    type: props.type,
    custom: props.custom,
    stableKey: props.stableKey
})) 
const bindAttrs = computed(() => {
    if (!props.attrs) {
        return {}
    }
    const attrs = cloneDeep(props.attrs)
    const minWidth = props.attrs.minWidth || props.attrs['min-width']
    const autoType = !props.type || props.type === 'text'
    if (autoType && attrs.width && !minWidth && attrs.autosize !== false) {
        attrs.minWidth = attrs.width
        delete attrs.width
    }
    delete attrs.autosize
    return attrs
})
const computedLabel = computed(() => {
    return tryCall(props.label, faasParams)
})

const selectionType = computed(() => {
    return 'selection' === props.type ? 'selection' : undefined
})
const computedType = computed(() => {
    return props.type && props.type.split(':')[0]
})

</script>
