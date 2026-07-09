import { useIsFocused } from '@react-navigation/native';

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
