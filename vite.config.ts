import { defineConfig, type PluginOption } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const plugins: PluginOption[] = [
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'service-worker.ts',
      injectRegister: null,
      manifest: false,
      devOptions: {
        enabled: true,
        type: 'module',
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        rollupFormat: 'es',
      },
      useCredentials: false,
    }),
  ];

  if (mode === 'analyze') {
    plugins.push(
      visualizer({
        filename: 'bundle-analysis.html',
        template: 'treemap',
        gzipSize: true,
        brotliSize: true,
        open: true,
      })
    );
  }

  return {
    plugins,
    build: {
      target: 'esnext',
    },
  };
});
