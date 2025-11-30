import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    port: 3000,
    open: '/login.html',
    host: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: './main.html',
        login: './login.html',
        signup: './signup.html',
        index: './index.html',
        collab: './collab.html'
      }
    }
  }
});

