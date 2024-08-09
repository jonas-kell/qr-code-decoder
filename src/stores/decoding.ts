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

    const resizedImage = ref<Image | null>(null);
    watch(grayscaleImage, () => {
        nextTick(() => {
            if (grayscaleImage.value != null) {
                const target_width = 300; // todo decide size
                const target_height = Math.round(
                    (grayscaleImage.value.getHeight() / grayscaleImage.value.getWidth()) * target_width
                );

                resizedImage.value = grayscaleImage.value.resize(target_width, target_height);
            }
        });
    });

    const blurredImage = ref<Image | null>(null);
    watch(resizedImage, () => {
        nextTick(() => {
            if (resizedImage.value != null) {
                blurredImage.value = resizedImage.value.blur(1); // todo decide the blur radius
            }
        });
    });

    const binarizedImage = ref<Image | null>(null);
    watch(blurredImage, () => {
        nextTick(() => {
            if (blurredImage.value != null) {
                let approxBlockSize = Math.round((blurredImage.value.getWidth() + blurredImage.value.getHeight()) / 2 / 20);
                if (approxBlockSize % 2 == 0) {
                    approxBlockSize += 1;
                }
                binarizedImage.value = blurredImage.value.applyAdaptiveGaussianThresholding(approxBlockSize, 0.1); // todo decide parameters
            }
        });
    });

    function reset() {
        inputImage.value = null;
        resizedImage.value = null;
        blurredImage.value = null;
        binarizedImage.value = null;
    }
    function start(image: Image) {
        inputImage.value = image;
    }
    return { start, inputImage, grayscaleImage, resizedImage, blurredImage, binarizedImage };
});
