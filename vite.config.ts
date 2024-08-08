// vite.config.js
import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig((props) => {
    let env = loadEnv(props.mode, process.cwd(), "VITE_");

    const envWithProcessPrefix = {
        "process.env": `${JSON.stringify(env)}`,
    };

    return {
        // Configuration options
        base: "/qr-code-decoder/",
        define: envWithProcessPrefix,
        server: {
            port: 9999,
        },
        plugins: [
            vue(),
            VitePWA({
                registerType: "autoUpdate",
                devOptions: {
                    enabled: true,
                },
                includeAssets: [
                    "favicon.ico",
                    "assets/favicons/apple-touch-icon.png",
                    "assets/favicons/favicon-16x16.png",
                    "assets/favicons/favicon-32x32.png",
                    "assets/favicons/safari-pinned-tab.svg",
                ],
                manifest: {
                    name: "QR Code Decoder",
                    id: "qr-code-decoder-explanation",
                    theme_color: "#1976d2",
                    background_color: "#fafafa",
                    display: "standalone",
                    icons: [
                        {
                            src: "assets/icons/icon-72x72.png",
                            sizes: "72x72",
                            type: "image/png",
                            purpose: "maskable any",
                        },
                        {
                            src: "assets/icons/icon-96x96.png",
                            sizes: "96x96",
                            type: "image/png",
                            purpose: "maskable any",
                        },
                        {
                            src: "assets/icons/icon-128x128.png",
                            sizes: "128x128",
                            type: "image/png",
                            purpose: "maskable any",
                        },
                        {
                            src: "assets/icons/icon-144x144.png",
                            sizes: "144x144",
                            type: "image/png",
                            purpose: "maskable any",
                        },
                        {
                            src: "assets/icons/icon-152x152.png",
                            sizes: "152x152",
                            type: "image/png",
                            purpose: "maskable any",
                        },
                        {
                            src: "assets/icons/icon-192x192.png",
                            sizes: "192x192",
                            type: "image/png",
                            purpose: "maskable any",
                        },
                        {
                            src: "assets/icons/icon-384x384.png",
                            sizes: "384x384",
                            type: "image/png",
                            purpose: "maskable any",
                        },
                        {
                            src: "assets/icons/icon-512x512.png",
                            sizes: "512x512",
                            type: "image/png",
                            purpose: "maskable any",
                        },
                    ],
                },
            }),
        ],
    };
});
