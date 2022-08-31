import { chain, cloneDeep, concat, map } from "lodash"
import { deepMerge, parseToMapList } from "."
import { x_instance } from './x'
import { mergeWith } from "lodash"

const listCacheMap = {} as any
// @ts-ignore
window.listCacheMap = listCacheMap

export function createCombineList(opts: any, aspect?: any) {
    const { pool = {} as any } = opts
    return (name: string, filters: any, ctx: any) => {
        // WORKAROUND: 性能优化, 目前存在一些小问题, 但目前看不影响预期
        // 问题描述: 当页面未完全加载时, table 列展示不正确
        // 使用 filters 做 key 避免重复计算继承关系
        const cacheKey = JSON.stringify({ ...filters, name })
        const cacheMap = x_instance(listCacheMap, (key: any) => {
            const cacheFilter = JSON.parse(key)
            const mapperPools: any[] = pool.mapper?.(cacheFilter) || []
            const picks = mapperPools.reduce((pre, cur) => pre.concat(cur), [])
            const fullPool = combinePools(...[].concat(pool.flavors, picks))
            return dealwith(fullPool).exclude(fullPool.exclude)
        })
        const combined = listCacheMap[cacheKey] || cacheMap[cacheKey]
        ctx.mapped = cloneDeep(opts)

        const getExcludeMap = (vals: any[], mName: string) => {
            const exMap: any = {}
            const all: any[] = []
            for (const val of vals) {
                const [prefix, colname] = val.split(':')
                if (!colname) {
                    all.push(prefix)
                    continue
                }
                exMap[prefix] = colname
            }
            const exs = exMap[mName]
            return [exs, all]
        }
        ctx.not = (vals: any[], mName = name) => {
            const [exs] = getExcludeMap(vals, mName)
            if (!exs) {
                return
            }
            return combined[mName]
                ?.filter((n: any) => !exs.includes(n.name))
                ?.map((n: any) => n.name)
        }

        ctx.ext = (vals: any[], mName = name) => {
            const [exs, alls] = getExcludeMap(vals, mName)
            const mExcludes = alls.concat(exs).filter(Boolean)
            if (!combined[mName]) {
                return
            }
            for (const item of combined[mName]) {
                if (!item.exts) {
                    continue
                }
                for (const ext of item.exts) {
                    if (!mExcludes.includes(ext.name)){
                        continue
                    }
                    const idx = ctx.mapped[mName].indexOf(item.name)
                    if (idx === -1) {
                        continue
                    }
                    ctx.mapped[mName][idx] = ext.name
                }
            }
        }
        
        ctx.utils = {
            getExcludes: (subctx: any, subName: any) => {
                ctx.mapped[subName] = cloneDeep(opts[subName])
                const calcExclude = opts?.exclude?.(subctx)
                    .reduce((pre: any, cur: any) => pre.concat(cur), [])
                    .filter(Boolean) || []
                const [subExcludes, allExcludes] = getExcludeMap(calcExclude, subName)
                const mExcludes = allExcludes.concat(subExcludes).filter(Boolean)
                return mExcludes
            }
        }

        const mExcludes = ctx.utils.getExcludes(ctx, name)
        const combinedList = combined[name]?.filter((n: any) => {
            return !combined.exclude?.includes(n.name) && !mExcludes.includes(n.name)
        })

        if (!combinedList) {
            return []
        }
        aspect?.(name, combined, ctx)
        return parseSortedArray({
            list: combinedList,
            mapping: ctx.mapped[name] || [],
        })
    }
}

export function parseFlattenArray(list: any[], picks: (string[] | string)[]) {
    return parseSortedArray({
        list: list,
        mapping: picks|| [],
    })
}

export function parseSortedArray(opts: any) {
    const { list, mapping } = opts
    const maplist = [] as any
    for (const l of list) {
        for (let i = 0; i < mapping.length; i++) {
            const key = mapping[i];
            if (Array.isArray(key)) {
                maplist[i] = parseSortedArray({
                    list,
                    mapping: key
                })
                continue
            }
            if (key === l.name) {
                maplist[i] = cloneDeep(l)
            }
        }
    }
    return maplist.filter(Boolean)
}


export function flattenPool(spool: any): any {
    const pool = cloneDeep(spool)
    if (pool.base) {
        const poolBase = pool.base
        delete pool.base
        return deepMerge(pool, flattenPool(poolBase))
    }
    return pool
}

export function dealwith(pool: any) {
    const exclude = (names: string[]) => {
        const fpool = flattenPool(pool)
        if (!Array.isArray(names)) {
            return fpool
        }
        for (const key of Object.keys(fpool)) {
            const vals = fpool[key]
            for (let i = 0; i < vals.length; i++) {
                if (names.includes(vals[i].name)) {
                    vals[i] = null
                }
            }
            fpool[key] = vals.filter(Boolean)
        }
        return fpool
    }
    const get = (name: string, props?: any) => {
        if (props?.name) {
            console.error('name 字段不可使用 dealwith 复制', props.name)
            return
        }
        const keys = name.split('\.')
        if (keys.length !== 2) {
            return
        }
        const fpool = flattenPool(pool)
        const pre = fpool[keys[0]]?.find((l: any) => l.name === keys[1])
        return mergeWith({}, pre, props, (objValue: any, srcValue: any) => {
            if (Array.isArray(objValue)) {
                return srcValue;
            }
        })
    }
    const merge = (parentName: string, arr: any[]) => {
        return arr.map(({ name , ...p }) => ({
            ...p,
            ...get(`${parentName}.${name}`, p), 
            name,
        }))
    } 
    const include = (names: string[]) => {
        const fpool = flattenPool(pool)
        if (!Array.isArray(names)) {
            return fpool
        }
        for (const key of Object.keys(fpool)) {
            const vals = fpool[key]
            fpool[key] = [] as any[]
            for (let i = 0; i < vals.length; i++) {
                if (names.includes(vals[i].name)) {
                    fpool[key].push(vals[i])
                }
            }
        }
        return fpool
    }
    return { exclude, include, get, merge }
}

export function combinePools(...pools: any[]) {
    const allPool = mergeWith({}, ...pools.map(pool => {
        if (pool) {
            return flattenPool(pool)
        }
    }), (objValue: any, srcValue: any) => {
        if (Array.isArray(objValue)) {
            const res: any[] = []
            const cache: any = {}
            const extendsObj: any = {}
            for (const obj of srcValue.concat(objValue)) {
                if (obj?.type === 'extends') {
                    delete obj.type
                    // TODO: 多层继承下是否需要调整继承顺序
                    extendsObj[obj.name] = deepMerge({ ...obj }, extendsObj[obj.name])
                } else if (typeof obj === 'string') {
                    if (!cache[obj]) {
                        cache[obj] = true
                        res.push(obj)
                    }
                } else if (!cache[obj.name]) {
                    cache[obj.name] = true
                    const mergeObj = deepMerge(obj, extendsObj[obj.name])
                    res.push(mergeObj)
                }
            }
            return res;
        }
    })
    for (const key of Object.keys(allPool)) {
        const list = allPool[key]
        if (!Array.isArray(list)) {
            continue
        }
        for (const item of list) {
            if (!item.exts) {
                continue
            }
            const { exts, ...extBase } = item
            const extExcludes: any[] = [item.name]
            for (const ext of item.exts) {
                const newExt = Object.assign({}, extBase, ext)
                newExt.extExcludes = extExcludes,
                newExt.extParent = extBase.name
                list.push(newExt)
            }
        }
    }
    return cloneDeep(allPool)
}
