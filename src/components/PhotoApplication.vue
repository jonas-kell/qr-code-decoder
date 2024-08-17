<script setup lang="ts">
    import { VRow } from "vuetify/components";
    import { computed, onMounted, onUnmounted, ref, watch } from "vue";
    import { Image } from "../functions/image";

    function removePhoto() {
        heldImageUrl.value = null;
        heldImageInfo.value = "";
    }

    const props = defineProps<{
        takePhoto: boolean;
    }>();
    const emit = defineEmits<{
        frameTaken: [Image];
    }>();

    watch(
        props,
        async (now) => {
            if (now.takePhoto) {
                console.log("Externally triggered taking photo");
                const image = (await takePicture()).image;
                emit("frameTaken", image);
                heldImageInfo.value = image.getImageMetaText();
            }
        },
        {
            deep: true,
            immediate: true,
        }
    );

    // !!! CAMERA

    const storageKey = "signupCameraRotation";
    let stream = null as MediaStream | null;

    const heldImageUrl = ref(null as null | string);
    const hasImage = computed(() => {
        return heldImageUrl.value != null && heldImageUrl.value.length > 50;
    });
    const heldImageInfo = ref("");

    const hasCamera = ref(false);

    const facingMode = ref((localStorage.getItem(storageKey) ?? "environment") as "environment" | "user");

    // Access the user's camera
    async function initCamera() {
        console.log("Initializing Camera");
        hasCamera.value = false;
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: facingMode.value,
                },
            });
            const video = document.getElementById("video") as HTMLVideoElement;
            if (video != null) {
                video.srcObject = stream;
                console.log(stream.getVideoTracks()[0].getSettings()); // print media information
            } else {
                console.log("Did not find Video HTML element");
            }

            hasCamera.value = true;
        } catch (err) {
            console.error("Error accessing the camera:", err);
            hasCamera.value = false;
        }
    }

    // Take a picture
    async function takePicture(): Promise<{ url: string; image: Image }> {
        const canvas = document.getElementById("canvas") as HTMLCanvasElement;
        const video = document.getElementById("video") as HTMLVideoElement;
        const context = canvas.getContext("2d");
        // Set canvas dimensions to the same as the video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        // Draw the current frame of the video onto the canvas
        context?.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Get the image data from the canvas as a base64-encoded PNG
        const imageData = canvas.toDataURL("image/png");

        return { url: imageData, image: await Image.generateImage(imageData) };
    }

    // Lock picture
    async function takeAndLockPicture() {
        console.log("Camera Button used to hold picture");
        const data = await takePicture();

        heldImageUrl.value = data.url;
        heldImageInfo.value = data.image.getImageMetaText();
        emit("frameTaken", data.image);
    }

    // Toggle the direction of the camera
    function toggleCameraFaceingness() {
        if (facingMode.value == "environment") {
            facingMode.value = "user";
        } else {
            facingMode.value = "environment";
        }
        console.log("toggled to facing " + facingMode.value);
        localStorage.setItem(storageKey, facingMode.value);

        initCamera();
    }

    async function fileUploadDialog() {
        return new Promise<string>((resolve, reject) => {
            const fileInput = document.createElement("input");
            fileInput.type = "file";
            fileInput.accept = "image/*";
            fileInput.multiple = false;

            // Function to handle file selection
            const handleFileSelection = (event: Event) => {
                const input = event.target as HTMLInputElement;
                if (input.files && input.files[0]) {
                    const file = input.files[0];

                    const reader = new FileReader();

                    reader.onload = () => {
                        if (reader.result) {
                            // Clean up by removing the file input element
                            document.getElementById("file_reader_target")?.removeChild(fileInput);

                            resolve(reader.result as string);
                        } else {
                            reject(new Error("Could not read file"));
                        }
                    };

                    reader.onerror = () => {
                        console.error("File reading failed");
                        reject(new Error("File reading failed"));
                    };

                    reader.readAsDataURL(file);
                } else {
                    console.error("File reader didn't work");
                    reject(new Error("File reader didn't work"));
                }
            };

            fileInput.addEventListener("change", handleFileSelection);

            // Append file input to the body and trigger click
            document.getElementById("file_reader_target")?.appendChild(fileInput);
            fileInput.click();
        });
    }

    async function handleFileSelection() {
        console.log("Upload Button used to hold picture");
        const dataURL = await fileUploadDialog();
        const image = await Image.generateImage(dataURL);

        heldImageUrl.value = dataURL;
        heldImageInfo.value = image.getImageMetaText();
        emit("frameTaken", image);
    }

    const tabTransferKey = "analyzeTabImageTransferKey";
    async function getFromAnalyzationCache() {
        const url = sessionStorage.getItem(tabTransferKey);

        if (url) {
            // found something
            sessionStorage.removeItem(tabTransferKey);

            console.log("Picture taken from analyzation storage");
            const image = await Image.generateImage(url);

            heldImageUrl.value = url;
            heldImageInfo.value = image.getImageMetaText();
            emit("frameTaken", image);
        }
    }

    onMounted(() => {
        initCamera();
        getFromAnalyzationCache();
    });
    onUnmounted(() => {
        if (stream) {
            stream.getTracks().forEach(function (track) {
                track.stop();
            });
        }
    });
</script>

<template>
    <div>
        <v-row justify="center">
            <v-row id="camera-button-container" class="v-col-12 v-col-xl-4 v-col-lg-6 v-col-md-8 v-col-sm-10 mt-3">
                <template v-if="hasImage">
                    <img id="image" :src="heldImageUrl ?? ''" class="v-col-12" />
                    <v-btn @click="removePhoto" icon="mdi-delete" id="abort-btn"> </v-btn>
                </template>

                <video
                    id="video"
                    class="v-col-12"
                    autoplay
                    :style="{ display: (!hasCamera || hasImage) ?? false ? 'none' : 'revert' }"
                    playsinline
                ></video>

                <template v-if="!hasImage">
                    <div class="v-col-12" id="video-replacement" v-if="!hasCamera">
                        <p class="mt-8">Kamera nicht verfügbar.</p>
                        <p>Eventuell fehlt die Freigabe / Berechtigung</p>
                    </div>
                    <button id="capture-btn" v-on:click="takeAndLockPicture"></button>
                    <v-btn id="reverse-btn" icon="mdi-camera-switch" v-on:click="toggleCameraFaceingness"></v-btn>
                    <v-btn id="upload-btn" icon="mdi-file-upload" v-on:click="handleFileSelection"></v-btn>
                </template>
            </v-row>
            <v-row class="v-col-12 ma-0 pa-0" justify="center" no-gutters>{{ heldImageInfo }}</v-row>
        </v-row>
        <canvas style="display: none" id="canvas"></canvas>
        <div style="display: none" id="file_reader_target"></div>
    </div>
</template>

<style scoped>
    #close-photo-mode {
        position: absolute;
        right: 2em;
        bottom: 1em;
    }
    #video {
        width: 100%;
    }
    #image {
        width: 100%;
    }
    #video-replacement {
        width: 100%;
        aspect-ratio: 1 / 1;
        background-color: gray;
    }
    #camera-button-container {
        position: relative;
    }
    #capture-btn {
        background-color: red;
        position: absolute;
        width: 4em;
        height: 4em;
        border-radius: 50%;
        border: 0.5em black solid;
        bottom: 2%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 10; /* Ensure the button is above the video */
    }
    #reverse-btn {
        position: absolute;
        bottom: 2%;
        right: 2%;
        transform: translate(-50%, -50%);
        z-index: 10;
    }
    #upload-btn {
        position: absolute;
        bottom: 2%;
        left: 2%;
        transform: translate(50%, -50%);
        z-index: 10;
        background-color: green;
    }
    #abort-btn {
        position: absolute;
        bottom: 2%;
        left: 50%;
        transform: translate(-50%, -50%);
    }
</style>
