import React from "react";
import { Text, TextProps } from "react-native";

interface TypographyProps extends TextProps {
  variant?: "heading" | "subheading" | "body" | "caption" | "label";
  color?: "primary" | "secondary" | "muted";
  children: React.ReactNode;
}

const variantStyles: Record<string, string> = {
  heading:    "text-[32px] font-extrabold tracking-tight",
  subheading: "text-[18px] font-bold",
  body:       "text-[15px] font-medium leading-6",
  caption:    "text-[13px] font-medium leading-5",
  label:      "text-[12px] font-semibold tracking-wide uppercase",
};

const colorStyles: Record<string, string> = {
  primary:   "text-[#22451C]",  // deep forest green
  secondary: "text-[#4D8035]",  // olive green
  muted:     "text-[#70A656]",  // soft green
};

export function Typography({
  variant = "body",
  color = "primary",
  children,
  ...props
}: TypographyProps) {
  return (
    <Text
      className={`${variantStyles[variant]} ${colorStyles[color]}`}
      {...props}
    >
      {children}
    </Text>
  );
}