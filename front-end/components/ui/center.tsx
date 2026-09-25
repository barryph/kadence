import { View, StyleSheet } from 'react-native';

interface IProps {
  children: React.ReactNode;
}

export default function Center({ children }: IProps) {
  return <View style={styles.container}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
