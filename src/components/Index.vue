<script setup lang="ts">
    import PhotoApplication from "./PhotoApplication.vue";
    import { Image } from "./../functions/types";
    import { ref } from "vue";

    const testTrigger = ref(false);

    function handleTakenFrame(frame: Image) {
        testTrigger.value = false;
        console.log("App recieved image", frame);
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
    </div>
</template>

<style scoped></style>
