import { defineStore } from "pinia";
import { ref } from "vue";

export default defineStore("keys", () => {
    const test = ref(
        {} as {
            [key: string]: {};
        }
    );

    async function setKey(_scope: string, _password: string) {}

    return { test, setKey };
});
