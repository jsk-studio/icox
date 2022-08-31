<template>
<el-pagination
    :class="{ 
        'fixed-pagination': fixed,
    }"
    @size-change="onPagerChange('ps', $event)"
    @current-change="onPagerChange('pn', $event)"
    :current-page="pager.pn"
    :page-size="pager.ps"
    :total="pager.total || 0"
    :page-sizes="pager.sizes || [10,20,30,50]"
    :layout="'total, sizes, prev, pager, next, jumper'"
    v-bind="attrs"
>
</el-pagination>
</template>
<script lang="ts" setup>
import { computed, inject, watch, unref } from "vue-demi"
import { useFaasParams, useScopeContext } from "../../sandbox"

const props = defineProps(['attrs', 'fixed'])
const faasParams = useFaasParams()
const ctx = useScopeContext('pagination')
const pagerProps = inject('[scope]pager:props', { pager: {}, onSubmit: () => {} } as any)
const pager = computed(() => unref(pagerProps.pager))

const onPagerChange = (type: string, val: any) => {
    if (type === 'ps') {
        pagerProps.onSubmit({ [type]: val, pn: 1 })
    } else {
        pagerProps.onSubmit({ [type]: val })
    }
}

</script>
<style lang="scss" scoped>
.fixed-pagination {
    position: fixed;
    bottom: 20px;
    background: #fff;
    padding: 0 20px;
    z-index: 10;
}
</style>