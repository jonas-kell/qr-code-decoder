export type DataPointStruct = number[][][]; // width x height x 3

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

    public drawSquare(x: number, y: number, width: number, height: number, color: string): Image {
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

    public getWidth() {
        return this.canvas.width;
    }

    public getHeight() {
        return this.canvas.height;
    }

    generateDataURL(): string {
        return this.canvas.toDataURL("image/png");
    }
}
