import { Image } from "./image";

// editors to potentially debug shaders (semi helpful)
//     https://thebookofshaders.com/edit.php
//     https://glsl.app/

export function blur(image: Image, radius: number) {
    const fragmentShaderSource = `
        precision mediump float;
        uniform sampler2D u_texture;
        uniform vec2 u_resolution;
        varying vec2 v_texcoord;

        void main() {
            const int radius = ${radius};

            vec4 color = vec4(0.0);
            float total = 0.0;
            for (int y = -radius; y <= radius; y++) {
                for (int x = -radius; x <= radius; x++) {
                    vec2 offset = vec2(x, y) / u_resolution;
                    color += texture2D(u_texture, v_texcoord + offset);
                    total += 1.0;
                }
            }
            
            gl_FragColor = color * (1.0 / total);
        }
    `;

    return webGlShaderComputation2d(image, fragmentShaderSource);
}

/**
 * @param blockSize must be odd!!!
 * @param C the subtraction parameter
 * @returns
 */
export function applyAdaptiveGaussianThresholding(image: Image, blockSize: number, C: number): Image {
    const halfBlockSize = Math.floor(blockSize / 2);

    const fragmentShaderSource = `
        precision mediump float;
        uniform sampler2D u_texture;
        uniform vec2 u_resolution;
        varying vec2 v_texcoord;

        void main() {
            const int halfBlockSize = ${halfBlockSize};

            float sum = 0.0;
            float sumSq = 0.0;
            float count = 0.0;
            for (int dy = -halfBlockSize; dy <= halfBlockSize; dy++) {
                for (int dx = -halfBlockSize; dx <= halfBlockSize; dx++) {
                    vec2 offset = vec2(dx, dy) / u_resolution;
                    float value = texture2D(u_texture, v_texcoord + offset).r; // assumes gray-scale image, so take red channel (...[0] also works)
                    sum += value;
                    sumSq += value * value;
                    count++;
                }
            }

            float mean = sum / count;
            float variance = sumSq / count - mean * mean;
            float stdDev = sqrt(variance);

            float threshold = mean - ${C.toFixed(3)} * stdDev;
            float value = texture2D(u_texture, v_texcoord).r;
            
            if (value >= threshold) {
                gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); // white
            } else {
                gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); // black
            }
        }
    `;

    return webGlShaderComputation2d(image, fragmentShaderSource);
}

export function cameraProjection(image: Image, xOffset: number, yOffset: number): Image {
    const vertexShaderSource = `
        attribute vec2 a_position;
        attribute vec2 a_texcoord;
        varying vec2 v_texcoord;
        
        void main() {
            gl_Position = vec4(a_position[0] + ${xOffset.toFixed(3)}, a_position[1] + ${yOffset.toFixed(3)}, 0.0, 1.0);
            v_texcoord = a_texcoord;
        }
    `;

    const fragmentShaderSource = `
        precision mediump float;
        uniform sampler2D u_texture;
        uniform vec2 u_resolution;
        varying vec2 v_texcoord;

        void main() {
            gl_FragColor = texture2D(u_texture, v_texcoord);
        }
    `;

    return webGlShaderComputation(image, vertexShaderSource, fragmentShaderSource);
}

function webGlShaderComputation2d(image: Image, fragmentShaderSource: string): Image {
    const vertexShaderSource = `
        attribute vec2 a_position;
        attribute vec2 a_texcoord;
        varying vec2 v_texcoord;
        
        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
            v_texcoord = a_texcoord;
        }
    `;

    return webGlShaderComputation(image, vertexShaderSource, fragmentShaderSource);
}

function webGlShaderComputation(image: Image, vertexShaderSource: string, fragmentShaderSource: string): Image {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl");
    if (!gl) {
        throw Error("No webgl context");
    }
    const width = image.getWidth();
    const height = image.getHeight();

    canvas.width = width;
    canvas.height = height;

    function compileShader(gl: WebGLRenderingContext, source: string, type: number) {
        const shader = gl.createShader(type);
        if (!shader) {
            throw Error("Shader could not be created");
        }
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const errorlog = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw Error(`Shader compilation error: ${errorlog}`);
        }
        return shader;
    }

    function createProgram(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string) {
        const vertexShader = compileShader(gl, vertexSource, gl.VERTEX_SHADER);
        const fragmentShader = compileShader(gl, fragmentSource, gl.FRAGMENT_SHADER);
        const program = gl.createProgram();
        if (!program) {
            throw Error("Program could not be created");
        }
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const errorlog = gl.getProgramInfoLog(program);
            gl.deleteProgram(program);
            throw Error(`Program link error: ${errorlog}`);
        }
        return program;
    }

    function createTexture(gl: WebGLRenderingContext, width: number, height: number, data: Uint8Array) {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        // set these, because our textures are no powers of 2 !!!
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        return texture;
    }

    function createFramebuffer(gl: WebGLRenderingContext) {
        const framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        return framebuffer;
    }

    // Set up shaders and program
    const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    gl.useProgram(program);

    // Set up vertices and texture coordinates
    const vertices = new Float32Array([-1, -1, 0, 0, 1, -1, 1, 0, -1, 1, 0, 1, 1, 1, 1, 1]);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    const texcoordLocation = gl.getAttribLocation(program, "a_texcoord");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const textureLocation = gl.getUniformLocation(program, "u_texture");

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 16, 0);

    gl.enableVertexAttribArray(texcoordLocation);
    gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 16, 8);

    // Create texture
    const data = image.getImageData();
    const texture = createTexture(gl, data.width, data.height, new Uint8Array(data.data));

    // Render to framebuffer
    const framebuffer = createFramebuffer(gl);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.viewport(0, 0, width, height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.uniform2f(resolutionLocation, width, height);
    gl.uniform1i(textureLocation, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Read pixels from framebuffer
    const newImageData = new Uint8ClampedArray(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, newImageData);

    const newImage = image.copyImage();
    newImage.putImageData(new ImageData(newImageData, width, height), 0, 0);

    return newImage;
}
