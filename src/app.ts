import { createApp } from "vue";
import "./styles/styles.css";
import App from "./App.vue";
import router from "./router.ts";
import { createPinia } from "pinia";
const pinia = createPinia();

// Vuetify
import { createVuetify } from "vuetify";

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";

const vuetify = createVuetify({
    components,
    directives,
});

createApp(App).use(router).use(pinia).use(vuetify).mount("#app");
