import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    port: 3000,
    open: '/landingPage.html',
    host: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        index: './index.html',
        landing: './landingPage.html',
        main: './main.html',
        login: './login.html',
        signup: './signup.html',
        collab: './collab.html'
      }
    }
  }
});

