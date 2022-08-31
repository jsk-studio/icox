<template>
<el-drawer
    :title="`Editor: ${target.tree && target.tree.name}`"
    v-model="visible"
    direction="rtl"
    :close-on-press-escape="false"
    :show-close="false"
    size="40%"
    @close="onClose"
    custom-class="editor-drawer-wrapper"
  >
  <div class="form-wrapper">
    <el-form v-if="state.specialForm === 'RouterConfigure'" :model="state.form" style="flex: 1">
        <!-- <el-input v-if="arg.type === 'StringLiteral'" v-model="state.form[arg.key]" autocomplete="off"></el-input> -->
    </el-form>
    <el-form v-else :model="state.form" style="flex: 1">
        <el-form-item v-for="(arg, i) in state.renderForms" :key="i" :label="arg.key + ': '">
            <el-input v-if="arg.type === 'StringLiteral'" v-model="state.form[arg.key]" autocomplete="off"></el-input>
        </el-form-item>
    </el-form>
    <div class="demo-drawer__footer">
      <el-button @click="onClose">取 消</el-button>
      <el-button type="primary" @click="onSubmit" :loading="state.loading">{{ state.loading ? '提交中 ...' : '确 定' }}</el-button>
    </div>
  </div>
</el-drawer>
</template>
<script lang="ts" setup>
import { defineProps, reactive, watch, onMounted } from 'vue'
const props = defineProps(['visible', 'onClose', 'target', 'context'])
const state = reactive({
    form: {} as any,
    loading: false,
    renderForms: [] as any[],
    specialForm: '',
})

watch(() => props.target, () => {
    const args = props.target.tree.arguments
    state.specialForm = ''
    state.form = {} as any

    if (args.find((arg: any) => arg.type === 'RouterConfigure')) {
        state.specialForm = 'RouterConfigure'
        return
    }
    const SUPPORT_RENDER = ['StringLiteral']
    state.renderForms = args.filter((arg: any) => SUPPORT_RENDER.includes(arg.type))    
    for (const arg of state.renderForms) {
        state.form[arg.key] = arg.value
    }
})

const onSubmit = async () => {
    console.log(state.form)
    for (const arg of props.target.tree.arguments) {
        if (state.form[arg.key]) {
            arg.value = state.form[arg.key]
        }   
    }
    const body = JSON.stringify(props.context, (key, value) => {
        if (typeof value === 'function') {
            const matchRegexp = /\/\*\! (\w|\.|\/)+ \*\//g
            const m = String(value).match(matchRegexp)
            if (!m) {
                return value
            }
            const path = m[0].replace(/^\/\*\! | \*\/$/g, '')
            return `@fun[() => import('${path}')]@`
        }
        return value
    })
    await fetch('/dev/editor', {
        method: 'POST',
        body: body,
    })
    props.onClose?.()
}

</script>
<style lang="scss">
.editor-drawer-wrapper {
    padding: 20px 30px;
}
</style>
<style lang="scss" scoped>
.form-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
}
</style>