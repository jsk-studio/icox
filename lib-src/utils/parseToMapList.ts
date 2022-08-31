import { merge, flatten } from "lodash"

export type IMapList = {
    list: any[],
    mapping?: any,
    key?: string,
}

export function parseToMapList(opts: IMapList) {
    const maplist = {} as any
    const optKey = opts.key || 'name'
    if (opts.mapping) {
        for (const key of Object.keys(opts.mapping)) {
            const mitem = opts.mapping[key]
            const item = Array.isArray(mitem) ? {
                type: 'include',
                values: mitem,
            } : mitem

            if (!item?.values) {
                continue
            }
            const mapitem = [] as any[]
            for (const listitem of opts.list) {
                if (item.type === 'pick' && listitem.exts) {
                    const { exts: ex, ...sx } = listitem
                    const pickItem = ex.find((x: any) => item.values.includes(x.key))
                    mapitem.push(merge({}, sx, pickItem))
                    continue
                }
                const included = item.values.includes(listitem[optKey])
                if (item.type === 'include' && included 
                    || ['exclude', 'pick'].includes(item.type) && !included
                ) {
                    mapitem.push(listitem)
                } 
            }
            if (item.type === 'include') {
                const vals = item.values
                mapitem.sort((a, b) => vals.indexOf(a[optKey]) - vals.indexOf(b[optKey]))
            }
            maplist[key] = mapitem
        }
    }
    return {
        list: opts.list,
        mapping: opts.mapping,
        maplist,
    }
}

