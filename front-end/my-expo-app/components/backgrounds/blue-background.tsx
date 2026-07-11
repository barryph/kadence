import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function BlueBackground() {
  return (
    <LinearGradient
      colors={['#087cfb', '#0290ee', '#09b0d4']}
      locations={[0, 0.58, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
    // Alternative / Darker ---- linear-gradient(159.876deg, rgb(11, 84, 164), rgb(19, 93, 143) 58%, rgb(13, 88, 125) 100%)
  );
}
