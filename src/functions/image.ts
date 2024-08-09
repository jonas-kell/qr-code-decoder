export type DataPointStruct = number[][][]; // width x height x 3

export class Image {
    public width: number;
    public height: number;

    private data: DataPointStruct;

    private constructor(dataPointStruct: DataPointStruct) {
        this.data = dataPointStruct;

        this.width = this.data.length;
        this.height = this.data[0].length ?? 0;
    }

    private static getCanvasAndCtx() {
        const canvas: HTMLCanvasElement = document.createElement("canvas");
        const ctx: CanvasRenderingContext2D | null = canvas.getContext("2d");

        if (!ctx) {
            throw Error("Editing canvas had no context...");
        }

        return {
            canvas,
            ctx,
        };
    }

    public drawSquare(x: number, y: number, width: number, height: number, color: string): Image {
        return this;
    }

    static async generateImage(base64encodedData: string): Promise<Image> {
        const img = new window.Image();

        return new Promise((resolve, reject) => {
            img.onload = () => {
                const { canvas, ctx } = Image.getCanvasAndCtx();

                // Set the canvas width and height to match the image's dimensions
                canvas.width = img.width;
                canvas.height = img.height;

                // Draw the base64 image on the canvas
                ctx.drawImage(img, 0, 0);

                // Get image data
                const imageData = ctx.getImageData(0, 0, img.width, img.height);

                // Convert to number array
                const pixelArray: DataPointStruct = [];
                let i = 0;
                for (let x = 0; x < img.width; x++) {
                    pixelArray.push([]);
                    for (let y = 0; y < img.height; y++) {
                        const r = imageData.data[i];
                        const g = imageData.data[i + 1];
                        const b = imageData.data[i + 2];

                        pixelArray[x].push([r, g, b]);

                        i += 4; // r,g,b,a
                    }
                }

                resolve(new Image(pixelArray));
            };
            img.onerror = reject;
            img.src = base64encodedData;
        });
    }

    async generateDataURL(): Promise<string> {
        return new Promise((resolve, _) => {
            const { canvas, ctx } = Image.getCanvasAndCtx();

            // Set the canvas width and height to match the image's dimensions
            canvas.width = this.width;
            canvas.height = this.height;

            // Convert to number array
            for (let x = 0; x < this.width; x++) {
                for (let y = 0; y < this.height; y++) {
                    const pixel = this.data[x][y];
                    const r = pixel[0];
                    const g = pixel[1];
                    const b = pixel[2];

                    const imageData = ctx.createImageData(1, 1); // Create a 1x1 pixel ImageData object
                    const data = imageData.data; // Get the pixel data array (4 elements: r, g, b, a)

                    // Set the color values
                    data[0] = r; // Red
                    data[1] = g; // Green
                    data[2] = b; // Blue
                    data[3] = 1; // Alpha (opacity)

                    // Draw the pixel on the canvas at the desired position
                    ctx.putImageData(imageData, x, y);
                }
            }

            resolve(canvas.toDataURL("image/png"));
        });
    }
}
