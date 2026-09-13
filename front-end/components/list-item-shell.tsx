import { StyleSheet, View, type ViewProps } from 'react-native';
import ActivityBackground from '@/components/backgrounds/activity-background';
import { Colors, withAlpha } from '@/constants/theme';

interface IProps extends ViewProps {}

export default function ListItemShell({ style, children }: IProps) {
  return (
    <View style={[styles.activityWrapper, style]}>
      <ActivityBackground />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  activityWrapper: {
    width: '100%',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: Colors.border,
    borderRadius: 15,
    boxShadow: `0 14px 35px ${withAlpha(Colors.shadow, 0.22)}`,
    overflow: 'hidden',
  },
});
