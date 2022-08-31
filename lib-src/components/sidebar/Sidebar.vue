<template>
  <div class="sidebar" :class="{ small: collapse}">
    <div class="title" v-if="!collapse">{{ title }}</div>
    <el-menu
        :ref="ref => menuRef = ref"
        text-color="#606266"
        background-color="transparent"
        :router="false"
        :collapse-transition="false"
        :collapse="collapse"
        :default-active="route.name"
        active-text-color="#409eff"
        style="border:none"
        @open="onOpen"
      >
        <slot name="SidebarMenu"></slot>
    </el-menu>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, computed } from "vue-demi"
import { useRoute } from "vue-router"
import { useStore } from "vuex"
import { traverseTree } from '../../utils'

const props = defineProps(['title', 'allMenus'])
const store = useStore()
const route = useRoute()
const menuRef = ref()

const onOpen = (idx: any) => {
  let rootKey = ''
  const cache = {} as any
  traverseTree(props.allMenus, {preorder: (tree, deep, deepkey) => {
    if (idx && idx == deepkey && !idx.includes('-')) {
      rootKey = idx
    }
    if (rootKey && idx !== deepkey && deepkey.startsWith(rootKey)) {
      if (tree.children?.length && !cache[deepkey]) {
        cache[deepkey] = true
        setTimeout(() => {
          try {
            menuRef.value.open(deepkey)
          } catch(e) {
            // ingore
          }
        }, 240)
      }
    }
  }})
}

onMounted(() => {
  traverseTree(props.allMenus, (tree, deep, deepkey) => {
    if (tree.name === route.name) {
      onOpen(deepkey.split('-')[0])
    }
  })
})

const collapse = computed(() => store.state.collapse)

</script>

<style lang="scss" scoped>
.sidebar {
  transition: width 0.28s;
  width: 240px;
  height: 100%;
}
.small {
  width: 64px
}
.title {
  padding: 20px 0;
  font-size: 20px;
  text-align: center;
}
</style>
