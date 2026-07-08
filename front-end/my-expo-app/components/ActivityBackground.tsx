import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function GradientOverlay() {
  return (
    <View style={StyleSheet.absoluteFill}>
      {/* linear-gradient(180deg, rgba(255,255,255,.075), rgba(255,255,255,.034)) */}
      <LinearGradient
        colors={[
          "rgba(255,255,255,0.075)",
          "rgba(255,255,255,0.034)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* linear-gradient(135deg, rgba(8,124,255,.08), transparent 42%) */}
      <LinearGradient
        colors={[
          "rgba(8,124,255,0.08)",
          "transparent",
          "transparent",
        ]}
        locations={[0, 0.42, 1]}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}



// react-native-svg version
// import { StyleSheet, View } from "react-native";
// import Svg, {
//   Defs,
//   LinearGradient,
//   Rect,
//   Stop,
// } from "react-native-svg";
//
// export default function GradientOverlay() {
//   return (
//     <View style={[StyleSheet.absoluteFill, { boxShadow: '0 14px 35px rgba(0,0,0,.22)' }]}>
//       <Svg width="100%" height="100%">
//         <Defs>
//           {/* First CSS gradient:
//               linear-gradient(180deg, rgba(255,255,255,.075), rgba(255,255,255,.034))
//           */}
//           <LinearGradient
//             id="whiteOverlay"
//             x1="0"
//             y1="0"
//             x2="0"
//             y2="1"
//           >
//             <Stop
//               offset="0%"
//               stopColor="rgba(255,255,255,0.075)"
//             />
//             <Stop
//               offset="100%"
//               stopColor="rgba(255,255,255,0.034)"
//             />
//           </LinearGradient>
//
//           {/* Second CSS gradient:
//               linear-gradient(135deg, rgba(8,124,255,.08), transparent 42%)
//           */}
//           <LinearGradient
//             id="blueGlow"
//             x1="0"
//             y1="0"
//             x2="1"
//             y2="1"
//           >
//             <Stop
//               offset="0%"
//               stopColor="rgba(8,124,255,0.08)"
//             />
//             <Stop
//               offset="42%"
//               stopColor="rgba(8,124,255,0)"
//             />
//             <Stop
//               offset="100%"
//               stopColor="rgba(8,124,255,0)"
//             />
//           </LinearGradient>
//         </Defs>
//
//         {/* Base white gradient */}
//         <Rect
//           width="100%"
//           height="100%"
//           fill="url(#whiteOverlay)"
//         />
//
//         {/* Blue diagonal glow */}
//         <Rect
//           width="100%"
//           height="100%"
//           fill="url(#blueGlow)"
//         />
//       </Svg>
//     </View>
//   );
// }
//
