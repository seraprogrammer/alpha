import { defineConfig } from "vite";

export default defineConfig({
  esbuild: {
    jsxFactory: "html",
    jsxFragment: "Fragment",
  },
});
