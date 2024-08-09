<script setup lang="ts">
    import PhotoApplication from "./PhotoApplication.vue";
    import ImageDisplayApplication from "./ImageDisplayApplication.vue";
    import { Image } from "../functions/image";
    import { ref } from "vue";

    const testTrigger = ref(false);

    async function handleTakenFrame(frame: Image) {
        testTrigger.value = false;

        secondStage.value = frame;
        // secondStage.value = frame.drawSquare(10, 10, 20, 20, "blue");
    }

    const secondStage = ref<null | Image>(null);
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
        <image-display-application :image-to-display="secondStage as Image"></image-display-application>
    </div>
</template>

<style scoped></style>
