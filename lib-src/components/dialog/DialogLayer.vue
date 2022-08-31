<template>
    <TreeRender 
        v-for="dialog in dialogs" 
        :tree="dialog.tree" 
        :args="{ scopeID: dialog.scopeID }"
        :key="dialog.scopeID"
    />
</template>
<script lang="ts" setup>
import { useStore } from 'vuex'
import { computed, onMounted, onUnmounted, provide, ref, watch } from 'vue'
import TreeRender from '../../render/TreeRender.vue'
const store = useStore()
const dialogs = computed(() => {
    const dialogModule = store.state['[scope]dialog']
    if (!dialogModule) {
        return []
    }
    return Object.keys(dialogModule.scopeState).filter(key => 
        Object.keys(dialogModule.scopeState[key] || {}).length > 0 && dialogModule.scopeState[key].visible
    ).map(key => {
        const mstate = dialogModule.scopeState[key]
        return { tree: mstate.tree, scopeID: key }
    })
})

</script>
<style lang="scss" scoped>

</style>