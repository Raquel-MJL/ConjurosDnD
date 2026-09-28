import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // rutas relativas: la app funciona tanto en la raíz de un dominio como en una subcarpeta
});
