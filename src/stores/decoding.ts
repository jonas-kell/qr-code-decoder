import { defineStore } from "pinia";
import { nextTick, ref, watch } from "vue";
import { Image } from "../functions/image";

export default defineStore("decoding", () => {
    const inputImage = ref<Image | null>(null);

    const grayscaleImage = ref<Image | null>(null);
    watch(inputImage, () => {
        nextTick(() => {
            if (inputImage.value != null) {
                grayscaleImage.value = inputImage.value.grayScale();
            } else {
                reset();
            }
        });
    });

    const blurredImage = ref<Image | null>(null);
    watch(grayscaleImage, () => {
        nextTick(() => {
            if (grayscaleImage.value != null) {
                blurredImage.value = grayscaleImage.value.blur(3); // todo decide the blur radius
            }
        });
    });

    const binarizedImage = ref<Image | null>(null);
    watch(blurredImage, () => {
        nextTick(() => {
            if (blurredImage.value != null) {
                binarizedImage.value = blurredImage.value.applyAdaptiveGaussianThresholding(3, 6); // todo decide parameters
            }
        });
    });

    function reset() {
        inputImage.value = null;
        blurredImage.value = null;
        binarizedImage.value = null;
    }
    function start(image: Image) {
        inputImage.value = image;
    }
    return { start, inputImage, grayscaleImage, blurredImage, binarizedImage };
});
