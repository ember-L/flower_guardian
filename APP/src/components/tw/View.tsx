// Tailwind-compatible View component
import React from 'react';
import { View as RNView, ViewProps, StyleSheet } from 'react-native';
import { tw } from './tw';

interface CustomViewProps extends ViewProps {
  className?: string;
}

export function View({ className, style, ...props }: CustomViewProps) {
  const twStyle = className ? tw(className) : {};
  return (
    <RNView
      style={[twStyle, style]}
      {...props}
    />
  );
}

export default View;
