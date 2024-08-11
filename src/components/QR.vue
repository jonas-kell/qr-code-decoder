<script setup lang="ts">
    import QrcodeVue from "qrcode.vue";
    import ImageDisplayApplication from "./ImageDisplayApplication.vue";
    import { VTextField, VRow } from "vuetify/components";
    import { onMounted, ref, watch } from "vue";
    import { Image } from "../functions/image";
    import SliderGroup from "./SliderGroup.vue";
    import { cameraProjection } from "../functions/shaders";

    const value = ref("https://example.com");
    const size = ref(400);

    const project = ref(true);
    const projectionTarget = ref<Image | null>(null);

    const focusLength = ref(2);
    const xOffset = ref(0);
    const yOffset = ref(0);
    const zOffset = ref(0);
    const xRotation = ref(0);
    const yRotation = ref(0);
    const zRotation = ref(0);

    watch([xOffset, yOffset, zOffset, xRotation, yRotation, zRotation, focusLength, project], async () => {
        setTimeout(async () => {
            await doCameraProjection();
        }, 100);
    });
    watch([value, xOffset, project], async () => {
        await doCameraProjection();
    });

    async function doCameraProjection() {
        const canvas = document.getElementById("qr") as HTMLCanvasElement;
        const url = canvas.toDataURL();

        const imageFromQrGenerator = await Image.generateImage(url);

        const projected = cameraProjection(
            imageFromQrGenerator,
            focusLength.value,
            xOffset.value,
            yOffset.value,
            zOffset.value,
            xRotation.value,
            yRotation.value,
            zRotation.value
        );

        projectionTarget.value = projected;
    }

    onMounted(() => {
        doCameraProjection();
    });
</script>

<template>
    <div class="container">
        <v-text-field v-model="value"></v-text-field>
        <v-row v-if="project">
            <slider-group
                label="focus"
                :min="10"
                :max="100"
                v-model="focusLength"
                :scale-power="-1"
                :only-end="false"
            ></slider-group>
            <slider-group
                label="offset x"
                :min="-200"
                :max="200"
                v-model="xOffset"
                :scale-power="-2"
                :only-end="false"
            ></slider-group>
            <slider-group
                label="offset y"
                :min="-200"
                :max="200"
                v-model="yOffset"
                :scale-power="-2"
                :only-end="false"
            ></slider-group>
            <slider-group
                label="offset z"
                :min="-100"
                :max="100"
                v-model="zOffset"
                :scale-power="-2"
                :only-end="false"
            ></slider-group>
            <slider-group
                label="rotation x"
                :min="-180"
                :max="180"
                v-model="xRotation"
                :scale-power="0"
                :only-end="false"
            ></slider-group>
            <slider-group
                label="rotation y"
                :min="-180"
                :max="180"
                v-model="yRotation"
                :scale-power="0"
                :only-end="false"
            ></slider-group>
            <slider-group
                label="rotation z"
                :min="-180"
                :max="180"
                v-model="zRotation"
                :scale-power="0"
                :only-end="false"
            ></slider-group>
        </v-row>
        <v-row
            justify="center"
            class="mt-6"
            :style="{
                display: project ? 'none' : undefined,
            }"
        >
            <qrcode-vue :value="value" :size="size" level="H" id="qr" />
        </v-row>
        <image-display-application
            v-if="project"
            :image-to-display="projectionTarget as Image | null"
            style="text-align: center; margin-top: 2cm; margin-left: 2em; margin-right: 2em"
        ></image-display-application>

        <div style="display: flex; flex-direction: column; align-items: center; text-align: center; margin-top: 2cm">
            <span><router-link to="/">Home</router-link></span>
            <v-checkbox label="Projection" :hide-details="true" v-model="project"></v-checkbox>
        </div>
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
