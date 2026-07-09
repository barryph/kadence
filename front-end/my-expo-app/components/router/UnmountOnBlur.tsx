import { useIsFocused } from '@react-navigation/native';

/**
 * Used to force reloading of data when returning to a tab, in cases where data could become out of date
 **/
export default function UnmountOnBlur({
  children,
}: {
  children: React.ReactNode;
}) {
  const isFocused = useIsFocused();

  if (!isFocused) {
    return null;
  }

  return children;
}
