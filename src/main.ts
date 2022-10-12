import {createApp} from 'vue';
import App from "./App.vue";
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css'
import locale from 'element-plus/lib/locale/lang/zh-cn'
import { createStore } from 'vuex';
import { createRouter, createWebHistory } from 'vue-router';
import { defineSidebarRouter, createCoxApp, registCoxApp } from '../lib-src';

const store = createStore({})
registCoxApp(store)

const sidebar = defineSidebarRouter({
    routes: [{
        name: 'Entry',
        path: '/',
        load: { component: () => import('./MPage.vue') },
    }, {
        name: 'Entry2',
        path: '/2',
        load: { component: () => import('./MPage.vue') },
        status: 'nosidebar'
    }],
    title: '',
    sidebar: [
      { title: '功能引导', icon: 'el-icon-magic-stick' },
      { title: '功能引导|列表页', route: 'Entry' },
      { title: '功能引导|详情页', route: 'Entry2' },
    ],
})

const router = createRouter({
    history: createWebHistory(),
    routes: sidebar.routes,
})

// 初始化
init();

async function init() {
    createCoxApp(App, { router, sidebar }).mount('#app')
}

