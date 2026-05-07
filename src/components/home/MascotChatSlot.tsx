import React, { useEffect, useMemo, useRef, useState } from "react";
import { Image, ImageResolvedAssetSource, Pressable, Text, View } from "react-native";
import { useColorScheme } from "nativewind";
import Animated, { 
  FadeIn, 
  FadeOut, 
  LinearTransition 
} from "react-native-reanimated";

const IDLE_MESSAGES = [
  "Tip: Scan leaves in good light.",
  "Try searching a plant name above.",
  "New here? Start with a quick scan.",
  "Did you know? Some herbs look alike—double-check details.",
];

const EXPRESSION_MESSAGES = [
  "Yay! Let's find your plant!",
  "Hmm... let me think about that.",
  "Nice! I am excited to help.",
  "Hehe, got it!",
  "Feeling calm and ready.",
];

const SHEETS = {
  idle: require("../../../assets/images/home-mascot/herbi-idle.png"),
  goingSleep: require("../../../assets/images/home-mascot/herbi-going-sleep.png"),
  sleeping: require("../../../assets/images/home-mascot/herbi-sleeping.png"),
  expressions: [
    require("../../../assets/images/home-mascot/herbi-happy.png"),
    require("../../../assets/images/home-mascot/herbi-thinking.png"),
    require("../../../assets/images/home-mascot/herbi-excited.png"),
    require("../../../assets/images/home-mascot/herbi-winking.png"),
    require("../../../assets/images/home-mascot/herbi-peaceful.png"),
  ],
} as const;

// ─── Animation Config ───
const COLUMNS = 8;
const ROWS = 8;
const TOTAL_FRAMES = 64; 
const MASCOT_WIDTH = 100; // Fixed width for consistent horizontal layout
const SPRITE_DURATION_MS = 4000;
const FRAME_MS = Math.round(SPRITE_DURATION_MS / TOTAL_FRAMES);

type MascotMode = "idle" | "expression" | "goingSleep" | "sleeping";

export function MascotChatSlot() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [mode, setMode] = useState<MascotMode>("idle");
  const [exprIdx, setExprIdx] = useState(0);
  const [idleMsgIdx, setIdleMsgIdx] = useState(0);
  const [sleepDots, setSleepDots] = useState(0);
  const [frame, setFrame] = useState(0);
  const lastInteractionRef = useRef(Date.now());

  useEffect(() => {
    const idleInterval = setInterval(() => {
      if (mode === "idle") {
        setIdleMsgIdx((v) => (v + 1) % IDLE_MESSAGES.length);
      }
    }, 5000);
    return () => clearInterval(idleInterval);
  }, [mode]);

  useEffect(() => {
    let frameInterval: ReturnType<typeof setInterval> | null = null;
    let settleTimeout: ReturnType<typeof setTimeout> | null = null;

    if (mode === "expression" || mode === "goingSleep") {
      setFrame(0);
      let current = 0;

      frameInterval = setInterval(() => {
        current += 1;
        if (current >= TOTAL_FRAMES) {
          if (frameInterval) clearInterval(frameInterval);
          setFrame(TOTAL_FRAMES - 1);

          settleTimeout = setTimeout(() => {
            if (mode === "expression") setMode("idle");
            else setMode("sleeping");
            setFrame(0);
          }, 180);
          return;
        }
        setFrame(current);
      }, FRAME_MS);
    } else {
      frameInterval = setInterval(() => {
        setFrame((f) => (f + 1) % TOTAL_FRAMES);
      }, FRAME_MS);
    }

    return () => {
      if (frameInterval) clearInterval(frameInterval);
      if (settleTimeout) clearTimeout(settleTimeout);
    };
  }, [mode]);

  useEffect(() => {
    const sleepDotsInterval = setInterval(() => {
      if (mode === "sleeping") setSleepDots((v) => (v + 1) % 4);
    }, 900);
    return () => clearInterval(sleepDotsInterval);
  }, [mode]);

  useEffect(() => {
    const inactivity = setInterval(() => {
      const inactiveFor = Date.now() - lastInteractionRef.current;
      if ((mode === "idle" || mode === "expression") && inactiveFor >= 30000) {
        setMode("goingSleep");
      }
    }, 1000);
    return () => clearInterval(inactivity);
  }, [mode]);

  const message = useMemo(() => {
    if (mode === "expression") return EXPRESSION_MESSAGES[exprIdx];
    if (mode === "goingSleep") return "I'm getting sleepy...";
    if (mode === "sleeping") return `zzzzz${".".repeat(sleepDots)}`;
    return IDLE_MESSAGES[idleMsgIdx];
  }, [exprIdx, idleMsgIdx, mode, sleepDots]);

  const handleMascotPress = () => {
    lastInteractionRef.current = Date.now();
    const next = Math.floor(Math.random() * EXPRESSION_MESSAGES.length);
    setExprIdx(next);
    setMode("expression");
  };

  const activeSheet = useMemo(() => {
    if (mode === "expression") return SHEETS.expressions[exprIdx];
    if (mode === "goingSleep") return SHEETS.goingSleep;
    if (mode === "sleeping") return SHEETS.sleeping;
    return SHEETS.idle;
  }, [exprIdx, mode]);

  // 🌟 DYNAMIC DIMENSION CALCULATION 🌟
  const resolved = Image.resolveAssetSource(activeSheet) as ImageResolvedAssetSource;
  const sw = resolved?.width || 1024;
  const sh = resolved?.height || 1024;
  
  const fw = sw / COLUMNS;
  const fh = sh / ROWS;
  const scale = MASCOT_WIDTH / fw;
  const displayHeight = fh * scale;

  const frameCol = frame % COLUMNS;
  const frameRow = Math.floor(frame / COLUMNS);

  return (
    <View style={{ paddingHorizontal: 22, height: 164, marginBottom: 24 }}>
      <Text
        style={{
          marginBottom: 8,
          color: isDark ? "rgba(248,250,252,0.84)" : "#22451C",
          fontSize: 18,
          fontFamily: "serif",
          fontStyle: "italic",
          fontWeight: "500",
          letterSpacing: 0.3,
        }}
      >
        Meet Herbi...
      </Text>
      
      <View style={{ flex: 1, flexDirection: "row", alignItems: "flex-end" }}>
        {/* Mascot container with dynamic height to prevent "cutout" */}
        <Pressable 
          onPress={handleMascotPress}
          style={{ width: MASCOT_WIDTH, alignItems: "center" }}
        >
          <View
            style={{
              width: MASCOT_WIDTH,
              height: displayHeight,
              overflow: "hidden",
              borderRadius: 0.5, // Forced clipping
            }}
          >
            <Image
              source={activeSheet}
              style={{
                width: sw * scale,
                height: sh * scale,
                transform: [
                  { translateX: -(frameCol * fw) * scale },
                  { translateY: -(frameRow * fh) * scale },
                ],
              }}
              resizeMode="stretch"
            />
          </View>
        </Pressable>

        <Animated.View
          layout={LinearTransition.duration(200)}
          style={{
            flex: 1,
            marginLeft: 12,
            marginBottom: 4, // Align slightly above the mascot "ground"
            borderRadius: 18,
            paddingVertical: 12,
            paddingHorizontal: 14,
            backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#FAFEEF",
            borderWidth: 1,
            borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(162,207,163,0.55)",
          }}
        >
          <Animated.Text
            key={message}
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            style={{
              color: isDark ? "rgba(248,250,252,0.80)" : "#22451C",
              fontSize: 13,
              lineHeight: 18,
              fontFamily: "Quicksand_500Medium",
            }}
          >
            {message}
          </Animated.Text>

          {/* Bubble tail */}
          <View
            style={{
              position: "absolute",
              left: -6,
              bottom: 12,
              width: 12,
              height: 12,
              backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#FAFEEF",
              borderLeftWidth: 1,
              borderBottomWidth: 1,
              borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(162,207,163,0.55)",
              transform: [{ rotate: "45deg" }],
            }}
          />

          <Text
            style={{
              marginTop: 8,
              color: isDark ? "rgba(248,250,252,0.45)" : "rgba(34,69,28,0.55)",
              fontSize: 11,
              fontFamily: "Quicksand_500Medium",
            }}
          >
            Tap mascot for expression
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}
