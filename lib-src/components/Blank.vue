<template>
  <template v-if="state.inited">
    <slot v-bind="attrs" name="Blank" :faasParams="faasParams"></slot>
  </template>
</template>
<script lang="ts" setup>
import { registFaasPageParams } from "../sandbox/faas";
import { onMounted, reactive, useAttrs } from 'vue';
const state = reactive({ inited: false })
const faasParams = registFaasPageParams()
const attrs = useAttrs()

onMounted(() => {
  setTimeout(() => {
    state.inited = true
  }, 50);
})
</script>