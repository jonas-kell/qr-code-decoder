import { createWebHashHistory, createRouter } from "vue-router";

import Index from "./components/Index.vue";

const routes = [{ path: "/", component: Index, name: "index" }];

export default createRouter({
    history: createWebHashHistory(),
    routes,
});
