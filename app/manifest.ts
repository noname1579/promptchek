// app/manifest.ts
import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Promptchek",
    short_name: "Promptchek",
    description: "Платформа для улучшения AI-промптов",
    start_url: "/",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#020617",
    icons: [
      {
        src: "/icon.svg", // Используем SVG, который мы создали в папке app
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}