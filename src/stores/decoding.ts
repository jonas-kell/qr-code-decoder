import { defineStore } from "pinia";
import { nextTick, ref, watch } from "vue";
import { Image } from "../functions/image";
import {
    averageCoordinate,
    drawFinderPointsOnImage,
    drawHorizontalFinderLinesOnImage,
    drawVerticalFinderLinesOnImage,
    findersHorizontal,
    findersVertical,
    kMeans,
    possibleFinderPoints,
} from "../functions/processing";

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
                const target_width = 400; // todo decide size
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
                const num_cells = 5; // todo decide parameters
                let approxBlockSize = Math.round(
                    (blurredImage.value.getWidth() + blurredImage.value.getHeight()) / 2 / num_cells
                );
                if (approxBlockSize % 2 == 0) {
                    approxBlockSize += 1;
                }
                binarizedImage.value = blurredImage.value.applyAdaptiveGaussianThresholding(approxBlockSize, 0.1); // todo decide parameters
            }
        });
    });

    const findersHImage = ref<Image | null>(null);
    const findersVImage = ref<Image | null>(null);
    const findersLocations = ref<Image | null>(null);
    const clusteredFindersLocations = ref<Image | null>(null);
    watch(binarizedImage, () => {
        nextTick(() => {
            if (binarizedImage.value != null) {
                // TODO set th in % (can be larger, because needs also vertical intersection)
                const threshold = 30;
                const findersH = findersHorizontal(binarizedImage.value as Image, threshold);
                const findersV = findersVertical(binarizedImage.value as Image, threshold);
                findersHImage.value = drawHorizontalFinderLinesOnImage(binarizedImage.value as Image, findersH);
                findersVImage.value = drawVerticalFinderLinesOnImage(binarizedImage.value as Image, findersV);

                const finderLocationAssumptions = possibleFinderPoints(findersH, findersV);
                findersLocations.value = drawFinderPointsOnImage(
                    binarizedImage.value as Image,
                    finderLocationAssumptions,
                    "blue"
                );

                if (finderLocationAssumptions.length >= 3) {
                    const clusteredFinderLocationAssumptions = kMeans(
                        finderLocationAssumptions,
                        3,
                        Math.floor(finderLocationAssumptions.length * 1.5)
                    );

                    let clusterDrawTarget = binarizedImage.value.copyImage();
                    clusterDrawTarget = drawFinderPointsOnImage(clusterDrawTarget, clusteredFinderLocationAssumptions[0], "blue");
                    clusterDrawTarget = drawFinderPointsOnImage(clusterDrawTarget, clusteredFinderLocationAssumptions[1], "red");
                    clusterDrawTarget = drawFinderPointsOnImage(
                        clusterDrawTarget,
                        clusteredFinderLocationAssumptions[2],
                        "green"
                    );
                    const average0 = averageCoordinate(clusteredFinderLocationAssumptions[0]);
                    const average1 = averageCoordinate(clusteredFinderLocationAssumptions[1]);
                    const average2 = averageCoordinate(clusteredFinderLocationAssumptions[2]);
                    clusterDrawTarget = drawFinderPointsOnImage(clusterDrawTarget, [average0], "blue", 30);
                    clusterDrawTarget = drawFinderPointsOnImage(clusterDrawTarget, [average1], "red", 30);
                    clusterDrawTarget = drawFinderPointsOnImage(clusterDrawTarget, [average2], "green", 30);

                    clusteredFindersLocations.value = clusterDrawTarget;
                } else {
                    console.error("Not Enough finder assumptions");
                }
            }
        });
    });

    function reset() {
        inputImage.value = null;
        resizedImage.value = null;
        blurredImage.value = null;
        binarizedImage.value = null;
        findersHImage.value = null;
        findersVImage.value = null;
        findersLocations.value = null;
        clusteredFindersLocations.value = null;
    }
    function start(image: Image) {
        inputImage.value = image;
    }
    return {
        start,
        inputImage,
        grayscaleImage,
        resizedImage,
        blurredImage,
        binarizedImage,
        findersHImage,
        findersVImage,
        findersLocations,
        clusteredFindersLocations,
    };
});
