import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CoLiv 合租管家",
    short_name: "CoLiv",
    description: "合租清洁轮值、公共物品、费用分摊与维修管理",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#22c55e",
    icons: [],
  };
}
