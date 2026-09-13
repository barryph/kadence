import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';

interface IProps {
  backgroundColor?: string;
}

export default function Dot({ backgroundColor }: IProps) {
  const bg = backgroundColor || Colors.success;
  return <View style={[styles.dot, { backgroundColor: bg }]} />;
}
const styles = StyleSheet.create({
  dot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    marginRight: 8,
  },
});
