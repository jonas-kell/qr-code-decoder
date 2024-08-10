import { Image } from "./image";

export function blur(image: Image, radius: number): Image {
    const copiedImage = image.copyImage();
    const imageData = image.getImageData();
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const blurredData = new Uint8ClampedArray(data);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let r = 0,
                g = 0,
                b = 0,
                a = 0;
            let count = 0;

            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const nx = x + dx;
                    const ny = y + dy;

                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                        const index = (ny * width + nx) * 4;
                        r += data[index];
                        g += data[index + 1];
                        b += data[index + 2];
                        a += data[index + 3];
                        count++;
                    }
                }
            }

            const i = (y * width + x) * 4;
            blurredData[i] = r / count;
            blurredData[i + 1] = g / count;
            blurredData[i + 2] = b / count;
            blurredData[i + 3] = a / count;
        }
    }

    copiedImage.putImageData(new ImageData(blurredData, width, height), 0, 0);
    return copiedImage;
}

/**
 * @param blockSize must be odd!!!
 * @param C the subtraction parameter
 * @returns
 */
export function applyAdaptiveGaussianThresholding(image: Image, blockSize: number, C: number): Image {
    const copiedImage = image.copyImage();
    const imageData = copiedImage.getImageData();
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const halfBlockSize = Math.floor(blockSize / 2);

    const binaryData = new Uint8ClampedArray(data.length);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let sum = 0;
            let sumSq = 0;
            let count = 0;

            for (let dy = -halfBlockSize; dy <= halfBlockSize; dy++) {
                for (let dx = -halfBlockSize; dx <= halfBlockSize; dx++) {
                    const nx = x + dx;
                    const ny = y + dy;

                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                        const index = (ny * width + nx) * 4;
                        const pixelValue = data[index]; // Already grayscale assumed
                        sum += pixelValue;
                        sumSq += pixelValue * pixelValue;
                        count++;
                    }
                }
            }

            const mean = sum / count;
            const variance = sumSq / count - mean * mean;
            const stdDev = Math.sqrt(variance);

            const threshold = mean - C * stdDev;
            const index = (y * width + x) * 4;

            // Binary thresholding
            const pixelValue = data[index];
            if (pixelValue > threshold) {
                binaryData[index] = binaryData[index + 1] = binaryData[index + 2] = 255; // White
            } else {
                binaryData[index] = binaryData[index + 1] = binaryData[index + 2] = 0; // Black
            }
            binaryData[index + 3] = 255; // Alpha channel (fully opaque)
        }
    }

    copiedImage.putImageData(new ImageData(binaryData, width, height), 0, 0);
    return copiedImage;
}
