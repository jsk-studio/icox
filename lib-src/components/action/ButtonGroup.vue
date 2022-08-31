<template>
<div class="btn-group" :style="gridStyle" :class="{ 'grid-group': !!gridStyle }">
    <Button
        class="group-btn"
        v-for="l in mlist" 
        :scope="scope"
        v-bind="l"
    />
</div>
</template>
<script lang="ts" setup>
import { computed, defineProps, watch } from 'vue'
import { useFaasParams } from '../../index'
import { useRouter } from 'vue-router'
import Button from './Button.vue'
import { tryCall } from '../../utils'

const router = useRouter()
const props = defineProps(['list', 'scope', 'inner'])
const faasParams = useFaasParams()

const getParams = () => ({
    ...faasParams,
    scope: props.scope || {},
    row: props.scope?.row,
})

const mlist = computed(() => {
    const mParams = getParams()
    const list = tryCall(props.list, mParams, [])
    return list.filter((l: any) => tryCall(l.visible, mParams, true))
})
const gridStyle = computed(() => {
    if (!props.inner?.column) {
        return
    }
    const arr = []
    for (let i = 0; i < props.inner.column; i++) {
        arr.push('1fr')
    }
    return {
        'grid-template-columns': arr.join(' '),
    }
})

</script>
<style lang="scss" scoped>
.btn-group {
    margin: 10px 0;
}
.group-btn + .group-btn {
    margin-left: 10px;
    margin-bottom: 10px;
}
.grid-group {
    display: grid;
    grid-gap: 10px;
    .group-btn + .group-btn {
        margin: 0;
    }
}
</style>