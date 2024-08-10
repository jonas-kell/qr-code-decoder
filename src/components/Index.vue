<script setup lang="ts">
    import PhotoApplication from "./PhotoApplication.vue";
    import ImageDisplayApplication from "./ImageDisplayApplication.vue";
    import { Image } from "../functions/image";
    import { ref } from "vue";
    import useDecodingStore from "./../stores/decoding";
    import SliderGroup from "./SliderGroup.vue";

    const testTrigger = ref(false);
    const decodingStore = useDecodingStore();

    async function handleTakenFrame(frame: Image) {
        testTrigger.value = false;

        decodingStore.start(frame);
    }
</script>

<template>
    <div class="container">
        <h1
            @click="
                () => {
                    // extract a photo frame externally
                    testTrigger = true;
                    console.log('Externally triggered taking photo');
                }
            "
        >
            QR Code Decoder
        </h1>

        <div style="text-align: center">
            <router-link to="generate">Generate</router-link> a Code (e.g. on Smartphone for scanning)
        </div>

        <photo-application :take-photo="testTrigger" @frame-taken="handleTakenFrame"></photo-application>

        <h3>Grayscaled</h3>
        <image-display-application :image-to-display="decodingStore.grayscaleImage as Image | null"></image-display-application>
        <h3>Resized</h3>
        <slider-group
            v-model="decodingStore.resizedImageSize"
            :min="decodingStore.resizedImageSizeMin"
            :max="decodingStore.resizedImageSizeMax"
            label="ReSize Target Size"
            :only-end="true"
        ></slider-group>
        <image-display-application :image-to-display="decodingStore.resizedImage as Image | null"></image-display-application>
        <h3>Blurred</h3>
        <slider-group
            v-model="decodingStore.blurRadius"
            :min="decodingStore.blurRadiusMin"
            :max="decodingStore.blurRadiusMax"
            label="Blur Radius"
            :only-end="true"
        ></slider-group>
        <image-display-application :image-to-display="decodingStore.blurredImage as Image | null"></image-display-application>
        <h3>Binarized</h3>
        <slider-group
            v-model="decodingStore.binarizationNumCells"
            :min="decodingStore.binarizationNumCellsMin"
            :max="decodingStore.binarizationNumCellsMax"
            label="Binarization Number Cells"
            :only-end="true"
        ></slider-group>
        <slider-group
            v-model="decodingStore.binarizationCNumber"
            :min="decodingStore.binarizationCNumberMin"
            :max="decodingStore.binarizationCNumberMax"
            label="Binarization C Number"
            :only-end="true"
        ></slider-group>
        <image-display-application :image-to-display="decodingStore.binarizedImage as Image | null"></image-display-application>
        <h3>Finders</h3>
        <slider-group
            v-model="decodingStore.findersThreshold"
            :min="decodingStore.findersThresholdMin"
            :max="decodingStore.findersThresholdMax"
            label="Finders Threshold"
            :only-end="false"
        ></slider-group>
        <image-display-application :image-to-display="decodingStore.findersHImage as Image | null"></image-display-application>
        <image-display-application :image-to-display="decodingStore.findersVImage as Image | null"></image-display-application>
        <image-display-application :image-to-display="decodingStore.findersLocations as Image | null"></image-display-application>
        <h3>Cluster/Cull-Finders</h3>
        <image-display-application
            :image-to-display="decodingStore.clusteredFindersLocations as Image | null"
        ></image-display-application>
        <h3>Re-Project</h3>
        <slider-group
            v-model="decodingStore.reProjectOffset"
            :min="decodingStore.reProjectOffsetMin"
            :max="decodingStore.reProjectOffsetMax"
            label="Reproject Offset"
            :only-end="false"
        ></slider-group>
        <slider-group
            v-model="decodingStore.reProjectSide"
            :min="decodingStore.reProjectSideMin"
            :max="decodingStore.reProjectSideMax"
            label="Reproject Size"
            :only-end="false"
        ></slider-group>
        <image-display-application :image-to-display="decodingStore.reProjected as Image | null"></image-display-application>
    </div>
</template>

<style scoped>
    h1,
    h2,
    h3 {
        text-align: center;
    }
</style>
