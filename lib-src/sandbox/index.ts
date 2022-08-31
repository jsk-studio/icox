import { useStore, Store } from 'vuex'
import { computed, onUnmounted, ref, provide, inject, unref, watch, reactive, onMounted } from 'vue'
import { cloneDeep, merge, mergeWith } from 'lodash'
import { deepMerge, tryCall, tryParse } from '../utils'
export * from './faas'
export * from './dialog'

// 获得 scope state, 相关功能比较完整
export function useScopeState(moduleName: string, scopeID?: number) {
    const scopeModuleName = `[scope]${moduleName}`
    const store = useStore()
    if (!store.hasModule(scopeModuleName)) {
        const msg = 'Do not register the module: ' + scopeModuleName
        console.warn(msg)
        return msg
    }
    const moduleScopeId = inject(`${scopeModuleName}:scopeID`, 0)
    const state = computed(() => {
        const id = scopeID || moduleScopeId
        return store.state[scopeModuleName].scopeState[id]
    })
    return state
}

export function useMutipleModel(name: string, opts: any) {
    const form = useScopeState('form') as any
    const names = name.split('&')
    const defaultValues = computed(() => {
        const vals = names.map((n: any) => unref(form).data[n] ?? undefined)
        return vals.length === 1 ? vals[0] : vals   
    })
    const state = reactive({ model: unref(defaultValues) || [] as any, inited: false })
    watch(defaultValues, values => {
        const preArr = [].concat(values).filter(v => ![null, undefined].includes(v))
        const curArr = [].concat(state.model).filter((v => ![null, undefined].includes(v)))
        const isUpdated = preArr.length !== 0 && curArr.length === 0 
            && JSON.stringify(preArr) !== JSON.stringify(curArr)
        if (!state.inited && isUpdated) {
            state.model = cloneDeep(values)
            state.inited = true
        }
    })
    watch(() => state.model, values => {
        const vals = [].concat(values)
            .map(v => opts.format?.(v) ?? v)
        
        names.forEach((name, idx) => {
            unref(form).data[name] = vals[idx]
        })
        if (vals.length === names.length) {
            opts.onChange(vals)
        } else {
            opts.onChange(names.map(() => null))
        }
    }, { deep: true })
    return [computed(() => state.model)]
}

export function useDynamicListModel(name: string, obj: any = {}) {
    const form = useScopeState('form') as any
    const model = computed(() => unref(form).data[name])
    watch(model, (val: any) => {
        if (Array.isArray(val) && val.length === 0) {
            unref(model).push({ ...obj })
        }
    })
    onMounted(() => {
        const val = unref(model)
        if (Array.isArray(val) && val.length === 0) {
            unref(model).push({ ...obj })
        }
    })
    return [model, obj]
}

// TODO: 获得 scope context, 相关功能待补全
export function useScopeContext(moduleName: string, scopeID?: number) {
    const scopeModuleName = `[scope]${moduleName}`
    if (!scopeID) {
        return inject(`${scopeModuleName}:context`, {
            scopeID: 0,
            props: {} as any,
            mergeState: (s: any) => {s?.({})},
            dispatch: () => {},
        })
    }
    const store = useStore()
    const mergeState = async (data?: any | ((s: any) => any)) => {
        await store.dispatch(`${scopeModuleName}/mergeState`, { 
            state: unref(data),
            scopeID: Number(scopeID), 
        })
    }
    // TODO: 待补全 props, dispatch 相关
    return { props: {} as any, mergeState, dispatch: () => {} }
    
}

// TODO: dialog 相关封装, 暂不确定功能是否完整
export function useDialogModule(tree: any = { type: 'Dialog' }) {
    const dialog = useScopeModule('dialog')
    return {
        show: async (...t: any[]) => {
            dialog.mergeState({
                visible: true,
                tree: deepMerge({
                    stableKey: true,
                }, tree, ...t)
            })
        },
        hide: () => {
            dialog.mergeState({
                visible: false
            })
        }
    }
}

export function useFormModelLegacy({ valueFrom, defaultRule, defaultValue }: any) {
    const form = useScopeState('form')
    const defaultValues = computed(() => valueFrom(unref(form)))
    const state = reactive({ model: defaultValue || [] as any, inited: false })
    watch(defaultValues, values => {
        if (!state.inited && defaultRule(values, state.model)) {
            state.model = cloneDeep(values)
            state.inited = true
        }
    })
    return state
}

// 功能较完整, 暂不确定需不需要提供注入 props 的方法, 目前看 provide 可以满足需求
export function useScopeModule(moduleName: string, moduleTree?: any) {
    const scopeModuleName = `[scope]${moduleName}`
    const store = useStore()
    registerScopedModule(store, scopeModuleName, moduleTree)
    const scopeID = ref(0)
    store.dispatch(`${scopeModuleName}/register`)
    scopeID.value = store.state[scopeModuleName].scopeID

    const state = computed(() => store.state[scopeModuleName].scopeState[scopeID.value])
    onUnmounted(() => {
        store.dispatch(`${scopeModuleName}/unregister`, { scopeID: scopeID.value })
    })
    // 父元素采用 provide('module:props') 的方式注入
    const props = inject(`${scopeModuleName}:props`, {}) as any
    const context = {
        props,
        scopeID: unref(scopeID),
        mergeState: async (data?: any | ((s: any) => any)) => {
            if (typeof data === 'function') {
                data = await data(unref(state))
            }
            await store.dispatch(`${scopeModuleName}/mergeState`, { 
                state: unref(data), 
                scopeID: unref(scopeID), 
            })
        },
        setState: async (data?: any | ((s: any) => any)) => {
            data = await tryCall(data, state)
            await store.dispatch(`${scopeModuleName}/setState`, { 
                state: unref(data), 
                scopeID: unref(scopeID), 
            })
        },
        dispatch: async (action: string, payload?: any) => {
            await store.dispatch(`${scopeModuleName}/${action}`, { 
                payload, 
                scopeID: scopeID.value, 
            })
        }
    }
    provide(`${scopeModuleName}:scopeID`, scopeID.value)
    provide(`${scopeModuleName}:context`, context)
    return context
}

// TODO: 注册 module, module tree 相关属性注入功能暂未验证
function registerScopedModule<T>(store: Store<any>, scopeModuleName: string, moduleTree: any = {}) {
    if (store.hasModule(scopeModuleName)) {
        return
    }
    store.registerModule(scopeModuleName, {
        namespaced: true,
        state: {
            scopeProps: {},
            scopeState: {},
            scopeID: 0,
            scopes: [],
            ...moduleTree.state,
        },
        mutations: {
            setProps(state: any, payload: any) {
                const { scopeID, props } = payload
                state.scopeProps[scopeID] = props
            },
            mergeState(state: any, payload: any) {
                const { scopeID, state: scopeState } = payload
                const before = state.scopeState[scopeID]
                // megreState 的场景下, 数组不合直接替换
                state.scopeState[scopeID] = mergeWith(
                    before, scopeState, 
                    (o, s) => Array.isArray(s) ? s : undefined)
            },
            setState(state: any, payload: any) {
                const { scopeID, state: scopeState } = payload
                state.scopeState[scopeID] = scopeState
            },
            register(state: any) {
                state.scopeID++
                state.scopeProps[state.scopeID] = {}
                state.scopeState[state.scopeID] = {}
                state.scopes.push(state.scopeID)
            },
            unregister(state: any, payload: any) {
                const { scopeID } = payload
                const idx = state.scopes.indexOf(scopeID)
                if (idx !== -1) {
                    state.scopeState[state.scopeID] = { legacy: true }
                    state.scopeProps[state.scopeID] = { legacy: true }
                    state.scopes.splice(idx, 1)
                }
            },
            ...moduleTree.mutations,
        },
        actions: {
            setProps(ctx: any, payload: any) {
                const { scopeID, props } = payload
                ctx.commit('setProps', { scopeID, props })
            },
            setState(ctx: any, payload: any) {
                const { scopeID, state } = payload
                ctx.commit('setState', { scopeID, state })
            },
            mergeState(ctx: any, payload: any) {
                const { scopeID, state } = payload
                ctx.commit('mergeState', { scopeID, state })
            },
            register(ctx: any) {
                ctx.commit('register')
            },
            unregister(ctx: any, payload: any) {
                const { scopeID } = payload
                ctx.commit('unregister', { scopeID })
            },
            ...moduleTree.actions,
        }
    })
}
