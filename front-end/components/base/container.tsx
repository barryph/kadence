import { StyleSheet, View, type ViewProps } from 'react-native';
import { Spacing } from '@/constants/theme';

interface IProps extends ViewProps {}

export default function Container({ children, style }: IProps) {
  return <View style={[styles.container, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 14,
    paddingHorizontal: Spacing['2xl'],
  },
});
