import { defineStore } from "pinia";
import { computed, ref, watch, nextTick as vueNextTick } from "vue";
import { Image } from "../functions/image";
import {
    FinderCoordinate,
    calculateFourthCenterProjection,
    drawFinderPointsOnImage,
    drawHorizontalFinderLinesOnImage,
    drawVerticalFinderLinesOnImage,
    findersHorizontal,
    findersVertical,
    weightedKMeans,
    possibleFinderPoints,
    averageCoordinateWeighted,
    cullOutliers,
    calculateFourthCenterSquare,
    FinderCoordinateMeta,
    calculateFinderBoundaries,
    fourthFinderSearchBoundary,
} from "../functions/processing";

export default defineStore("decoding", () => {
    const inputImage = ref<Image | null>(null);
    const finished = ref(false);

    // custom next tick, that waits for browser, not for virtual dom of vue
    const nextTick = (callback: () => void) => {
        setTimeout(callback, 0);
    };

    function signalFinished() {
        console.log("TIMINGS", calculatedTimings.value);
        finished.value = true;
        vueNextTick(() => {
            finished.value = false;
        });
    }

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
    const resizedImageSizeMin = ref<number>(50);
    const resizedImageSizeMax = ref<number>(600);
    const resizedImageSize = ref<number>(400);
    watch([grayscaleImage, resizedImageSize], () => {
        nextTick(() => {
            if (grayscaleImage.value != null) {
                startTiming("resize");

                const target_larger = resizedImageSize.value;
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
    const blurRadiusMin = ref<number>(0);
    const blurRadiusMax = ref<number>(10);
    const blurRadius = ref<number>(1);
    watch([resizedImage, blurRadius], () => {
        nextTick(() => {
            if (resizedImage.value != null) {
                startTiming("blur");

                blurredImage.value = resizedImage.value.blur(blurRadius.value);

                endTiming("blur");
            }
        });
    });

    const binarizedImage = ref<Image | null>(null);
    const binarizationNumCellsMin = ref<number>(2);
    const binarizationNumCellsMax = ref<number>(15);
    const binarizationNumCells = ref<number>(5);
    const binarizationCNumberMin = ref<number>(0);
    const binarizationCNumberMax = ref<number>(70);
    const binarizationCNumber = ref<number>(10);
    watch([blurredImage, binarizationNumCells, binarizationCNumber], () => {
        nextTick(() => {
            if (blurredImage.value != null) {
                startTiming("threshold");

                let approxBlockSize = Math.round(
                    (blurredImage.value.getWidth() + blurredImage.value.getHeight()) / 2 / binarizationNumCells.value
                );
                binarizedImage.value = blurredImage.value.applyAdaptiveGaussianThresholding(
                    approxBlockSize,
                    binarizationCNumber.value / 100
                );

                endTiming("threshold");
            }
        });
    });

    const findersHImage = ref<Image | null>(null);
    const findersVImage = ref<Image | null>(null);
    const findersLocations = ref<Image | null>(null);
    const findersLocationsCulled = ref<Image | null>(null);
    const clusteredFindersLocations = ref<Image | null>(null);
    const findersThresholdMin = ref<number>(5);
    const findersThresholdMax = ref<number>(90);
    const findersThreshold = ref<number>(25);
    const weightExpMin = ref<number>(1);
    const weightExpMax = ref<number>(10);
    const weightExp = ref<number>(5);
    const cullHarshnessMin = ref<number>(1);
    const cullHarshnessMax = ref<number>(100);
    const cullHarshness = ref<number>(35);
    const zbMin = ref<number>(0.5);
    const zbMax = ref<number>(4.5);
    const zb = ref<number>(3);
    // start fov computations
    const fovxMin = ref<number>(10);
    const fovxMax = ref<number>(170);
    const fovyMin = ref<number>(10);
    const fovyMax = ref<number>(170);
    const fovx = ref<number>(61);
    const fovy = ref<number>(61);
    const fx = computed(() => {
        const dimension = (binarizedImage.value as Image | null)?.getWidth() ?? 100;
        return (Math.tan((fovx.value / 2) * (Math.PI / 180)) * dimension) / 2;
    });
    const fy = computed(() => {
        const dimension = (binarizedImage.value as Image | null)?.getHeight() ?? 100;
        return (Math.tan((fovy.value / 2) * (Math.PI / 180)) * dimension) / 2;
    });
    // end fov computations
    const edgePoints = ref<[FinderCoordinateMeta, FinderCoordinateMeta, FinderCoordinateMeta, FinderCoordinate] | null>(null);
    watch([binarizedImage, findersThreshold, weightExp, cullHarshness, fx, fy], () => {
        nextTick(() => {
            if (binarizedImage.value != null) {
                startTiming("search Finders");

                const threshold = findersThreshold.value;
                const findersH = findersHorizontal(binarizedImage.value as Image, threshold);
                const findersV = findersVertical(binarizedImage.value as Image, threshold);
                const finderLocationAssumptionsMeta = possibleFinderPoints(findersH, findersV, weightExp.value);
                const finderLocationAssumptions = finderLocationAssumptionsMeta.map((assumption) => {
                    return assumption[0];
                });

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
                    startTiming("outlier Culling");

                    const culledFinderLocationAssumptionsMeta = cullOutliers(finderLocationAssumptionsMeta, cullHarshness.value);
                    const culledFinderLocationAssumptions = culledFinderLocationAssumptionsMeta.map((assumption) => {
                        return assumption[0];
                    });
                    endTiming("outlier Culling");

                    startTiming("draw Culled Finders");

                    findersLocationsCulled.value = drawFinderPointsOnImage(
                        binarizedImage.value as Image,
                        culledFinderLocationAssumptions,
                        "blue"
                    );

                    endTiming("draw Culled Finders");

                    startTiming("clustering");

                    const clusteredFinderLocationAssumptionsMeta = weightedKMeans(culledFinderLocationAssumptionsMeta, 3);

                    endTiming("clustering");

                    startTiming("fourth Center");

                    const average0 = averageCoordinateWeighted(clusteredFinderLocationAssumptionsMeta[0]);
                    const average1 = averageCoordinateWeighted(clusteredFinderLocationAssumptionsMeta[1]);
                    const average2 = averageCoordinateWeighted(clusteredFinderLocationAssumptionsMeta[2]);

                    const fourthCenterMetaProjection = calculateFourthCenterProjection(
                        average0,
                        average1,
                        average2,
                        binarizedImage.value.getWidth(),
                        binarizedImage.value.getHeight(),
                        fx.value,
                        fy.value,
                        zb.value
                    );
                    const fourthCenterMeta = calculateFourthCenterSquare(average0, average1, average2);
                    const centers: [FinderCoordinateMeta, FinderCoordinateMeta, FinderCoordinateMeta, FinderCoordinate] = [
                        fourthCenterMeta[1][0],
                        fourthCenterMeta[1][1],
                        fourthCenterMeta[1][2],
                        fourthCenterMetaProjection, // give this into transformation step, because it is right SOMETIMES
                    ];
                    edgePoints.value = structuredClone(centers); // do not give reference that is used here into ref
                    console.log("This is drawn", edgePoints.value);

                    endTiming("fourth Center");

                    startTiming("draw clustered centers");

                    const clusteredFinderLocationAssumptions = clusteredFinderLocationAssumptionsMeta.map((cluster) => {
                        return cluster.map((meta) => {
                            return meta[0];
                        });
                    }); // strip weights for drawing
                    let clusterDrawTarget = binarizedImage.value.copyImage();
                    clusterDrawTarget = drawFinderPointsOnImage(clusterDrawTarget, clusteredFinderLocationAssumptions[0], "blue");
                    clusterDrawTarget = drawFinderPointsOnImage(clusterDrawTarget, clusteredFinderLocationAssumptions[1], "red");
                    clusterDrawTarget = drawFinderPointsOnImage(
                        clusterDrawTarget,
                        clusteredFinderLocationAssumptions[2],
                        "green"
                    );
                    clusterDrawTarget = drawFinderPointsOnImage(clusterDrawTarget, [centers[0][0]], "blue", 30);
                    clusterDrawTarget = drawFinderPointsOnImage(clusterDrawTarget, [centers[1][0]], "red", 30);
                    clusterDrawTarget = drawFinderPointsOnImage(clusterDrawTarget, [centers[2][0]], "green", 30);
                    clusterDrawTarget = drawFinderPointsOnImage(clusterDrawTarget, [fourthCenterMeta[0]], "orange", 30);
                    clusterDrawTarget = drawFinderPointsOnImage(clusterDrawTarget, [fourthCenterMetaProjection], "purple", 30);

                    clusteredFindersLocations.value = clusterDrawTarget;

                    endTiming("draw clustered centers");
                } else {
                    console.error("Not Enough finder assumptions");
                    signalFinished();
                }
            }
        });
    });

    const areaMarkings = ref<Image | null>(null);
    const forthCenterSearchRadiusMin = ref<number>(5);
    const forthCenterSearchRadiusMax = ref<number>(100);
    const forthCenterSearchRadius = ref<number>(30);
    watch([clusteredFindersLocations, forthCenterSearchRadius, edgePoints], () => {
        nextTick(async () => {
            if (clusteredFindersLocations.value != null && edgePoints.value != null && binarizedImage.value != null) {
                startTiming("area Markings");

                const [squareA, squareB, squareC] = calculateFinderBoundaries(
                    edgePoints.value[0],
                    edgePoints.value[1],
                    edgePoints.value[2]
                );
                const finderArea = fourthFinderSearchBoundary(
                    edgePoints.value[0],
                    edgePoints.value[1],
                    edgePoints.value[2],
                    forthCenterSearchRadius.value
                );

                let drawMarkingsImage = binarizedImage.value.copyImage();
                drawMarkingsImage.drawSquareInPlace(...squareA, "orange");
                drawMarkingsImage.drawSquareInPlace(...squareB, "orange");
                drawMarkingsImage.drawSquareInPlace(...squareC, "orange");
                drawMarkingsImage.drawSquareInPlace(...finderArea, "red");

                areaMarkings.value = drawMarkingsImage;

                endTiming("area Markings");
            }
        });
    });

    const reProjected = ref<Image | null>(null);
    const reProjectOffsetMin = ref<number>(5);
    const reProjectOffsetMax = ref<number>(100);
    const reProjectOffset = ref<number>(30);
    const reProjectSideMin = ref<number>(50);
    const reProjectSideMax = ref<number>(250);
    const reProjectSide = ref<number>(150);
    watch([clusteredFindersLocations, reProjectOffset, reProjectSide], () => {
        nextTick(async () => {
            if (clusteredFindersLocations.value != null && edgePoints.value != null && binarizedImage.value != null) {
                startTiming("reprojection");

                const offset = reProjectOffset.value;
                const side = reProjectSide.value;

                reProjected.value = await binarizedImage.value.applyPerspectiveTransformation(
                    side + 2 * offset,
                    side + 2 * offset,
                    edgePoints.value[0][0],
                    edgePoints.value[1][0],
                    edgePoints.value[2][0],
                    edgePoints.value[3],
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

                signalFinished();
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
        areaMarkings.value = null;
        reProjected.value = null;
    }
    function start(image: Image) {
        inputImage.value = image;
    }
    return {
        calculatedTimings,
        start,
        finished,

        // images
        inputImage,
        grayscaleImage,
        resizedImage,
        blurredImage,
        binarizedImage,
        findersHImage,
        findersVImage,
        findersLocations,
        findersLocationsCulled,
        clusteredFindersLocations,
        reProjected,
        areaMarkings,

        // settings
        resizedImageSizeMin,
        resizedImageSizeMax,
        resizedImageSize,
        blurRadiusMin,
        blurRadiusMax,
        blurRadius,
        binarizationNumCellsMin,
        binarizationNumCellsMax,
        binarizationNumCells,
        binarizationCNumberMin,
        binarizationCNumberMax,
        binarizationCNumber,
        findersThresholdMin,
        findersThresholdMax,
        findersThreshold,
        reProjectOffsetMin,
        reProjectOffsetMax,
        reProjectOffset,
        reProjectSideMin,
        reProjectSideMax,
        reProjectSide,
        weightExpMin,
        weightExpMax,
        weightExp,
        cullHarshnessMin,
        cullHarshnessMax,
        cullHarshness,
        forthCenterSearchRadiusMin,
        forthCenterSearchRadiusMax,
        forthCenterSearchRadius,
        fovxMin,
        fovxMax,
        fovx,
        fx,
        fovyMin,
        fovyMax,
        fovy,
        fy,
        zbMin,
        zbMax,
        zb,
    };
});
