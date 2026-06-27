import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/BMO.tsx'],
  format: ['esm', 'cjs'],
  dts: true,
  external: ['react', 'react-dom'],
  clean: true,
});
