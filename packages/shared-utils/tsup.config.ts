import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    auth: "src/auth/index.ts", 
    services: "src/services/index.ts",
    utils: "src/utils/index.ts"
  },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ["react", "react-dom", "@supabase/supabase-js", "sonner"]
});
