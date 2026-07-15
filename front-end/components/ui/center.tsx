import { View, StyleSheet } from 'react-native';

interface IProps {
  children: React.ReactNode;
}

export default function Center({ children }: IProps) {
  return <View style={styles.center}>{children}</View>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
