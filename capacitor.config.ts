import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.fieldchat.notes",
  appName: "Messages",
  webDir: "dist",
  server: {
    androidScheme: "https"
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 900,
      backgroundColor: "#111827",
      showSpinner: false
    },
    Camera: {
      permissions: ["camera"]
    },
    Geolocation: {
      permissions: ["location"]
    }
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false
  }
};

export default config;
