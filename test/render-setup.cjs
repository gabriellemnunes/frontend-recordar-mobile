const Module = require("node:module"),
  fs = require("node:fs"),
  path = require("node:path"),
  babel = require("@babel/core");
const React = require("react");
global.IS_REACT_ACT_ENVIRONMENT = true;
const original = Module._load;
Module._load = function (name, parent, isMain) {
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
      AppState: { addEventListener: () => ({ remove() {} }) },
      BackHandler: { addEventListener: () => ({ remove() {} }) },
    };
  if (name === "react-native-safe-area-context")
    return {
      SafeAreaView: "SafeAreaView",
      SafeAreaProvider: "SafeAreaProvider",
    };
  if (name === "@react-native-async-storage/async-storage")
    return {
      getItem: async () => null,
      setItem: async () => {},
      removeItem: async () => {},
    };
  if (name === "@react-native-community/datetimepicker")
    return "DateTimePicker";
  if (name === "expo-speech") return { stop: async () => {}, speak: () => {} };
  if (name === "expo-notifications")
    return {
      setNotificationHandler() {},
      getAllScheduledNotificationsAsync: async () => [],
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
