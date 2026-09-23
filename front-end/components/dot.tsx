import { StyleSheet, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';

interface IProps {
  backgroundColor?: string;
  size?: number;
}

export default function Dot({ backgroundColor, size = 8 }: IProps) {
  const bg = backgroundColor || Colors.success;
  return (
    <View
      style={[
        styles.dot,
        {
          backgroundColor: bg,
          height: size,
          width: size,
        },
      ]}
    />
  );
}
const styles = StyleSheet.create({
  dot: {
    borderRadius: 2,
    marginRight: Spacing.md,
  },
});
