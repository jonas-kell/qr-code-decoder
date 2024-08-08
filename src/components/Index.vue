<script setup lang="ts">
    import PhotoApplication from "./PhotoApplication.vue";
    import ImageDisplayApplication from "./ImageDisplayApplication.vue";
    import { Image } from "./../functions/types";
    import { ref } from "vue";
    import useEditingTools from "./../functions/editing-tools";

    const testTrigger = ref(false);

    function handleTakenFrame(frame: Image) {
        testTrigger.value = false;

        const { drawSquare } = useEditingTools();
        secondStage.value = drawSquare(frame, 10, 10, 20, 20, "blue");
    }

    const secondStage = ref(null as null | Image);
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
        <image-display-application :image-to-display="secondStage"></image-display-application>
    </div>

    <canvas style="display: none" id="editing-canvas"></canvas>
</template>

<style scoped></style>
