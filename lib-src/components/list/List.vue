<template>
    <div :style="{ paddingBottom: props.fixedpage ? '40px' : 0}">
        <slot name="Filter"></slot>
        <slot name="Action"></slot>
        <slot name="Table"></slot>
        <slot name="Pagination"></slot>
    </div>
</template>
<script lang="ts" setup>
import { registFaasPageParams } from "../../sandbox/faas";
const props = defineProps(['pool', 'fixedpage'])
registFaasPageParams({ 
    pool: props.pool
})
</script>
<style lang="scss" scoped>

</style>
