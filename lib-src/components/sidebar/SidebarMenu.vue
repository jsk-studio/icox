<template>
  <SidebarMenu v-if="!deepTree" :deep-tree="authMenu" />
  <template v-else-if="Array.isArray(deepTree)">
    <SidebarMenu
        v-for="(subtree, i) in deepTree"
        :key="i"
        :deep-tree="subtree" />
  </template>
  <!-- 约定存在 name 就一定是可跳转路由的 item -->
  <el-menu-item 
    v-else-if="deepTree.shown && deepTree.name"
    :index="deepTree.name"
    @click="onNextPage(deepTree)"
  >
    <i v-if="deepTree.icon" :class="deepTree.icon"></i>
    <template #title>{{ deepTree.title }}</template>
  </el-menu-item>
  <!-- 展示存在子项的情况 -->
  <el-sub-menu 
    v-else-if="deepTree.shown && deepTree.children && deepTree.children.length "
    :index="deepTree.deepkey || deepTree.title"
  >
    <template #title>
        <i v-if="deepTree.icon" :class="deepTree.icon"></i>
        <span>{{ deepTree.title }}</span>
    </template>
    <SidebarMenu :deep-tree="deepTree.children"/>
  </el-sub-menu>
</template>
<script lang="ts" setup>
import { cloneDeep } from 'lodash'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { traverseTree } from '../../utils'

const props = defineProps(['menu', 'allMenus', 'deepTree'])
const router = useRouter()
const onNextPage = (item: any) => {
    const { name } = item
    if (router.hasRoute(name)) {
      router.push({ name })
    } else {
      router.push({ name: 'NoMatch', query: { route: name } })
    }
}
const authMenu = computed(() => {
    const cloneMenus = cloneDeep(props.allMenus)
    let shown = {} as any
    traverseTree(cloneMenus, (tree, deep, deepkey) => {
        tree.deepkey = deepkey
        if (tree.name && props.menu.includes(tree.name)) {
            tree.shown = true
            shown[deep] = true
        }
        if (shown[deep + 1]) {
            tree.shown = true
            shown[deep] = true
        }
        if (deep === 0) {
            shown = {}
        }
    })
    return cloneMenus
})
</script>

<script lang="ts">
export default { name: 'SidebarMenu' }
</script>

<style>

</style>
