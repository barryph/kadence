import { Pressable, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors } from '@/constants/theme';

interface GuideInfoButtonProps {
  onPress: () => void;
  /** Optional accessible label override. */
  label?: string;
}

/**
 * Small circular `i` (information) affordance used to reopen a page's guide
 * at any time. Drop it into any page that renders a `GuideModal`.
 */
export default function GuideInfoButton({
  onPress,
  label = 'Open guide',
}: GuideInfoButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.circle}>
        <MaterialIcons name="info" size={22} color={Colors.iconAccent} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surfaceTranslucent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
