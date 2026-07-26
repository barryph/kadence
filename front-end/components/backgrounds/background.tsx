import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface IProps {
  showRed?: boolean;
}

/**
 * TODO: The greatest background gradient we MUST convert one day
 *
    backgroundColor: `
        radial-gradient(circle at 20% -10%, rgba(8,124,255,.28), transparent 34rem),
        radial-gradient(circle at 95% 12%, rgba(8,216,255,.16), transparent 26rem),
        radial-gradient(circle at 70% 100%, rgba(255,61,84,.12), transparent 28rem),
        linear-gradient(180deg,#050711 0%,#0b1020 46%,#050711 100%);
     `,
    backgroundAttachment: 'fixed',
 */

export default function Background({ showRed = true }: IProps) {
  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Base background */}
      <LinearGradient
        colors={['#050711', '#0b1020', '#050711']}
        locations={[0, 0.46, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Blue top-left glow */}
      <LinearGradient
        colors={['rgba(8,124,255,0.28)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, styles.blueGlow]}
      />

      {/* Cyan top-right glow */}
      <LinearGradient
        colors={['rgba(8,216,255,0.16)', 'transparent']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[StyleSheet.absoluteFill, styles.cyanGlow]}
      />

      {/* Red bottom glow */}
      <LinearGradient
        colors={['transparent', 'rgba(255,61,84,0.12)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          StyleSheet.absoluteFill,
          styles.redGlow,
          !showRed && { opacity: 0 },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  blueGlow: {
    opacity: 0.9,
  },
  cyanGlow: {
    opacity: 0.8,
  },
  redGlow: {
    opacity: 0.8,
  },
});

// react-native-svg version
// import React from 'react';
// import { StyleSheet, Dimensions } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import Svg, { Defs, RadialGradient as SvgRadialGradient, Stop, Rect } from 'react-native-svg';
//
// const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
// const REM = 16;
// export default function BackgroundGradient({ children }) {
//   return (
//     <LinearGradient
//       colors={['#050711', '#0b1020', '#050711']}
//       locations={[0, 0.46, 1]}
//       style={StyleSheet.absoluteFill}
//     >
//       <Svg style={StyleSheet.absoluteFill} width={SCREEN_W} height={SCREEN_H}>
//         <Defs>
//           <SvgRadialGradient id="glow1" gradientUnits="userSpaceOnUse" cx={SCREEN_W * 0.2} cy={SCREEN_H * -0.1} r={34 * REM}>
//             <Stop offset="0" stopColor="#087cff" stopOpacity="0.28" />
//             <Stop offset="1" stopColor="#087cff" stopOpacity="0" />
//           </SvgRadialGradient>
//           <SvgRadialGradient id="glow2" gradientUnits="userSpaceOnUse" cx={SCREEN_W * 0.95} cy={SCREEN_H * 0.12} r={26 * REM}>
//             <Stop offset="0" stopColor="#08d8ff" stopOpacity="0.16" />
//             <Stop offset="1" stopColor="#08d8ff" stopOpacity="0" />
//           </SvgRadialGradient>
//           <SvgRadialGradient id="glow3" gradientUnits="userSpaceOnUse" cx={SCREEN_W * 0.7} cy={SCREEN_H * 1.0} r={28 * REM}>
//             <Stop offset="0" stopColor="#ff3d54" stopOpacity="0.12" />
//             <Stop offset="1" stopColor="#ff3d54" stopOpacity="0" />
//           </SvgRadialGradient>
//         </Defs>
//         <Rect x="0" y="0" width="100%" height="100%" fill="url(#glow1)" />
//         <Rect x="0" y="0" width="100%" height="100%" fill="url(#glow2)" />
//         <Rect x="0" y="0" width="100%" height="100%" fill="url(#glow3)" />
//       </Svg>
//
//       {children}
//     </LinearGradient>
//   );
// }
//
