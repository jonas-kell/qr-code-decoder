f
<script setup lang="ts">
    import QrcodeVue from "qrcode.vue";
    import ImageDisplayApplication from "./ImageDisplayApplication.vue";
    import { VTextField, VRow } from "vuetify/components";
    import { nextTick, onMounted, ref, watch } from "vue";
    import { Image } from "../functions/image";
    import SliderGroup from "./SliderGroup.vue";
    import { cameraProjection } from "../functions/shaders";
    import { useRouter } from "vue-router";

    const router = useRouter();

    const value = ref("https://example.com");
    const size = ref(400);

    const projection = ref(true);
    const projectionTarget = ref<Image | null>(null);

    // the camera on my laptop (calibrated with https://calibdb.net/),
    // has a fx-value of approx 640.5 and a image width of 640
    // has a fy-value of approx 641.6 and a image height of 480
    // the fov is computed as
    //            FOV_horizontal [deg] = 2 * arctan(width /(2*fx)) * 180/pi = 53.1
    //            FOV_vertical   [deg] = 2 * arctan(height/(2*fy)) * 180/pi = 41.0
    // (for larger resolution, fx: 960 / 1280 -> 67.3)
    const fov = ref(35);
    const xOffset = ref(0);
    const yOffset = ref(0);
    const zOffset = ref(3.5);
    const xRotation = ref(0);
    const yRotation = ref(0);
    const zRotation = ref(0);

    watch([xOffset, yOffset, zOffset, xRotation, yRotation, zRotation, fov, projection], async () => {
        await doCameraProjection();
    });
    watch([value], () => {
        nextTick(async () => {
            await doCameraProjection();
        });
    });

    async function doCameraProjection() {
        const canvas = document.getElementById("qr") as HTMLCanvasElement;
        const url = canvas.toDataURL();

        const imageFromQrGenerator = await Image.generateImage(url);

        const projected = cameraProjection(
            imageFromQrGenerator,
            fov.value,
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

    const tabTransferKey = "analyzeTabImageTransferKey";
    function triggerAnalyzation() {
        if (projectionTarget.value) {
            sessionStorage.setItem(tabTransferKey, projectionTarget.value.generateDataURL());
            router.push("/");
        }
    }
</script>

<template>
    <div class="container">
        <v-text-field v-model="value"></v-text-field>
        <v-row v-if="projection">
            <slider-group label="FOV" :min="10" :max="170" v-model="fov" :scale-power="0" :only-end="false"></slider-group>
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
                :min="0"
                :max="1200"
                v-model="zOffset"
                :scale-power="-2"
                :only-end="false"
            ></slider-group>
            <slider-group
                label="rotation x"
                :min="-90"
                :max="90"
                v-model="xRotation"
                :scale-power="0"
                :only-end="false"
            ></slider-group>
            <slider-group
                label="rotation y"
                :min="-90"
                :max="90"
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
                display: projection ? 'none' : undefined,
            }"
        >
            <qrcode-vue :value="value" :size="size" level="H" id="qr" />
        </v-row>
        <image-display-application
            v-if="projection"
            :image-to-display="projectionTarget as Image | null"
            style="text-align: center; margin-top: 2cm; margin-left: 2em; margin-right: 2em"
        ></image-display-application>

        <v-row v-if="projection" justify="center" class="mt-6">
            <v-btn @click="triggerAnalyzation">-> Analyze</v-btn>
        </v-row>

        <div style="display: flex; flex-direction: column; align-items: center; text-align: center; margin-top: 2cm">
            <span><router-link to="/">Home</router-link></span>
            <v-checkbox label="Projection" :hide-details="true" v-model="projection"></v-checkbox>
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
