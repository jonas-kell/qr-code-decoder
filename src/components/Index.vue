<script setup lang="ts">
    import PhotoApplication from "./PhotoApplication.vue";
    import ImageDisplayApplication from "./ImageDisplayApplication.vue";
    import { Image } from "../functions/image";
    import { ref } from "vue";
    import useDecodingStore from "./../stores/decoding";

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

        <photo-application :take-photo="testTrigger" @frame-taken="handleTakenFrame"></photo-application>

        <h3>Grayscaled</h3>
        <image-display-application :image-to-display="decodingStore.grayscaleImage as Image | null"></image-display-application>
        <h3>Resized</h3>
        <image-display-application :image-to-display="decodingStore.resizedImage as Image | null"></image-display-application>
        <h3>Blurred</h3>
        <image-display-application :image-to-display="decodingStore.blurredImage as Image | null"></image-display-application>
        <h3>Binarized</h3>
        <image-display-application :image-to-display="decodingStore.binarizedImage as Image | null"></image-display-application>
        <h3>Finders</h3>
        <image-display-application :image-to-display="decodingStore.findersHImage as Image | null"></image-display-application>
        <image-display-application :image-to-display="decodingStore.findersVImage as Image | null"></image-display-application>
        <image-display-application :image-to-display="decodingStore.findersLocations as Image | null"></image-display-application>
        <h3>Cluster/Cull-Finders</h3>
    </div>
</template>

<style scoped></style>
