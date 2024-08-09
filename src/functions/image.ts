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
        const copiedImage = this.copyImage();

        copiedImage.ctx.strokeStyle = color;
        copiedImage.ctx.strokeRect(x, y, width, height);

        return copiedImage;
    }

    public drawLine(x: number, y: number, x2: number, y2: number, color: string): Image {
        const copiedImage = this.copyImage();

        copiedImage.ctx.strokeStyle = color;
        copiedImage.ctx.beginPath();
        copiedImage.ctx.moveTo(x, y);
        copiedImage.ctx.lineTo(x2, y2);
        copiedImage.ctx.stroke();

        return copiedImage;
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

    private copyImage(): Image {
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

    generateDataURL(): string {
        return this.canvas.toDataURL("image/png");
    }
}
