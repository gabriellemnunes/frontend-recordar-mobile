const Module = require("node:module"),
  fs = require("node:fs"),
  path = require("node:path"),
  babel = require("@babel/core");
const React = require("react");
const runtime = {
  storage: new Map(),
  notifications: new Map(),
  listeners: new Set(),
  granted: true,
  speech: [],
  speechStops: 0,
};
module.exports = runtime;
global.IS_REACT_ACT_ENVIRONMENT = true;
const original = Module._load;
Module._load = function (name, parent, isMain) {
  if (name === "react-native-svg")
    return {
      __esModule: true,
      default: "Svg",
      SvgXml: "SvgXml",
      Path: "Path",
      Defs: "Defs",
      LinearGradient: "LinearGradient",
      Stop: "Stop",
      Rect: "Rect",
    };
  if (name === "react-native")
    return {
      View: "View",
      Image: "Image",
      Text: "Text",
      TextInput: "TextInput",
      Pressable: "Pressable",
      ScrollView: "ScrollView",
      Modal: ({ visible, children }) =>
        visible ? React.createElement("Modal", null, children) : null,
      ActivityIndicator: "ActivityIndicator",
      StyleSheet: { create: (x) => x, flatten: (x) => x },
      Platform: { OS: "android" },
      AppState: {
        addEventListener: (event, listener) => {
          runtime.listeners.add(listener);
          return {
            remove() {
              runtime.listeners.delete(listener);
            },
          };
        },
      },
      BackHandler: { addEventListener: () => ({ remove() {} }) },
    };
  if (name === "react-native-safe-area-context")
    return {
      SafeAreaView: "SafeAreaView",
      SafeAreaProvider: "SafeAreaProvider",
    };
  if (name === "@react-native-async-storage/async-storage")
    return {
      getItem: async (key) => runtime.storage.get(key) || null,
      setItem: async (key, value) => {
        runtime.storage.set(key, value);
      },
      removeItem: async (key) => {
        runtime.storage.delete(key);
      },
    };
  if (name === "@react-native-community/datetimepicker")
    return "DateTimePicker";
  if (name === "expo-speech")
    return {
      stop: async () => {
        runtime.speechStops++;
      },
      speak: (text, options) => runtime.speech.push({ text, options }),
    };
  if (name === "expo-notifications")
    return {
      setNotificationHandler() {},
      getAllScheduledNotificationsAsync: async () =>
        [...runtime.notifications.keys()].map((identifier) => ({ identifier })),
      cancelScheduledNotificationAsync: async (id) => {
        runtime.notifications.delete(id);
      },
      getPermissionsAsync: async () => ({ granted: runtime.granted }),
      requestPermissionsAsync: async () => ({ granted: runtime.granted }),
      setNotificationChannelAsync: async () => {},
      scheduleNotificationAsync: async (item) => {
        runtime.notifications.set(item.identifier, item);
        return item.identifier;
      },
      SchedulableTriggerInputTypes: { DATE: "date" },
      AndroidImportance: { HIGH: 4 },
    };
  if (name === "expo-secure-store")
    return {
      getItemAsync: async () => null,
      setItemAsync: async () => {},
      deleteItemAsync: async () => {},
    };
  return original.call(this, name, parent, isMain);
};
const ext = Module._extensions[".js"];
Module._extensions[".js"] = function (mod, file) {
  if (file.startsWith(path.resolve(__dirname, "../src"))) {
    const out = babel.transformSync(fs.readFileSync(file, "utf8"), {
      filename: file,
      configFile: false,
      babelrc: false,
      plugins: [
        "@babel/plugin-transform-react-jsx",
        "@babel/plugin-transform-modules-commonjs",
      ],
    });
    mod._compile(out.code, file);
  } else ext(mod, file);
};

Module._extensions[".png"] = (mod) => {
  mod.exports = 1;
};
