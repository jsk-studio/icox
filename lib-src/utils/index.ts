import { x_array } from '../utils/x';
import { debounce, merge, mergeWith, set as _set, get as _get, unset as _unset } from 'lodash';
import { defineAsyncComponent, toRaw, unref } from 'vue';
export * from './parseToMapList'
export * from './parseToOriginTree'
export * from './createCombineList'
export * from './hooks'

export function matchArguments(tree: any, opts: any) {
    for (const arg of tree.arguments || []) {
        const match = !Object.keys(opts).some(k => opts[k] !== arg[k])
        if (match) {
            return typeof arg.value === 'function' 
                ? defineAsyncComponent(arg.value) 
                : toRaw(arg.value)
        }
    }
    return null
}

export function excludeArguments(tree: any, opts: any) {
    const args = {} as any
    for (const arg of tree.arguments || []) {
        const match = !Object.keys(opts).some(k => opts[k] !== arg[k])
        if (match) {
            continue
        }
        args[arg.key] = arg.value
    }
    return args
}
export const parseDeepkey = (data: any) => {
    if (!data) {
        return {}
    }
    const mdata = {} as any
    for (const key of Object.keys(data)) {
      _set(mdata, key.replaceAll('(dot)', '.'), _get(data, key))
    }
    return mdata
  }
  
  export function renameParams(params: any, names: any) {
    for (const key of Object.keys(names)) {
        const val = _get(params, key)
        if (val === null || val === undefined) {
            _unset(params, key)
            continue
        }
        _set(params, names[key], val)
        _unset(params, key)
    }
  }
  
export type ITraverseCallback = (tree: any, deep?: any, idx?: any) => void
export type ITraverseVisiter = ITraverseCallback | { [key in string]: ITraverseCallback }

export function traverseTree(tree: any, visiter: ITraverseVisiter, deep = 0, idx = '') {
    if (!tree) {
      return
    }
    if (typeof visiter !== 'function' && visiter.preorder) {
        visiter.preorder(tree, deep, idx)
    }
    if (tree.children) {
          traverseTree(tree.children, visiter, deep + 1, idx)
    }
    if (Array.isArray(tree)) {
        for (let i = 0; i < tree.length; i++) {
            const t = tree[i];
            traverseTree(t, visiter, deep, idx ? idx + '-' + i : String(i))
        }
    } else {
        if (typeof visiter === 'function') {
            visiter(tree, deep, idx)
        } else if (visiter[tree.type]) {
            visiter[tree.type](tree, deep, idx)
        } 
    }
}

export function traverseTreeRender(tree: any, visiter: any) {
    traverseTree(tree, {
        CustomRender(node: any) {
            if (visiter[node.name]) {
                visiter[node.name](node)
            }
        }
    })
}

export function deepMerge(...objs: any[]) {
    return mergeWith({}, ...objs, (objValue: any, srcValue: any) => {
        if (Array.isArray(objValue)) {
            return objValue.concat(srcValue);
        }
    })
}

export function debounceData(fn: any, wait = 10) {
    let cacheData = {}
    const execute = debounce(() => {
        if (Object.keys(cacheData).length === 0) {
            return
        }
        fn(cacheData)
        cacheData = {}
    }, wait)
    return (data: any) => {
        cacheData = merge(cacheData, data)
        execute()
    }
}

export function tryParse(json: any) {
    if (!json) {
        return json
    }
    if (typeof json === 'object') {
        const rs = {} as any
        for (const key of Object.keys(json)) {
            if (key.includes('[]')) {
                const arkey = key.replace('[]', '')
                rs[arkey] = x_array(json[key]).map(tryParse)
            } else {
                rs[key] = tryParse(json[key])
            }
        }
        return rs
    }
    
    try {
        if (typeof json === 'string') {
            return JSON.parse(decodeURIComponent(json))
        }
        return JSON.parse(json)
    } catch(e) {
        return json || null
    }
}

export function tryCall(exec: any, params: any, defaultValue?: any) {
    if (typeof exec === 'function') {
        const param = typeof params === 'function' ? params() : params
        return exec(unref(param)) ?? defaultValue
    }
    return exec ?? defaultValue
}

export const onBeforeSetdata = (mdata: any) => {
    const rdata = {} as any
    for (const key of Object.keys(mdata)) {
        if (key.startsWith('@')) {
            continue
        }
        if (!key.includes('&')) {
            rdata[key] = mdata[key]
            continue
        }
        const subnames = key.split('&')
        for (let i = 0; i < subnames.length; i++) {
            const subname = subnames[i];
            const subdata = Array.isArray(mdata[key]) ? mdata[key][i] : mdata[key]
            rdata[subname] = subdata
        }
    }
    return rdata
}
