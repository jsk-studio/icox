<template>
    <div v-if="state.inited">
        <template v-if="state.isOther">
          <slot name="Origin" :source="originData" :mode="{ origin: true }"></slot>
        </template>
        <el-row v-if="state.diviers.includes('origin')">
          <el-divider></el-divider>
        </el-row>
        <slot name="Form" :source="formData" :mode="{ edit: state.edit }" :onRef="ref => formRef = ref"></slot>
        <el-row v-if="state.diviers.includes('bottom')">
          <el-divider></el-divider>
        </el-row>
        <el-row type='flex' justify='center'>
          <el-button
            style='margin-right: 100px'
            type='primary'
            size='medium'
            @click='submitForm'
            :disabled="state.pending"
          >{{ confirmText }}
          </el-button>
          <el-button @click='goBack' size='medium'>取消</el-button>
        </el-row>
    </div>
</template>
<script lang="ts" setup>
import { computed, onMounted, reactive, useSlots, ref } from "vue";
import { useRouter } from "vue-router";
import { registFaasPageParams } from "../../sandbox/faas";
import { tryCall, parseDeepkey } from "../../utils";
import { get as _get, set as _set, has as _has, debounce } from 'lodash'
import { useStore } from "vuex";
const router = useRouter()
const props = defineProps(['diviers', 'source', 'origin', 'initorigin', 'onSubmit', 'onConfirm', 'onCancel' ])
const state = reactive({ 
  defaultData: null as any, 
  data: {} as any, 
  inited: false,
  edit: false,
  diviers: [] as any,
  isOther: false,
  originData: null,
  pending: false,
})

const store = useStore()
const faasParams = registFaasPageParams({
    form: {
        setFormData(data: any) {
          if ([store.getters.nowBizVal, null, undefined].includes(data.biz_from)) {
            state.data = data
          }
        },
        clearDefaultValue: (name: string, value: any = null) => {
            state.defaultData[name] = value
        },
        defaultValue: computed(() => state.defaultData),
    }
})
const formRef = ref()
const slots = useSlots()

const getParams = () => {
  if (!formRef.value?.curList) {
    return {
      ...faasParams,
      data: parseDeepkey(state.data),
    }
  }
  const mdata = {} as any
  for (const l of formRef.value.curList) {
    const computedName = l.name.split('/')[0].split('&')
    for (const baseName of computedName) {
         mdata[baseName] = state.data[baseName]
    }
  } 
  return {
    ...faasParams,
    data: parseDeepkey(mdata),
    form: parseDeepkey(state.data),
    raw: state.defaultData,
  }
}

onMounted(async() => {
  const originData = await tryCall(props.origin, faasParams)
  const sourceData = await tryCall(props.source, faasParams)
  state.isOther = !!originData
  state.diviers = state.isOther ? ['origin'] : []
  state.originData = originData
  if (originData && !sourceData) {
    // 存在源数据且不存在编辑数据, 则为 复制并应用 操作
    state.defaultData = originData
  } else if (sourceData) {
    // 存在编辑数据, 则为 编辑 操作
    state.defaultData = sourceData
    state.edit = true
  } else {
    // 创建操作
    state.defaultData = {}
  }
  state.inited = true
})

const confirmText = computed(() => {
    if (!state.edit) {
      return '提交'
    } else if (state.edit) {
      return '确认'
    } else if (state.edit) {
      return '确认添加'
    } else {
      return '确认修改'
    }
})

const submitForm =  debounce(async () => {
  try {
    state.pending = true
    if (formRef.value) {
      await formRef.value.validate()
    }
    await tryCall(props.onConfirm, getParams)
    await tryCall(props.onSubmit, getParams)
    state.pending = false
  } catch (e: any) {
    console.error(e.message)
    state.pending = false
    return
  }
}, 150)

const goBack = () => {
  router.go(-1)
}

const originData = computed(() => state.originData)
const formData = computed(() => {
  if (state.edit) {
    return state.defaultData
  }
  if (!props.initorigin || !state.isOther) {
    return {}
  }
  const form = {} as any
  for (const key of props.initorigin) {
    if (_has(state.originData, key)) {
      _set(form, key, _get(state.originData, key))
    }
  }
  return form
})

</script>
<style lang="scss" scoped>

</style>
