// vite.config.js

import { defineConfig } from "vite";
import olovaPlugin from "./vite-plugin-olova";

export default defineConfig({
  plugins: [olovaPlugin()],
});
