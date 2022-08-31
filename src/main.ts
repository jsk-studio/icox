import {createApp} from 'vue';
import App from "./App.vue";
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css'
import locale from 'element-plus/lib/locale/lang/zh-cn'
import { createStore } from 'vuex';
import { createRouter, createWebHistory } from 'vue-router';

const store = createStore({})
const router = createRouter({
    history: createWebHistory(),
    routes: [],
})

// 初始化
init();

async function init() {
    createApp(App)
    .use(store)
    .use(router)
        .use(ElementPlus, {locale})
        .mount('#app');
}

