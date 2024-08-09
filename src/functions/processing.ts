import { Image } from "./image";

export type FinderLinesFinder = [number, [number, number]][];

const BLACK = 0;
const WHITE = 255;

export function findersHorizontal(image: Image, threshold: number): FinderLinesFinder {
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

                const relA = compPC(a, average_width);
                const relB = compPC(b, average_width);
                const relC = compPC(c, average_width * 3);
                const relD = compPC(d, average_width);
                const relE = compPC(e, average_width);

                const maxRelErr = Math.max(relA, relB, relC, relD, relE);

                const startCol = sum;
                const endCol = sum + a + b + c + d + e;

                if (maxRelErr < threshold) {
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
