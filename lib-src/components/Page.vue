<template>
  <el-container class="container">
    <el-aside v-if="showSidebar" class="aside-menu" width="auto">
        <slot name="Sidebar"></slot>
    </el-aside>
    <el-container style="padding:0;min-width: 900px;">
        <el-header class="header">
            <slot name="Header"></slot>
        </el-header>
        <el-main>
            <router-view id="router-view"></router-view>
            <div id="page-root"></div>
        </el-main>
    </el-container>
  </el-container>
</template>
<script lang="ts" setup>
import { computed, reactive } from "@vue/reactivity";
import { useRoute } from "vue-router";
const route = useRoute()
const props = defineProps(['nosidebar'])
const state = reactive({
    shown: false,
})

const showSidebar = computed(() => {
    return !props.nosidebar?.includes(route.name)
})

</script>
<style lang="scss" scoped>
.container {
    padding: 0;
    height: 100%;
}
.aside-menu {
    box-shadow: -2px 1px 10px #c0c4cc;
    height: 100%;
    z-index: 2;
}
.header {
    box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
    border-bottom: 1px solid rgba(0, 21, 41, 0.08);
    padding: 0;
    z-index: 1;
}
#router-view {
    &.hidden {
        height: 0;
        overflow: hidden;
        flex: 0;
    }
}
</style>