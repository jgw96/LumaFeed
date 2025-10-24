import { defineConfig, type PluginOption, type HtmlTagDescriptor } from 'vite';
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
        // Disable precache manifest injection - we're using runtime caching instead
        injectionPoint: undefined,
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

  // Plugin to inject explicit modulepreload links for critical chunks
  plugins.push({
    name: 'inject-modulepreload',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const tags: HtmlTagDescriptor[] = [];
        
        // Find critical chunks from the bundle
        if (ctx.bundle) {
          for (const [fileName, chunk] of Object.entries(ctx.bundle)) {
            if (chunk.type === 'chunk') {
              if (
                fileName.includes('vendor-lit') ||
                fileName.includes('app-root') ||
                fileName.includes('home-page') ||
                fileName.includes('feeding-storage') ||
                fileName.includes('app-intro') || 
                fileName.includes('base-modal-dialog')
              ) {
                tags.push({
                  tag: 'link',
                  attrs: {
                    rel: 'modulepreload',
                    crossorigin: true,
                    href: `/${fileName}`,
                  },
                  injectTo: 'head-prepend', // Inject at the top of <head> for earlier discovery
                });
              }
            }
          }
        }
        
        return tags;
      },
    },
  });

  // Plugin to minify CSS in Lit component tagged templates
  plugins.push({
    name: 'minify-lit-css',
    enforce: 'pre',
    transform(code, id) {
      // Only process TypeScript/JavaScript files
      if (!/\.(ts|js|tsx|jsx)$/.test(id)) return null;
      
      // Only process files that likely contain Lit css`` templates
      if (!code.includes('.styles') && !code.includes('css`')) return null;
      
      // Minify CSS inside css`` tagged templates
      const minified = code.replace(/css`([\s\S]*?)`/g, (match, css) => {
        const minifiedCss = css
          .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
          .replace(/\n\s*/g, '') // Remove newlines and leading whitespace
          .replace(/\s*([{}:;,])\s*/g, '$1') // Remove whitespace around CSS syntax
          .replace(/;\}/g, '}') // Remove last semicolon before closing brace
          .replace(/\s+/g, ' ') // Collapse multiple spaces
          .trim();
        return `css\`${minifiedCss}\``;
      });
      
      if (minified !== code) {
        return { code: minified, map: null };
      }
      
      return null;
    },
  });

  // Plugin to minify HTML
  plugins.push({
    name: 'html-minifier',
    enforce: 'post',
    transformIndexHtml(html) {
      // Minify CSS inside <style> tags
      html = html.replace(/<style>([\s\S]*?)<\/style>/g, (match, css) => {
        const minifiedCss = css
          .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
          .replace(/\n\s*/g, '') // Remove newlines and leading whitespace
          .replace(/\s*([{}:;,])\s*/g, '$1') // Remove whitespace around CSS syntax
          .replace(/;\}/g, '}') // Remove last semicolon before closing brace
          .replace(/\s+/g, ' ') // Collapse multiple spaces
          .trim();
        return `<style>${minifiedCss}</style>`;
      });

      // Minify HTML structure
      return html
        .replace(/\n\s+/g, '\n') // Remove leading whitespace
        .replace(/\n+/g, '\n') // Collapse multiple newlines
        .replace(/>\s+</g, '><') // Remove whitespace between tags
        .replace(/\s{2,}/g, ' ') // Collapse multiple spaces
        .trim();
    },
  });

  return {
    plugins,
    build: {
      target: 'esnext',
      minify: 'terser',
      // Minify HTML to reduce initial payload size
      minifyHtml: true,
      terserOptions: {
        module: true,
        compress: {
          drop_console: true,
          drop_debugger: true,
          passes: 2,
          arrows: true,
          booleans_as_integers: true,
          collapse_vars: true,
          comparisons: true,
          dead_code: true,
          hoist_vars: false,
          inline: 3,
          unsafe: false,
          unsafe_arrows: false,
          unsafe_Function: false,
          unsafe_methods: false,
          unsafe_proto: false,
          unsafe_regexp: false,
          unsafe_undefined: false,
        },
        mangle: {
          safari10: true,
        },
        format: {
          comments: false,
        },
        keep_classnames: false,
        keep_fnames: false,
      },
      // Ensure parallel fetching of dependent chunks across browsers
      modulePreload: { 
        polyfill: true,
      },
      // Create a dedicated vendor chunk for lit so it can be fetched in parallel
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('/node_modules/lit') || id.includes('/node_modules/@lit')) {
              return 'vendor-lit';
            }
            return undefined;
          },
        },
      },
    },
  };
});
