import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Roundly",
    short_name: "Roundly",
    description: "Live golf scoring for every group",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f7fbf7",
    theme_color: "#1f6f43",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}