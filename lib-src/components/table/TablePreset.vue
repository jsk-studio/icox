<template>
    <template v-if="value && (!!link || !!tooltip)">
        <el-tooltip popper-class="popper-text" v-if="!!tooltip" placement="top">
            <template #content>
                <div v-html="tooltipText" />
            </template>
            <a class="link" v-if="!!link" @click.prevent="onLink" :href="hrefLink" target="_blank">
                <slot></slot>
            </a>
            <template v-else>
                <slot></slot>
            </template>
        </el-tooltip>
        <a class="link" v-else-if="!!link" @click.prevent="onLink" :href="hrefLink" target="_blank">
            <slot></slot>
        </a>
    </template>
    <template v-else>
        <slot></slot>
    </template>
</template>
<script lang="ts" setup>
import { computed, unref } from "vue"
import { tryCall } from "../../utils"
import { useRouter } from 'vue-router'
const router = useRouter()

const props = defineProps(['name', 'link', 'tooltip', 'value', 'faasParams'])
const computedLink = computed(() => {
    const val = tryCall(props.link, props.faasParams)
    const href = val === true ? props.value : val
    if (typeof href === 'string') {
        return /^https?:\/\/|^\/\//.test(href) ? href : ''
    }
    return href
})

const hrefLink = computed(() => typeof unref(computedLink) === 'string' ? unref(computedLink) : '')
const tooltipText = computed(() => {
    const val = [].concat(tryCall(props.tooltip, props.faasParams))?.[0]
    return val === true ? props.value : val
})

const onLink = () => {
    if (unref(hrefLink)) {
        window.open(unref(hrefLink))
        return
    }
    if (unref(computedLink)) {
        router.push(unref(computedLink))
    }
}
</script>

<style lang="scss" scoped>
.link {
    color: #409eff;
}
</style>
