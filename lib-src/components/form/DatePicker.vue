<template>
<el-date-picker
    v-model="state.model"
    v-bind="bindAttrs"
    type="datetimerange"
    size="mini"
    :disabled="disabled"
    :format="bindAttrs.format || 'YYYY-MM-DD HH:mm:ss'"
/>
</template>
<script lang="ts" setup>
import { computed, unref, watch } from "vue"
import { useFormModelLegacy } from "../../sandbox"
import dayjs from 'dayjs'

const props = defineProps(['name', 'inner', 'scope', 'disabled'])
const names = props.name.split('&')

const state = useFormModelLegacy({
    valueFrom: (form: any) => {
        const vals = names.map((n: any) => unref(form).data[n] || undefined)
        return vals.length === 1 ? vals[0] : vals   
    },
    defaultRule: (pre: any, cur: any) => {
        const preArr = [].concat(pre).filter(Boolean)
        const curArr = [].concat(cur).filter(Boolean)
        return preArr.length !== 0 && curArr.length === 0 
            && JSON.stringify(preArr) !== JSON.stringify(curArr)
    },
})

const bindAttrs = computed(() => {
    const { ...binds } = props.inner
    return binds
})

watch(() => state.model, values => {
    const dates = [].concat(values)
        .filter(v => +new Date(v))
        .map(v => dayjs(v).format(unref(bindAttrs).format || 'YYYY-MM-DD HH:mm:ss'))
    if (dates.length === 2) {
        props.scope.onChange(dates)
    } else {
        props.scope.onChange([null, null])
    }
})

</script>
<style lang="scss" scoped>

</style>