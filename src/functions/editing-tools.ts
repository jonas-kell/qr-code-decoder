import { Image } from "./types";

let ctx: CanvasRenderingContext2D;
let canvas: HTMLCanvasElement;

function drawSquare(image: Image, x: number, y: number, width: number, height: number, color: string): Image {
    const img = new window.Image();

    img.onload = () => {
        // Set the canvas width and height to match the image's dimensions
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw the base64 image on the canvas
        ctx.drawImage(img, 0, 0);

        // Set the fill color and draw the square on the canvas
        ctx.fillStyle = color;
        ctx.fillRect(x, y, width, height);
    };
    img.src = image;

    return canvas.toDataURL("image/png");
}

export default function useEditingTools() {
    const liveCanvas = document.getElementById("editing-canvas") as HTMLCanvasElement;

    if (!liveCanvas) {
        throw Error("No editing canvas with proper id 'editing-canvas' in dom");
    }

    canvas = liveCanvas;

    const liveContext = canvas.getContext("2d");

    if (!liveContext) {
        throw Error("Editing canvas with id 'editing-canvas' is not capable");
    }

    ctx = liveContext;

    return { drawSquare };
}
