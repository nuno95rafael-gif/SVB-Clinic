import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SVB Clinic",
    short_name: "SVB Clinic",
    description: "Gestão clínica — SVB Clinic",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0d7a68",
    icons: [{ src: "/logo-svb-icon.png", sizes: "any", type: "image/png" }],
  };
}
