import React, { useEffect } from "react";
import Svg, { Path } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";

type Props = {
  size?: number;
  color?: string;
  innerColor?: string;
};

export function FlameIcon({ size = 24, color = "#f97316", innerColor }: Props) {
  const scaleY = useSharedValue(1);
  const scaleX = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    scaleY.value = withRepeat(
      withSequence(
        withTiming(1.10, { duration: 500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.93, { duration: 450, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.06, { duration: 380, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.00, { duration: 420, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false
    );
    scaleX.value = withRepeat(
      withSequence(
        withTiming(0.92, { duration: 500, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.06, { duration: 450, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.95, { duration: 380, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.00, { duration: 420, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false
    );
    translateY.value = withRepeat(
      withSequence(
        withTiming(-1.5, { duration: 500, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.2, { duration: 450, easing: Easing.inOut(Easing.sin) }),
        withTiming(-0.8, { duration: 380, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 420, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scaleX: scaleX.value },
      { scaleY: scaleY.value },
    ],
  }));

  const inner = innerColor ?? "rgba(255,255,255,0.35)";

  return (
    <Animated.View style={[{ width: size, height: size }, animatedStyle]}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        {/* Outer flame */}
        <Path
          d="M12 2C11 4.5 9 7 8.5 9.5c-.4 2 .2 3.2.2 3.2S7.5 11.5 7.8 10C6 12.5 5.5 14.5 6 16.5A6 6 0 0 0 18 16.5c.8-4-2-8.5-6-14.5z"
          fill={color}
        />
        {/* Inner highlight */}
        <Path
          d="M12 8c-.6 1.5-1.5 3-1.5 4.5a1.8 1.8 0 0 0 3.5.5C14.5 11.5 13 9.5 12 8z"
          fill={inner}
        />
      </Svg>
    </Animated.View>
  );
}
