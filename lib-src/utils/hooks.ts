import { computed, unref } from 'vue'
import { mapState, mapGetters, mapActions, mapMutations, useStore } from 'vuex';

export const COX_MODLE_APP = '[cox]app'

function useMapFn(keys: any, mapFn: any){
    //mapFn对应想使用的函数
    const storeStateFns = mapFn(...keys)
    const store = useStore()
    const storeState = {} as any
    const isMapData = [mapState, mapGetters].includes(mapFn)
    Object.keys(storeStateFns).forEach(fnnKey=>{
      const fn = storeStateFns[fnnKey].bind({ $store: store} )
      storeState[fnnKey] = isMapData ? computed(fn) : fn
    })
    return storeState
}

export function useState(...keys: any[]){
    return useMapFn(keys, mapState)
}

export function useActions(...keys: any[]){
    return useMapFn(keys, mapActions)
}

export function useGetters(...keys: any[]){
    return useMapFn(keys, mapGetters)
}

export function useMutations(...keys: any[]){
    return useMapFn(keys, mapMutations)
}

export function useSidebarTree(test?: any) {
    const { sidebar: sidebarRef } = useState(COX_MODLE_APP, ['sidebar'])
    const sidebar = unref(sidebarRef)
    if (!test) {
        return computed(() => sidebar.allMatch)
    } else {
        return computed(() => sidebar.match(test))
    }
}