import { Image } from "./image";

export type FinderLinesFinder = [number, [number, number]][];
export type FinderCoordinate = [number, number];
export type FinderCoordinates = FinderCoordinate[];

const BLACK = 0;
const WHITE = 255;

export function findersHorizontal(image: Image, threshold: number): FinderLinesFinder {
    const thresholdPotency = Math.pow(100 - threshold, 5);

    const width = image.getWidth();
    const height = image.getHeight();
    const data = image.getImageData().data;

    // Helper function to get the pixel value (0 for black, 255 for white)
    const getPixelValue = (x: number, y: number): number => {
        const index = (y * width + x) * 4;
        return data[index] < 128 ? BLACK : WHITE; // Black or white
    };
    const compPC = (x: number, y: number): number => {
        return Math.abs(((x - y) / y) * 100);
    };

    let res: FinderLinesFinder = [];

    for (let y = 0; y < height; y++) {
        const helperArray: number[] = [];

        let leadingPixel = getPixelValue(0, y);
        if (leadingPixel == WHITE) {
            helperArray.push(0); // black "not" there
        }

        let currentState = leadingPixel;
        let count = 0;
        for (let x = 0; x < width; x++) {
            const pixelValue = getPixelValue(x, y);
            if (pixelValue === currentState) {
                count++;
            } else {
                helperArray.push(count);
                currentState = pixelValue;
                count = 1; // Start new count
            }
        }
        helperArray.push(count); // push the last count

        // Parse the helper array for patterns
        let i = 0;
        let sum = 0;
        while (i + 4 < helperArray.length) {
            const a = helperArray[i];
            const b = helperArray[i + 1];
            const c = helperArray[i + 2];
            const d = helperArray[i + 3];
            const e = helperArray[i + 4];

            if (a > 0) {
                const average_width = (a + b + c + d + e) / 7; // b1 + w1 + b3 + w1 + b1

                const relA = 100 - compPC(a, average_width);
                const relB = 100 - compPC(b, average_width);
                const relC = 100 - compPC(c, average_width * 3);
                const relD = 100 - compPC(d, average_width);
                const relE = 100 - compPC(e, average_width);

                const compositeFit = relA * relB * relC * relD * relE;

                const startCol = sum;
                const endCol = sum + a + b + c + d + e;

                if (compositeFit > thresholdPotency) {
                    // console.log(`Pattern found at row ${y}: Start  ${startCol}, End  ${endCol}, max rel err ${maxRelErr}`);
                    res.push([y, [startCol, endCol]]);
                } else {
                    // console.log(`Pattern rejected at row ${y} Start  ${startCol}, End  ${endCol}, max rel err ${maxRelErr}`);
                }
            }

            i += 2; // Advance by 2 for next pattern check
            sum += a;
            sum += b;
        }
    }

    return res;
}

export function findersVertical(image: Image, threshold: number): FinderLinesFinder {
    const transposedImage = image.transpose();

    return findersHorizontal(transposedImage, threshold);
}

export function drawHorizontalFinderLinesOnImage(image: Image, finderLines: FinderLinesFinder): Image {
    const copyImageToDrawOn = image.copyImage();

    finderLines.forEach((line) => {
        const index = line[0];
        const start = line[1][0];
        const end = line[1][1];

        copyImageToDrawOn.drawLineInPlace(start, index, end, index, "green");
    });

    return copyImageToDrawOn;
}

export function drawVerticalFinderLinesOnImage(image: Image, finderLines: FinderLinesFinder): Image {
    const copyImageToDrawOn = image.copyImage();

    finderLines.forEach((line) => {
        const index = line[0];
        const start = line[1][0];
        const end = line[1][1];

        copyImageToDrawOn.drawLineInPlace(index, start, index, end, "orange");
    });

    return copyImageToDrawOn;
}

export function possibleFinderPoints(
    finderLinesHorizontal: FinderLinesFinder,
    finderLinesVertical: FinderLinesFinder
): FinderCoordinates {
    let res: FinderCoordinates = [];
    finderLinesHorizontal.forEach((finderLineHorizontal) => {
        finderLinesVertical.forEach((finderLineVertical) => {
            if (finderLineHorizontal[0] > finderLineVertical[1][0] && finderLineHorizontal[0] < finderLineVertical[1][1]) {
                if (finderLineVertical[0] > finderLineHorizontal[1][0] && finderLineVertical[0] < finderLineHorizontal[1][1]) {
                    res.push([finderLineVertical[0], finderLineHorizontal[0]]);
                }
            }
        });
    });

    return res;
}

export function drawFinderPointsOnImage(image: Image, coordinates: FinderCoordinates, color: string, size = 5): Image {
    const copyImageToDrawOn = image.copyImage();

    coordinates.forEach((coordinate) => {
        copyImageToDrawOn.drawLineInPlace(coordinate[0] - size, coordinate[1], coordinate[0] + size, coordinate[1], color);
        copyImageToDrawOn.drawLineInPlace(coordinate[0], coordinate[1] - size, coordinate[0], coordinate[1] + size, color);
    });

    return copyImageToDrawOn;
}

/**
 * Calculates the Euclidean distance between two points.
 * @param point1 - First point [x, y].
 * @param point2 - Second point [x, y].
 * @returns The Euclidean distance.
 */
function euclideanDistance(point1: FinderCoordinate, point2: FinderCoordinate): number {
    return Math.sqrt(Math.pow(point1[0] - point2[0], 2) + Math.pow(point1[1] - point2[1], 2));
}

/**
 * Initializes centroids randomly from the given data points.
 * @param points - The data points to choose centroids from.
 * @param k - The number of clusters.
 * @returns An array of initial centroids.
 */
function initializeCentroids(points: FinderCoordinates, k: number): FinderCoordinate[] {
    const shuffled = points.slice().sort(() => 0.5 - Math.random());
    return shuffled.slice(0, k);
}

/**
 * Performs K-means clustering.
 * @param points - The data points to cluster.
 * @param k - The number of clusters.
 * @param maxIterations - The maximum number of iterations.
 * @returns An array of clusters, each cluster being an array of FinderCoordinates.
 */
export function kMeans(points: FinderCoordinates, k: number, maxIterations: number = 100): FinderCoordinates[] {
    let centroids = initializeCentroids(points, k);
    let previousCentroids: FinderCoordinate[];
    let clusters: FinderCoordinates[] = []; // is getting overridden in any case, but typescript does not get this.

    for (let iteration = 0; iteration < maxIterations; iteration++) {
        // Assign points to the nearest centroid
        clusters = Array.from({ length: k }, () => []);
        points.forEach((point) => {
            const distances = centroids.map((centroid) => euclideanDistance(point, centroid));
            const nearestIndex = distances.indexOf(Math.min(...distances));
            clusters[nearestIndex].push(point);
        });

        // Store the old centroids to check for convergence
        previousCentroids = centroids;

        // Recalculate centroids
        centroids = centroids.map((_, index) => {
            const clusterPoints = clusters[index];
            if (clusterPoints.length === 0) return previousCentroids[index]; // Handle empty clusters
            return averageCoordinate(clusterPoints);
        });

        // Check for convergence (if centroids do not change)
        const converged = centroids.every((centroid, index) => euclideanDistance(centroid, previousCentroids[index]) < 1e-6);
        if (converged) {
            console.log(`Converged after ${iteration} iterations`); // TODO comment out
            break;
        }
    }

    return clusters;
}

export function averageCoordinate(points: FinderCoordinates): FinderCoordinate {
    const x = points.reduce((sum, [x]) => sum + x, 0) / points.length;
    const y = points.reduce((sum, [, y]) => sum + y, 0) / points.length;

    return [x, y];
}

function orderThreeCentersCyclically(
    a: FinderCoordinate,
    b: FinderCoordinate,
    c: FinderCoordinate
): [FinderCoordinate, FinderCoordinate, FinderCoordinate] {
    // Function to compute the angle between a point and the centroid
    function calculateAngle(point: FinderCoordinate, center: FinderCoordinate): number {
        const [x, y] = point;
        const [cx, cy] = center;
        return Math.atan2(y - cy, x - cx);
    }

    // Function to order the points cyclically around their common center
    function sortByAngle(points: FinderCoordinate[], center: FinderCoordinate): FinderCoordinate[] {
        return points.sort((a, b) => calculateAngle(a, center) - calculateAngle(b, center));
    }

    function calculateAngleVec(center: FinderCoordinate, from: FinderCoordinate, to: FinderCoordinate): number {
        const firstVec = [from[0] - center[0], from[1] - center[1]];
        const secondVec = [to[0] - center[0], to[1] - center[1]];

        const dotProduct = firstVec[0] * secondVec[0] + firstVec[1] * secondVec[1];
        const magnitudeFirstVec = Math.sqrt(firstVec[0] ** 2 + firstVec[1] ** 2);
        const magnitudeSecondVec = Math.sqrt(secondVec[0] ** 2 + secondVec[1] ** 2);

        const cosTheta = dotProduct / (magnitudeFirstVec * magnitudeSecondVec);
        const angleRadians = Math.acos(Math.max(-1, Math.min(1, cosTheta)));

        return angleRadians;
    }

    // order cyclically
    const commonCenter = averageCoordinate([a, b, c]);

    const sortedPoints = sortByAngle([a, b, c], commonCenter) as [FinderCoordinate, FinderCoordinate, FinderCoordinate];

    // make it start with the "lower left", then "top left" and finally "top right" -> search for the largest "in-between" angle
    const [A, B, C] = sortedPoints;
    const angleACenter = calculateAngleVec(A, C, B);
    const angleBCenter = calculateAngleVec(B, A, C);
    const angleCCenter = calculateAngleVec(C, B, A);

    if (angleACenter > angleBCenter && angleACenter > angleCCenter) {
        return [C, A, B];
    }

    if (angleBCenter > angleACenter && angleBCenter > angleCCenter) {
        return [A, B, C];
    }

    if (angleCCenter > angleACenter && angleCCenter > angleCCenter) {
        return [B, C, A];
    }

    throw Error("THIS SHOULD BE IMPOSSIBLE");
}

export function calculateFourthCenterSquare(
    a: FinderCoordinate,
    b: FinderCoordinate,
    c: FinderCoordinate
): [FinderCoordinate, [FinderCoordinate, FinderCoordinate, FinderCoordinate]] {
    const [reorderedA, reorderedB, reorderedC] = orderThreeCentersCyclically(a, b, c);

    // calculate the
    const x = reorderedA[0] + reorderedC[0] - reorderedB[0];
    const y = reorderedA[1] + reorderedC[1] - reorderedB[1];

    return [
        [x, y],
        [reorderedA, reorderedB, reorderedC],
    ];
}
