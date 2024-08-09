import { createWebHashHistory, createRouter } from "vue-router";

import Index from "./components/Index.vue";
import QR from "./components/QR.vue";

const routes = [
    { path: "/", component: Index, name: "index" },
    { path: "/generate", component: QR, name: "generate" },
];

export default createRouter({
    history: createWebHashHistory(),
    routes,
});
