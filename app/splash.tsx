import { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { useColors } from "@/hooks/use-colors";

export default function SplashScreen() {
  const router = useRouter();
  const colors = useColors();
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Fade in and scale animation
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Heart pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(heartScale, {
          toValue: 1.1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(heartScale, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, []);

  const handleDismiss = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.replace("/(tabs)/" as any);
  };

  return (
    <View
      className="flex-1 items-center justify-center"
      style={{ backgroundColor: colors.background }}
    >
      <Animated.View
        style={{
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        }}
        className="items-center gap-6 px-6"
      >
        {/* Heart Icon */}
        <Animated.Text
          style={{
            transform: [{ scale: heartScale }],
            fontSize: 80,
          }}
        >
          💜
        </Animated.Text>

        {/* Main Text */}
        <View className="items-center gap-3">
          <Text
            className="text-4xl font-bold text-center"
            style={{ color: colors.foreground }}
          >
            Happy Valentine's Day
          </Text>
          <Text
            className="text-2xl font-bold text-center"
            style={{ color: colors.primary }}
          >
            Poopie
          </Text>
        </View>

        {/* Subtitle */}
        <Text
          className="text-lg text-center"
          style={{ color: colors.muted }}
        >
          Love you the most! 💕
        </Text>

        {/* Tap to Continue */}
        <TouchableOpacity
          onPress={handleDismiss}
          className="mt-8 px-8 py-4 rounded-full"
          style={{ backgroundColor: colors.primary }}
          activeOpacity={0.8}
        >
          <Text
            className="text-lg font-semibold text-center"
            style={{ color: colors.background }}
          >
            Tap to Continue
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
