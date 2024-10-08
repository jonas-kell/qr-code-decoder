import { perspectiveTransform } from "./perspective";
import { FinderCoordinate } from "./processing";
import { blur, applyAdaptiveGaussianThresholding } from "./shaders";
export class Image {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    private constructor() {
        this.canvas = document.createElement("canvas");
        const ctxBuf = this.canvas.getContext("2d");
        if (!ctxBuf) {
            throw Error("Editing canvas had no context...");
        }
        this.ctx = ctxBuf;
    }

    public getImageMetaText(): string {
        return `${this.getWidth()} x ${this.getHeight()}`;
    }

    public blur(radius: number): Image {
        return blur(this, radius);
    }

    public grayScale(): Image {
        const copiedImage = this.copyImage();
        const imageData = copiedImage.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        const grayData = new Uint8ClampedArray(data.length);

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const gray = 0.2989 * r + 0.587 * g + 0.114 * b;
            grayData[i] = grayData[i + 1] = grayData[i + 2] = gray;
            grayData[i + 3] = 255; // Alpha channel
        }

        copiedImage.ctx.putImageData(new ImageData(grayData, this.canvas.width, this.canvas.height), 0, 0);
        return copiedImage;
    }

    public getImageData(): ImageData {
        const width = this.getWidth();
        const height = this.getHeight();
        const imageData = this.ctx.getImageData(0, 0, width, height);

        return imageData;
    }

    public putImageData(data: ImageData, dx: number, dy: number) {
        this.ctx.putImageData(data, dx, dy);
    }

    public resize(targetWidth: number, targetHeight: number): Image {
        // Create a new Image instance for the resized image
        const resizedImage = new Image();

        // Set the dimensions of the new canvas
        resizedImage.canvas.width = targetWidth;
        resizedImage.canvas.height = targetHeight;

        // Draw the original image onto the new canvas, resizing it
        resizedImage.ctx.drawImage(this.canvas, 0, 0, this.canvas.width, this.canvas.height, 0, 0, targetWidth, targetHeight);

        return resizedImage;
    }

    public transpose(): Image {
        const transposedImage = new Image();

        const width = this.getWidth();
        const height = this.getHeight();

        transposedImage.canvas.width = height;
        transposedImage.canvas.height = width;

        // Get the image data
        const imageData = this.ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        const tempData = new Uint8ClampedArray(data.length);

        // Swap rows and columns
        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                const originalIndex = (row * width + col) * 4;
                const swappedIndex = (col * height + row) * 4;

                tempData.set(data.subarray(originalIndex, originalIndex + 4), swappedIndex);
            }
        }

        transposedImage.ctx.putImageData(
            new ImageData(tempData, transposedImage.canvas.width, transposedImage.canvas.height),
            0,
            0
        );

        return transposedImage;
    }

    /**
     * @param blockSize (will be made odd)
     * @param C the subtraction parameter
     * @returns
     */
    public applyAdaptiveGaussianThresholding(blockSize: number, C: number): Image {
        if (blockSize % 2 == 0) {
            blockSize += 1;
        }
        return applyAdaptiveGaussianThresholding(this, blockSize, C);
    }

    public async applyPerspectiveTransformation(
        width: number,
        height: number,
        a: FinderCoordinate,
        b: FinderCoordinate,
        c: FinderCoordinate,
        d: FinderCoordinate,
        t1x: number,
        t1y: number,
        t2x: number,
        t2y: number,
        t3x: number,
        t3y: number,
        t4x: number,
        t4y: number
    ): Promise<Image> {
        return perspectiveTransform(this, width, height, ...a, ...b, ...c, ...d, t1x, t1y, t2x, t2y, t3x, t3y, t4x, t4y);
    }

    public drawSquareInPlace(x: number, y: number, width: number, height: number, color: string): Image {
        this.ctx.strokeStyle = color;
        this.ctx.strokeRect(x, y, width, height);

        return this;
    }

    public drawLineInPlace(x: number, y: number, x2: number, y2: number, color: string): Image {
        this.ctx.strokeStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();

        return this;
    }

    static async generateImage(base64encodedData: string): Promise<Image> {
        const img = new window.Image();
        const image = new Image();

        return new Promise((resolve, reject) => {
            img.onload = () => {
                // Set the canvas width and height to match the image's dimensions
                image.canvas.width = img.width;
                image.canvas.height = img.height;

                // Draw the base64 image on the canvas
                image.ctx.drawImage(img, 0, 0);

                resolve(image);
            };
            img.onerror = reject;
            img.src = base64encodedData;
        });
    }

    public copyImage(): Image {
        const newImage = new Image();

        newImage.canvas.width = this.canvas.width;
        newImage.canvas.height = this.canvas.height;

        newImage.ctx.drawImage(this.canvas, 0, 0);

        return newImage;
    }

    public getWidth() {
        return this.canvas.width;
    }

    public getHeight() {
        return this.canvas.height;
    }

    public generateDataURL(): string {
        return this.canvas.toDataURL("image/png");
    }
}
