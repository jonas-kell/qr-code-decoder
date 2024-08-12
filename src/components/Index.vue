<script setup lang="ts">
    import PhotoApplication from "./PhotoApplication.vue";
    import ImageDisplayApplication from "./ImageDisplayApplication.vue";
    import { Image } from "../functions/image";
    import { ref, watch } from "vue";
    import useDecodingStore from "./../stores/decoding";
    import SliderGroup from "./SliderGroup.vue";
    import { VCheckbox } from "vuetify/components";

    const externalTrigger = ref(false);
    const decodingStore = useDecodingStore();

    async function handleTakenFrame(frame: Image) {
        externalTrigger.value = false;
        decodingStore.start(frame);
    }

    const continuous = ref(false);

    watch(
        () => decodingStore.finished,
        () => {
            if (decodingStore.finished) {
                console.log("finished");

                if (continuous.value) {
                    triggerCycleExternally();
                }
            }
        }
    );

    watch(continuous, () => {
        if (continuous.value) {
            triggerCycleExternally();
        }
    });

    function triggerCycleExternally() {
        externalTrigger.value = true;
    }
</script>

<template>
    <div class="container">
        <h1>QR Code Decoder</h1>

        <div style="display: flex; flex-direction: column; align-items: center; text-align: center">
            <v-checkbox label="Continuous Parsing" :hide-details="true" v-model="continuous"></v-checkbox>
            <span><router-link to="generate">Generate</router-link> a Code (e.g. on Smartphone for scanning)</span>
        </div>

        <photo-application :take-photo="externalTrigger" @frame-taken="handleTakenFrame"></photo-application>

        <h3>Grayscaled</h3>
        <image-display-application :image-to-display="decodingStore.grayscaleImage as Image | null"></image-display-application>
        <h3>Resized</h3>
        <slider-group
            v-model="decodingStore.resizedImageSize"
            :min="decodingStore.resizedImageSizeMin"
            :max="decodingStore.resizedImageSizeMax"
            label="ReSize Target Size"
            :only-end="false"
        ></slider-group>
        <image-display-application :image-to-display="decodingStore.resizedImage as Image | null"></image-display-application>
        <h3>Blurred</h3>
        <slider-group
            v-model="decodingStore.blurRadius"
            :min="decodingStore.blurRadiusMin"
            :max="decodingStore.blurRadiusMax"
            label="Blur Radius"
            :only-end="false"
        ></slider-group>
        <image-display-application :image-to-display="decodingStore.blurredImage as Image | null"></image-display-application>
        <h3>Binarized</h3>
        <slider-group
            v-model="decodingStore.binarizationNumCells"
            :min="decodingStore.binarizationNumCellsMin"
            :max="decodingStore.binarizationNumCellsMax"
            label="Binarization Number Cells"
            :only-end="false"
        ></slider-group>
        <slider-group
            v-model="decodingStore.binarizationCNumber"
            :min="decodingStore.binarizationCNumberMin"
            :max="decodingStore.binarizationCNumberMax"
            label="Binarization C Number"
            :only-end="false"
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
        <h3>Cull/Cluster-Finders</h3>
        <slider-group
            v-model="decodingStore.weightExp"
            :min="decodingStore.weightExpMin"
            :max="decodingStore.weightExpMax"
            label="Weight exp"
            :only-end="false"
        ></slider-group>
        <slider-group
            v-model="decodingStore.cullHarshness"
            :min="decodingStore.cullHarshnessMin"
            :max="decodingStore.cullHarshnessMax"
            label="Cull Harshness"
            :only-end="false"
        ></slider-group>
        <image-display-application
            :image-to-display="decodingStore.findersLocationsCulled as Image | null"
        ></image-display-application>

        <slider-group
            v-model="decodingStore.fovx"
            :min="decodingStore.fovxMin"
            :max="decodingStore.fovxMax"
            :label="'Field of view (x)    (fx=' + decodingStore.fx.toFixed(3) + ')'"
            :only-end="false"
        ></slider-group>
        <slider-group
            v-model="decodingStore.fovy"
            :min="decodingStore.fovyMin"
            :max="decodingStore.fovyMax"
            :label="'Field of view (y)    (fy=' + decodingStore.fy.toFixed(3) + ')'"
            :only-end="false"
        ></slider-group>
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

    h2,
    h3 {
        padding-top: 2em;
    }
</style>
