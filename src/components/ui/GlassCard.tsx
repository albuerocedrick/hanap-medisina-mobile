// src/components/ui/GlassCard.tsx
import { BlurView } from 'expo-blur';
import { View, ViewProps } from 'react-native';

interface GlassCardProps extends ViewProps {
  intensity?: number;
}

export function GlassCard({ children, intensity = 50, style, ...props }: GlassCardProps) {
  return (
    <View className="overflow-hidden rounded-3xl border border-white/20 shadow-sm" {...props}>
      <BlurView intensity={intensity} tint="light" className="p-5">
        {children}
      </BlurView>
    </View>
  );
}