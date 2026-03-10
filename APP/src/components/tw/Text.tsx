// Tailwind-compatible Text component
import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { tw } from './tw';

interface CustomTextProps extends TextProps {
  className?: string;
}

export function Text({ className, style, ...props }: CustomTextProps) {
  const twStyle = className ? tw(className) : {};
  return (
    <RNText
      style={[twStyle, style]}
      {...props}
    />
  );
}

export default Text;
