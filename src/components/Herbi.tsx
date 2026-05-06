import React, { useRef, useState, useCallback } from "react";
import { View, Image, TouchableOpacity } from "react-native";

const FRAME_COUNT = 36;
const COLUMNS = 6;

const FRAME_WIDTH = 462;
const FRAME_HEIGHT = 444;

const OFFSET_X = 10;
const OFFSET_Y = 10;

const DISPLAY_SIZE = 160;

const scale = DISPLAY_SIZE / FRAME_WIDTH;
const DISPLAY_HEIGHT = (FRAME_HEIGHT - OFFSET_Y) * scale;

const SPRITE = require("../../assets/images/herbi-sprite.png");

export default function Herbi() {
  const [frame, setFrame] = useState(0);
  const isAnimating = useRef(false);

  const playAnimation = useCallback(() => {
    if (isAnimating.current) return;
    isAnimating.current = true;
    let currentFrame = 0;

    const interval = setInterval(() => {
      currentFrame++;
      if (currentFrame >= FRAME_COUNT) {
        clearInterval(interval);
        setFrame(0);
        isAnimating.current = false;
      } else {
        setFrame(currentFrame);
      }
    }, 70);
  }, []);

  const row = Math.floor(frame / COLUMNS);
  const col = frame % COLUMNS;

  return (
    <TouchableOpacity onPress={playAnimation} activeOpacity={0.9}>
      <View
        style={{
          width: DISPLAY_SIZE,
          height: DISPLAY_HEIGHT,
          overflow: "hidden",
        }}
      >
        <Image
          source={SPRITE}
          style={{
            width: 2772 * scale,
            height: 2664 * scale,
            transform: [
              { translateX: -(col * FRAME_WIDTH + OFFSET_X) * scale },
              { translateY: -(row * FRAME_HEIGHT + OFFSET_Y) * scale },
            ],
          }}
        />
      </View>
    </TouchableOpacity>
  );
}