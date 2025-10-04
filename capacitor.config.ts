import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.kedir.kflix',
  appName: 'K-flix',
  webDir: 'dist',
  server: {
    url: 'https://k-flix.netlify.app',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
