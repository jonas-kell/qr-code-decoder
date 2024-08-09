<script setup lang="ts">
    import QrcodeVue from "qrcode.vue";
    import { VTextField, VRow } from "vuetify/components";
    import { ref } from "vue";

    const value = ref("https://example.com");
    const size = ref(400);
</script>

<template>
    <div class="container">
        <v-text-field v-model="value"></v-text-field>
        <v-row justify="center">
            <qrcode-vue :value="value" :size="size" level="H" id="qr" />
        </v-row>
    </div>
</template>

<style>
    #qr {
        width: 80% !important;
        height: 80% !important;

        max-height: 85vh;
        max-width: 85vh;
    }
</style>
