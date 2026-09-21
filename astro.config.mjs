import { defineConfig } from 'astro/config';

// Static, content-led portfolio. One WebGL surface (the S1 stackup in the
// Home hero) is the only hydrated island; everything else ships as real HTML.
export default defineConfig({
  site: 'https://himanshugautam.world',
  output: 'static',
  build: { inlineStylesheets: 'auto' },
  devToolbar: { enabled: false }
});
