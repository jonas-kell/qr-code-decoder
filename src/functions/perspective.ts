import { Image } from "./image";
import * as fx from "glfx";

// https://evanw.github.io/glfx.js/

export async function perspectiveTransform(
    image: Image,
    width: number,
    height: number,
    s1x: number,
    s1y: number,
    s2x: number,
    s2y: number,
    s3x: number,
    s3y: number,
    s4x: number,
    s4y: number,
    t1x: number,
    t1y: number,
    t2x: number,
    t2y: number,
    t3x: number,
    t3y: number,
    t4x: number,
    t4y: number
): Promise<Image> {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            return reject(new Error("Failed to get canvas 2D context"));
        }

        const imgElement = new window.Image();
        imgElement.src = image.generateDataURL();
        imgElement.onload = () => {
            canvas.width = width;
            canvas.height = height;

            const fxCanvas = (fx as any).canvas();
            const fxTexture = fxCanvas.texture(imgElement);

            fxCanvas
                .draw(fxTexture)
                .perspective([s1x, s1y, s2x, s2y, s3x, s3y, s4x, s4y], [t1x, t1y, t2x, t2y, t3x, t3y, t4x, t4y])
                .update();

            ctx.drawImage(fxCanvas, 0, 0); // TODO one copy could be avoided here

            resolve(Image.generateImage(canvas.toDataURL()));
        };

        imgElement.onerror = (_) => {
            reject(new Error("Failed to load the original image"));
        };
    });
}
