/** @type {import('expo/config').ExpoConfig} */
const domain = process.env.REPLIT_DEV_DOMAIN;
const origin = domain ? `https://${domain}` : "https://replit.com/";

module.exports = {
  expo: {
    name: "Ryzer",
    slug: "ryzer",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "ryzer-app",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/icon.png",
      resizeMode: "contain",
      backgroundColor: "#f1f5f9",
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.ryzer.app",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/icon.png",
        backgroundColor: "#f1f5f9",
      },
      package: "com.ryzer.app",
    },
    web: {
      favicon: "./assets/images/icon.png",
    },
    plugins: [
      [
        "expo-router",
        {
          origin,
        },
      ],
      "expo-font",
      "expo-web-browser",
      [
        "expo-build-properties",
        {
          android: {
            packagingOptions: {
              exclude: ["META-INF/versions/9/OSGI-INF/MANIFEST.MF"],
            },
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      eas: {
        projectId: "506e06ba-a36e-49b9-8137-72634353f0fa",
      },
    },
  },
};
