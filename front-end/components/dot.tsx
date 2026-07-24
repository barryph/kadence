import { StyleSheet, View } from 'react-native';

interface IProps {
  backgroundColor?: string;
}

export default function Dot({ backgroundColor }: IProps) {
  const bg = backgroundColor || 'rgb(0, 255, 52)';
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
