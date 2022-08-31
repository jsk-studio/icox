<template>
    <TreeRender
        v-if="custom || complexType" 
        :key="stableKey"
        :tree="{ component: custom || complexType }" 
        :args="{
            scope,
            inner,
            name: computedName,
            value: computedValue,
        }" 
    />
    <TreeRender 
        v-else-if="computedType === 'operation'" 
        :key="stableKey"
        :tree="operationTree" 
        :args="{ scope, inner }" 
    />
    <TablePreset
        v-else
        :value="computedValue" 
        :faasParams="getParams"
        :link="link"
        :tooltip="tooltip"
        :name="computedName"
    >
        <div v-if="computedType === 'html'" v-html="computedValue" style="white-space: pre-line;" />
        <template v-else-if="computedType === 'image'">
            <template v-if="computedValue" >
                <img :src="computedValue" class="table-column-img" />
            </template>
            <div class="table-column-noimg" v-else>无预览图</div>
        </template>
        <template v-else-if="!computedType || computedType === 'text'">
            <div :class="getTextClass" :style="getTextStyle">{{ computedValue }}</div>
        </template>
        <template v-else>
            <div>{{ computedValue }}</div>
        </template>
    </TablePreset>
</template>
<script lang="ts" setup>
import TablePreset from './TablePreset.vue'
import TreeRender from "../../render/TreeRender.vue";
import dayjs from 'dayjs'
import VideoPreview from './VideoPreview.vue'
import { tryCall } from "../../utils";
import { useFaasParams, useScopeContext } from "../../sandbox";
import { computed, onMounted, reactive, unref, watch } from 'vue';
import { useStore } from 'vuex';
import _get from 'lodash/get'

const props = defineProps([
    // stable 属性
    'name', // 映射 key
    'type',  // 表格类型: video, image, html, time, operation
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
    // 特殊
    'stableKey', // WORKAROUND: 为了解决列表内刷新的问题
    'scope',
])

const faasParams = useFaasParams()
const ctx = useScopeContext('table')
const store = useStore()

const computedName = computed(() => props.name)
const computedType = computed(() => props.type || 'text')

const computedValue = computed(() => {
    // let rowValue = props.scope.row[props.name]
    let rowValue = _get(props.scope.row, props.name)
    const mtype = unref(computedType)
    if (mtype === 'text') {
        if (props.format === undefined) {
            const mapping = unref(ctx.props.mapping)[props.name]
            if (mapping) {
                rowValue = mapping[rowValue] ?? rowValue
            }
        }
        if (typeof props.format === 'string') {
            const storeMapping = unref(store.state.mapping)
            rowValue = storeMapping[props.format]?.[rowValue] ?? rowValue
        } else {
            rowValue = props.format?.[rowValue] ?? rowValue
        }
    } else if (props.type === 'time') {
        if (String(rowValue).length === 10) {
            rowValue *= 1000
        }
        rowValue = dayjs(rowValue).format(props.format)
    }
    if (!props.value) {
        return rowValue
    }
    return tryCall(props.value, {
        ...faasParams,
        rowValue,
    })
})

const getParams = () => ({
    ...faasParams,
    rowValue: unref(computedValue)
})

const complexTypeMap = {
    'video': VideoPreview,
} as any

const complexType = computed(() => {
    return complexTypeMap[props.type]
})

const getTextClass = computed(() => {
    if (unref(computedType) !== 'text') {
        return
    }
    if (!props.format) {
        return
    }
    return props.format.rows === 1 ? 'table-column-text-1' : 'table-column-text-n'
})

const getTextStyle = computed(() => {
    if (unref(computedType) !== 'text') {
        return {}
    }
    if (!props.format || props.format.rows == 1) {
        return {}
    }
    const rows = props.format.rows
    return {
        '-webkit-line-clamp': rows,
        'line-clamp': rows,
    }
})
const operationTree = computed(() => {
    return {
        type: 'ButtonGroup',
        props: { list: [].concat(props.value || []) }
    }
})

</script>
<style lang="scss" scoped>
.table-column-img {
    width: 95%;
    max-height: 300px;
    background-color: #777;
}
.table-column-noimg {
    width: 95%;
    display: inline-flex;
    border: 1px solid #999;
    color: #666;
    border-radius: 2px;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    padding: 10px;
    background: #fff;
    box-sizing: border-box;
}
.table-column-link {
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    word-break: break-all;
}
.table-column-text-1 {
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    word-break: break-all;
}
.table-column-text-n {
    text-overflow: -o-ellipsis-lastline;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    // -webkit-line-clamp: 2;
    // line-clamp: 2;
}
</style>