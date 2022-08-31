import { useStore, Store } from 'vuex'
import { computed, onUnmounted, ref, provide, inject, unref, watch, reactive, onMounted, customRef, getCurrentInstance } from 'vue'
import { RouteLocation, RouteLocationRaw, RouterLinkProps, useRoute, useRouter } from 'vue-router'
import { deepMerge, tryParse } from '../utils'
import qs from 'qs'
import { useScopeState } from '.'
import { cloneDeep, debounce } from 'lodash'
import { xTypeOf } from '../utils/x'
export * from './faas-types'

export function registFaasFormParams(callback: (data: any) => void) {
    return registFaasPageParams({ form: { setFormData: callback } })
}

export function registFaasPageParams(provides: any = {}) {
    const faasParams = registFaasParams()
    const store = useStore()
    const route = useRoute()
    const router = useRouter()
    const defaultQuery = tryParse(route.query) || {}
    const currentPager = {
        ps: defaultQuery.ps ?? 10,
        pn: defaultQuery.pn ?? 1,
    } as any

    const state = reactive({
        filterSources: {} as any,
        query: { 
            ...defaultQuery, 
            ...currentPager,
            t: Date.now(),
        },
        selected: [],
        currentPager,
        firstQuery: null as any,
    })
    
    const onTableChange = (val: any) => {
        state.selected = val
    }
    const onPagerChange = (val: any) => {
        state.currentPager = val
    }
    const onQueryChange = (val: any) => {
        state.query = { ...state.query, ...val }
        const encodeQuery = {} as any
        for (const key of Object.keys(state.query)) {
            encodeQuery[key] = state.query[key]
        }
        if (!state.firstQuery) {
            state.firstQuery = { ...state.query }
        }
        router.replace(`${route.path}?${qs.stringify(encodeQuery, { 
            encode: true,
            arrayFormat: 'brackets',
        })}`)
    }
    onMounted(() => {
        const encodeQuery = {} as any
        for (const key of Object.keys(state.query)) {
            if (['ps', 'pn'].includes(key)) {
                continue
            }
            encodeQuery[key] = state.query[key]
        }
        router.replace(`${route.path}?${qs.stringify(encodeQuery, { 
            encode: true,
            arrayFormat: 'brackets',
         })}`)
    })    
    const onFilterChange = (val: any) => {
        for (const key of Object.keys(val)) {
            if ((val[key] || '') !== state.query[key]) {
                val.pn = 1
                break
            }
        }
        onQueryChange(val)
    }
    
    const onLoadedSource = (name: any, val: any[]) => {
        const mapping = {} as any
        for (const v of val) {
            mapping[v.val] = v.label
        }
        state.filterSources[name] = mapping
    }

    const onResetDefault = () => {
        if (!state.firstQuery) {
            return
        }
        onFilterChange({ ...state.firstQuery })
    }
    
    provide('[scope]form:props', {
        onResetDefault,
        onSubmit: onFilterChange,
        onLoadedSource: onLoadedSource,
        clearDefaultValue: (name: string, value: any = null) => {
            state.query[name] = value
        },
        clearFilterDefaultValue: (name: string, value: any = null) => {
            state.query[name] = value
        },
        mapping: computed(() => state.filterSources),
        defaultValue: computed(() => state.query),
        ...provides.form,
    })
    
    provide('[scope]table:props', {
        onChange: onTableChange,
        onSubmit: onFilterChange,
        onPager: onPagerChange,
        params: computed(() => state.query),
        mapping: computed(() => state.filterSources),
    })

    provide('[scope]pager:props', {
        onSubmit: onQueryChange,
        pager: computed(() => state.currentPager)
    })
    
    const exposeValues = computed(() => {
        return JSON.stringify({
            filter: state.query,
            selected: state.selected,
            filterSources: state.filterSources,
        })
    })
    
    watch(exposeValues, () => {
        store.commit('[scope]faas/expose', {
            selected: state.selected,
            filter: state.query,
            filterSources: state.filterSources,
        })
    })
    registFaasContext({
        selected: state.selected,
        filter: state.query,
        filterSources: state.filterSources,
        pool: provides.pool,
        fetchData: () => {
            state.query = { ...state.query }
        },
    })
    return faasParams
}

export function registFaasParams() {
    const store = useStore()
    const route = useRoute()
    const router = useRouter()
    const moduleName = '[scope]faas'
    const getLastScope = (name: string, offset: number = 0) => {
        const value = store.state[`[scope]${name}`]
        const idx = value.scopes.slice(-1 + offset, offset === 0 ? undefined : offset)[0]
        return value.scopeState[idx] || {}
    }
    onUnmounted(() => {
        store.commit(`${moduleName}/expose`, {
            filter: {} as any,
            selected: [] as any,
            form: {} as any,
            fetchData: (() => { console.log('faas fetchData is cleared') }) as any,
        })
    })
    if (!store.hasModule(moduleName)) {
        const washProxy = new Proxy({} as any, {
            get(target, prop) {
                return target[prop]
            }
        })
        store.registerModule(moduleName, {
            namespaced: true,
            state: {
                filter: {} as any,
                filterSources: {} as any,
                selected: [] as any,
                form: {} as any,
                wash: washProxy as any,
                fetchData: (() => { console.log('faas fetchData is not initiated')  }) as any,
            },
            mutations: {
                expose(state: any, payload: any) {
                    for (const key of Object.keys(payload)) {
                        state[key] = payload[key]
                    }
                },
            }
        })
        const module = store.state[moduleName]
        
        const unRefs = () => {
            return module
        }
        return Object.assign(module, {
            store,
            getters: store.getters,
            route,
            query: new Proxy(route, {
                get: (t: any, p: any) => t.query[p]
            }),
            router,
            last: getLastScope,
            unRefs,
        })
    }
    const faasParams = useFaasParams()
    return faasParams
}


export function useFaasParams() {
    const store = useStore()
    const moduleName = '[scope]faas'
    if (!store.hasModule(moduleName)) {
        console.error('fass module is not register')
    }
    return store.state[moduleName]
}

export function registFaasContext(vals: any) {
    const store = useStore()
    const moduleName = '[scope]faas'
    onMounted(() => {
        store.commit(`${moduleName}/expose`, vals)
    })
}

// legacy
export function useFormModel<T = any>(name: string) {
    const form = useScopeState('form')
    const state = reactive({ 
        model: null as any,
        complexObj: {} as any,
        complexArr: [] as any[],
        complex: false,
    })
    const modelRef = customRef<T>((track, tigger) => {
        return {
            get: () => {
                track()
                if (Array.isArray(state.model)) {
                    return state.complexArr
                }
                if (xTypeOf(state.model, 'object')) {
                    return state.complexObj
                }
                return state.model
            },
            set: (newVal) => {
                state.model = newVal
                tigger()
            }
        }
    })
    
    let lock = false
    const debounceState = debounce((val: any) => {
        if (!unref(form).data) {
            return
        }
        if (JSON.stringify(unref(form).data[name]) === JSON.stringify(val)) {
            return
        }
        unref(form).data[name] = val
        lock = false
    }, 200)

    const debounceForm = (val: any) => {
        if (lock) {
            return
        }
        state.model = val
    }
    onMounted(() => {
        state.model = unref(form).data?.[name] ?? null
    })
    watch(() => unref(form).data?.[name], debounceForm)
    watch(() => state.model, debounceState)
    watch(() => state.complexArr, debounceState, { deep: true })
    watch(() => state.complexObj, debounceState, { deep: true })
    watch(() => state.model, (val) => {
        lock = true
        if (Array.isArray(val)) {
            state.complexArr = cloneDeep(val)
        }
        if (typeof val === 'object') {
            state.complexObj = cloneDeep(val)
        }
    })
    return modelRef
}