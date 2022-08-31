<template>
<div class="btn">
    <el-tooltip v-if="tooltipText" popper-class="popper-text" placement="top">
        <template #content>
            <div v-html="tooltipText" />
        </template>
        <el-button
            @click="onAction"
            :name="computedName"
            class="is-disabled"
            :style="style"
            size="mini"
            v-bind="attrs"
            style="point-event:none"
            :key="name"
            >
            {{computedText}}
        </el-button>
    </el-tooltip>
    <el-button
        v-else
        :name="computedName"
        :disabled="computedDisabled"
        @click="onAction"
        :style="style"
        size="mini"
        v-bind="attrs"
        style="point-event:none"
        >
            {{computedText}}
    </el-button>
</div>

</template>
<script lang="ts" setup>
import { computed, defineProps, unref, useAttrs, watch, inject } from 'vue'
import { useDialogModule, useFaasParams } from '../../index'
import { useRouter } from 'vue-router'
import { tryCall } from '../../utils'
import { debounce } from 'lodash'
import { useShowDialogContext } from '../../sandbox'
const sandbox = inject('form:sandbox', {}) as any

const router = useRouter()
const props = defineProps([
    // stable 属性
    'name', // 映射 key
    'style', // 样式
    'attrs', // 属性
    'scope', // 注入 scope
    'type', // 按钮类型, 暂无作用, 保留字段 
    // faas 注入
    'text', // 按钮文本: faas 类型 text
    'action', // 按钮操作: faas 类型 any
    'params', // 按钮注入 params: fass 类型 any
    'disabled', // 是否禁用: faas 类型 boolean
    'tooltip', // 提示消息: faas 类型 html
])

const faasParams = useFaasParams()
const showDialog = useShowDialogContext()

const computedName = computed(() => {
    return props.name?.split('/')[0]
})


const mParams = computed(() => ({
    ...faasParams,
    scope: props.scope || {},
    row: props.scope?.row,
    def: { 
        text: unref(computedText), 
    },
    params: tryCall(props.params, {
        ...faasParams,
        scope: props.scope || {},
        row: props.scope?.row,
    }),
}))
const disabledState = computed(() => tryCall(props.disabled, mParams))
const tooltipText = computed(() => {
    if (unref(disabledState)) {
        return ''
    }
    const tips = tryCall(props.tooltip, mParams)
    return [].concat(tips).filter(Boolean)[0]
})
const computedText = computed(() => tryCall(props.text, mParams, false))
const computedDisabled = computed(() => !!unref(tooltipText) || unref(disabledState))

const onAction = debounce(async () => {
    if (unref(computedDisabled)) {
        return
    }
    let execAction = props.action
    if (typeof execAction === 'function') {
        execAction = await execAction({
            ...unref(mParams),
            showDialog,
        })
    }
    // faas 情况下应该没有返回值
    if (!execAction) {
        return
    }
    // 如果有返回值则认为是 link
    if (typeof execAction !== 'string') {
        if (execAction.newTab) {
            window.open(router.resolve(execAction).href, '_blank')
        } else {
            router.push(execAction)
        }
    } else if (/^https?:\/\/|^\/\//.test(execAction || '')) {
        location.href = execAction
    } else {
        router.push(execAction)
    }
}, 100)
</script>

<style lang="scss" scoped>
.btn {
    display: inline-block;
    > * {
        width: 100%;
    }
}
</style>