import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.genial.trueke',
  appName: 'Trueke',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff", // Cámbialo si tu fondo no es blanco
      androidScaleType: "CENTER_CROP", // ESTA ES LA CLAVE: Estira la imagen para cubrir toda la pantalla sin bordes negros
      splashFullScreen: true,
      splashImmersive: true,
      showSpinner: false
    }
  }
};

export default config;
