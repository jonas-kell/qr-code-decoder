import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { Image } from "../functions/image";
import {
    FinderCoordinate,
    averageCoordinate,
    calculateFourthCenterSquare,
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

    // custom next tick, that waits for browser, not for virtual dom of vue
    const nextTick = (callback: () => void) => {
        setTimeout(callback, 0);
    };

    const timings = ref<{ [key: string]: [number, null | number, number] }>({});
    function startTiming(key: string) {
        timings.value[key] = [Date.now(), null, Object.keys(timings.value).length];
    }
    function endTiming(key: string) {
        timings.value[key][1] = Date.now();
    }
    function resetTiming() {
        timings.value = {};
    }
    const calculatedTimings = computed<[string, number][]>(() => {
        return Object.keys(timings.value)
            .sort((a, b) => {
                return timings.value[a][2] - timings.value[b][2];
            })
            .map((key) => {
                const val = timings.value[key];
                let timing = -1;

                if (val[1] != null) {
                    timing = val[1] - val[0];
                }

                return [key, timing];
            });
    });

    const grayscaleImage = ref<Image | null>(null);
    watch(inputImage, () => {
        resetTiming();

        nextTick(() => {
            startTiming("grayscale");

            if (inputImage.value != null) {
                grayscaleImage.value = inputImage.value.grayScale();
            } else {
                reset();
            }

            endTiming("grayscale");
        });
    });

    const resizedImage = ref<Image | null>(null);
    watch(grayscaleImage, () => {
        nextTick(() => {
            if (grayscaleImage.value != null) {
                startTiming("resize");

                const target_larger = 400; // todo decide size
                let target_width: number;
                let target_height: number;

                if (grayscaleImage.value.getWidth() > grayscaleImage.value.getHeight()) {
                    target_width = target_larger;
                    target_height = Math.round(
                        (grayscaleImage.value.getHeight() / grayscaleImage.value.getWidth()) * target_larger
                    );
                } else {
                    target_width = Math.round(
                        (grayscaleImage.value.getWidth() / grayscaleImage.value.getHeight()) * target_larger
                    );
                    target_height = target_larger;
                }

                resizedImage.value = grayscaleImage.value.resize(target_width, target_height);

                endTiming("resize");
            }
        });
    });

    const blurredImage = ref<Image | null>(null);
    watch(resizedImage, () => {
        nextTick(() => {
            if (resizedImage.value != null) {
                startTiming("blur");

                blurredImage.value = resizedImage.value.blur(1); // todo decide the blur radius

                endTiming("blur");
            }
        });
    });

    const binarizedImage = ref<Image | null>(null);
    watch(blurredImage, () => {
        nextTick(() => {
            if (blurredImage.value != null) {
                startTiming("threshold");

                const num_cells = 5; // todo decide parameters
                let approxBlockSize = Math.round(
                    (blurredImage.value.getWidth() + blurredImage.value.getHeight()) / 2 / num_cells
                );
                if (approxBlockSize % 2 == 0) {
                    approxBlockSize += 1;
                }
                binarizedImage.value = blurredImage.value.applyAdaptiveGaussianThresholding(approxBlockSize, 0.1); // todo decide parameters

                endTiming("threshold");
            }
        });
    });

    const findersHImage = ref<Image | null>(null);
    const findersVImage = ref<Image | null>(null);
    const findersLocations = ref<Image | null>(null);
    const clusteredFindersLocations = ref<Image | null>(null);
    const edgePoints = ref<[FinderCoordinate, FinderCoordinate, FinderCoordinate, FinderCoordinate] | null>(null);
    watch(binarizedImage, () => {
        nextTick(() => {
            if (binarizedImage.value != null) {
                // TODO set th in % (can be larger, because needs also vertical intersection)
                startTiming("search Finders");

                const threshold = 25;
                const findersH = findersHorizontal(binarizedImage.value as Image, threshold);
                const findersV = findersVertical(binarizedImage.value as Image, threshold);
                const finderLocationAssumptions = possibleFinderPoints(findersH, findersV);

                endTiming("search Finders");

                startTiming("draw Finders");

                findersHImage.value = drawHorizontalFinderLinesOnImage(binarizedImage.value as Image, findersH);
                findersVImage.value = drawVerticalFinderLinesOnImage(binarizedImage.value as Image, findersV);
                findersLocations.value = drawFinderPointsOnImage(
                    binarizedImage.value as Image,
                    finderLocationAssumptions,
                    "blue"
                );

                endTiming("draw Finders");

                if (finderLocationAssumptions.length >= 3) {
                    startTiming("clustering");

                    const clusteredFinderLocationAssumptions = kMeans(
                        finderLocationAssumptions,
                        3,
                        Math.floor(finderLocationAssumptions.length * 4)
                    );

                    endTiming("clustering");

                    startTiming("fourth Center");

                    const average0 = averageCoordinate(clusteredFinderLocationAssumptions[0]);
                    const average1 = averageCoordinate(clusteredFinderLocationAssumptions[1]);
                    const average2 = averageCoordinate(clusteredFinderLocationAssumptions[2]);

                    const fourthCenterMeta = calculateFourthCenterSquare(average0, average1, average2);
                    edgePoints.value = [...fourthCenterMeta[1], fourthCenterMeta[0]];

                    endTiming("fourth Center");

                    startTiming("draw clustered centers");

                    let clusterDrawTarget = binarizedImage.value.copyImage();
                    clusterDrawTarget = drawFinderPointsOnImage(clusterDrawTarget, clusteredFinderLocationAssumptions[0], "blue");
                    clusterDrawTarget = drawFinderPointsOnImage(clusterDrawTarget, clusteredFinderLocationAssumptions[1], "red");
                    clusterDrawTarget = drawFinderPointsOnImage(
                        clusterDrawTarget,
                        clusteredFinderLocationAssumptions[2],
                        "green"
                    );
                    clusterDrawTarget = drawFinderPointsOnImage(clusterDrawTarget, [average0], "blue", 30);
                    clusterDrawTarget = drawFinderPointsOnImage(clusterDrawTarget, [average1], "red", 30);
                    clusterDrawTarget = drawFinderPointsOnImage(clusterDrawTarget, [average2], "green", 30);
                    clusterDrawTarget = drawFinderPointsOnImage(clusterDrawTarget, [fourthCenterMeta[0]], "purple", 30);

                    clusteredFindersLocations.value = clusterDrawTarget;

                    endTiming("draw clustered centers");
                } else {
                    console.error("Not Enough finder assumptions");
                }
            }
        });
    });

    const reProjected = ref<Image | null>(null);
    watch(clusteredFindersLocations, () => {
        nextTick(async () => {
            if (clusteredFindersLocations.value != null && edgePoints.value != null && binarizedImage.value != null) {
                startTiming("reprojection");

                const offset = 30;
                const side = 150;

                reProjected.value = await binarizedImage.value.applyPerspectiveTransformation(
                    side + 2 * offset,
                    side + 2 * offset,
                    ...edgePoints.value,
                    offset, // t1x
                    offset + side, // t1y
                    offset, // t2x
                    offset, // t2y
                    offset + side, // t3x
                    offset, // t3y
                    offset + side, // t4x
                    offset + side // t4y
                );

                endTiming("reprojection");

                console.log("TIMINGS", calculatedTimings.value);
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
        reProjected.value = null;
    }
    function start(image: Image) {
        inputImage.value = image;
    }
    return {
        calculatedTimings,
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
        reProjected,
    };
});
