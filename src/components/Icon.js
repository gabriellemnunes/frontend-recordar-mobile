import React from "react";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";

const paths = {
  accessibility:
    "M14 4a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM3 8l9 2 9-2m-9 2v5m0 0-5 7m5-7 5 7",
  elder:
    "M5 8c0-7 14-7 14 0M5 8v4a7 7 0 0 0 14 0V8M4 7l3-2 2 1 3-2 3 2 2-1 3 2M6 10h4v3H6v-3Zm8 0h4v3h-4v-3Zm-4 1h4m-4 5c1 1 3 1 4 0M3 23v-1c0-4 4-5 9-5s9 1 9 5v1",
  care: "M20 5a5 5 0 0 0-8 1 5 5 0 0 0-8-1C0 9 4 15 12 21c8-6 12-12 8-16ZM5 12h4l2-4 3 8 2-4h3",
  stethoscope:
    "M4 3v5a5 5 0 0 0 10 0V3M2 3h4m6 0h4M9 13v3a5 5 0 0 0 10 0v-2m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z",
  lock: "M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5V10Zm7 5v2",
  speaker: "M11 4 6 8H3v8h3l5 4V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14",
  stop: "M5 5h14v14H5Z",
  camera: "M4 6h4l2-3h4l2 3h4v14H4V6Zm12 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  home: "M3 10 12 3l9 7M5 9v12h5v-7h4v7h5V9",
  calendar:
    "M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2ZM7 3v4m10-4v4M3 11h18M8 15h2m4 0h2m-8 3h2",
  pill: "M9 4a5 5 0 0 1 7 7l-5 5a5 5 0 0 1-7-7l5-5ZM7 6l7 7",
  user: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2",
  chat: "M21 11a9 9 0 0 1-9 9 10 10 0 0 1-4-1l-5 2 1-5a9 9 0 1 1 17-5ZM8 10h8m-8 4h5",
  history: "M3 4v5h5M3 9a9 9 0 1 1 0 6m9-9v6l4 2",
  check: "m7 12 3 3 7-7",
  sun: "M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1",
  moon: "M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z",
  text: "M3 5h12M9 5v15m7-8h6m-3 0v8",
  people:
    "M14 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM4 21v-3a6 6 0 0 1 12 0v3M17 5a3 3 0 0 1 0 6m2 4a5 5 0 0 1 2 4v2",
};

export default function Icon({ name, color = "#4f3fb8", size = 24 }) {
  return (
    <View
      accessible={false}
      aria-hidden={true}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size, flexShrink: 0 }}
    >
      <Svg
        accessible={false}
        aria-hidden={true}
        focusable={false}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
      >
        <Path
          d={paths[name] || paths.calendar}
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}
