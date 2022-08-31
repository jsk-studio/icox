<template>
    <el-dialog
      v-model="dialog.visible"
      v-bind="attrs"
      @close="onDialogClose"
    >
        <template v-if="state.inited">
          <slot name="Top"></slot>
        </template>
        <p v-if="text" v-html="text" style="margin-bottom: 15px"></p>
        <template v-for="(txt) in textArray">
          <p v-html="txt" style="margin-bottom: 5px"></p>
        </template>
        <template v-if="state.inited">
          <slot name="Custom"></slot>
        </template>
        <template #footer class="dialog-footer" v-if="true">
          <el-button @click="onClose('cancel')" name='@dialog_cancel'>取 消</el-button>
          <el-button type="primary" @click="onClose('submit')" name='@dialog_submit'>确 定</el-button>
        </template>
    </el-dialog>
</template>
<script lang="ts" setup>
import { computed, defineProps, onMounted, onUnmounted, provide, reactive, ref, unref, useSlots, watch } from 'vue'
import { useFaasParams, useScopeContext, useScopeState } from '../../sandbox'
import { tryCall, parseDeepkey } from '../../utils'
const props = defineProps([
  'scopeID', // dialog scope id
  'onAction',  // dialog action: confirm, submit, cancel
  'attrs', // dialog attrs
  'text', 
  'textArray', 
  'source', // dialog source, faas params
])

type IDialog = {
  visible: boolean
}
const dialog = useScopeState('dialog', props.scopeID) as any as IDialog
const ctx = useScopeContext('dialog', props.scopeID)

const state = reactive({ 
  defaultData: null as any, 
  data: {} as any, 
  dialogHidden: false,
  inited: false,
})
const faasParams = useFaasParams()
const customRef = ref()

const onDialogClose = async () => {
  await props.onAction('cancel')
}
const onClose = async (type: 'cancel' | 'submit') => {
  try {
    if (type === 'submit') {
      if (customRef.value) {
        await customRef.value.validate()
      }
      await props.onAction('confirm', parseDeepkey(state.data))
      await props.onAction('submit', parseDeepkey(state.data))
    } else if (type === 'cancel') {
      await props.onAction('cancel')
    }
    ctx.mergeState({ visible: false })
  } catch (e: any) {
    console.error(e.message || e)
    return
  }
}

onMounted(async() => {
  state.defaultData = await tryCall(props.source, faasParams, {})
  state.inited = true
})

provide('[scope]form:props', {
    setFormData(data: any) {
      state.data = data
    },
    clearDefaultValue: (name: string, value: any = null) => {
        state.defaultData[name] = value
    },
    defaultValue: computed(() => state.defaultData),
    onRef: (r: any) => {  customRef.value = r },
    mode: computed(() => ({ edit: !!props.source })),
    formType: 'dialog'
})

</script>
<style lang="scss" scoped>

</style>