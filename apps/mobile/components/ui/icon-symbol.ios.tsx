import { Text, StyleProp, ViewStyle } from 'react-native';

const iconMap: Record<string, string> = {
  home: '🏠',
  levels: '📊',
  stats: '📈',
  more: '⋯',
  search: '🔍',
};

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: string;
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
}) {
  const icon = iconMap[name] || '•';
  return (
    <Text style={[{ fontSize: size, color }, style]}>
      {icon}
    </Text>
  );
}
