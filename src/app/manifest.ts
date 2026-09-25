import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Elchi Market",
    short_name: "Elchi Market",
    description: "O‘zbekistondagi do‘konlarning mahsulotlari bitta joyda.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#e30613",
    lang: "uz",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
