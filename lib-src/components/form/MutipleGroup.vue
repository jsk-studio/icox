<template>
<span v-if="computedList && computedList.length">
  <template v-for="(m, i) in mutiple">
    <FormItem 
      v-for="(l) in computedList(m)" 
      v-bind="l" 
      :key="`${l.name}`"
    />
    <br v-if="i < mutiple.length - 1" />
  </template>
</span>
</template>
<script lang="ts" setup>
import { useScopeState, useScopeModule } from '../../index'
import { computed, defineProps, unref, provide, onMounted, watch, inject } from 'vue'
import FormItem from '../../components/form/FormItem.vue'
import { tryCall } from '../../utils'

const sandbox = inject('form:sandbox') as any
const form = useScopeState('form')
const props = defineProps(['name', 'scope', 'inner', 'disabled'])
const depval = props.inner?.spreadFrom
const mutiple = computed(() => []
  .concat(unref(form).data[depval])
  .filter(Boolean) as any[]
)

const computedList = computed(() => {
  return (m: any) => {
    const list = props.scope.list
      ?.map((l: any) => ({ 
        ...l, 
        name: `${props.name}.${m}.${l.name}`, 
        rules: { 
          ...l.rules, 
          validator: validRequired,
          ruleName: `${props.name}.${m}.${l.name}`, 
        } 
      }))
      ?.filter((l: any) => { 
      const mname = l.name
      const valMap = unref(form).data?.[props.name] || {}
      const nameKey = m //mname?.split('/')[0].replace(`${props.name}.`, '').split('.')[0]
      const mparams = props.scope.getParams()
      return tryCall(l.visible, {
        name: mname,
         ...mparams,
         [depval]: nameKey,
         form: {
          ...mparams.form,
          ...valMap[nameKey],
          [depval]: nameKey,
         },
        }, true)
    })
    return list
  }
}) as any

const validRequired = (rule: any, value: any, callback: any) => {
  setTimeout(() => {
      value = unref(form).data[rule.ruleName]
      const selectedSources = unref(form).sources || {}
      const selected = selectedSources[rule.ruleName]?.[value] 
      if (Array.isArray(value) && !value.length) {
          callback(new Error(rule.message))
          return
      }
      const isEmptyVal = ['', null, undefined].includes(value)
      if (!selected && isEmptyVal && rule.message) {
          callback(new Error(rule.message))
      } else {
          callback()
      }
  }, 100);
}

const allRules = computed(() => {
  const formRules = {} as any
  for (const m of unref(mutiple)) {
    for (const l of props.scope.list) {
      if (!l.rules) {
        continue
      }
      const { name: ruleName, more, ...valid } = l.rules
      const computedName = l.name.split('/')[0]
      const name = `${props.name}.${m}.${l.name}`
      const trigger = l.source ? 'change' : 'blur'
      const rules = [{
          trigger, 
          ruleName: `${props.name}.${m}.${computedName}`,
          validator: validRequired,
          ...valid,
      }]
      if (Array.isArray(more)) {
          rules.push(...more)
      }
      formRules[name] = rules
    }
  }
  return formRules
})

provide('mutiple-group', {
  depkey: props.name,
  depval: depval,
  rules: allRules,
})

</script>