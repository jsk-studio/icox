
import { Module } from "vuex"

const coxGlobalModule =  <Module<any, any>> {
    namespaced: true,
    state: {
      userInfo: {},
      collapse: false,
    },
    mutations: {
        setUserInfo(state, info) {
            state.userInfo = info || {}
        },
        setCollapse(state) {
            state.collapse = !state.collapse
        },
    },
}

// export function