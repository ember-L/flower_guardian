// BboxOverlay 组件 - 简化版，使用onLayout获取实际尺寸
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, ImageSourcePropType, ImageLoadEventData, NativeSyntheticEvent, LayoutChangeEvent } from 'react-native';
import { colors } from '../constants/theme';

export interface BboxItem {
  name: string;
  confidence: number;
  bbox: number[]; // [x1, y1, x2, y2] 原始像素坐标
  type?: string;
}

interface BboxOverlayProps {
  imageUri: string;
  bboxes: BboxItem[];
  containerHeight?: number;
  containerWidth?: number;
}

const getTypeColor = (type?: string): string => {
  switch (type) {
    case 'disease': return '#faad14';
    case 'insect': return '#ff4d4f';
    case 'plant': return '#52c41a';
    default: return '#52c41a';
  }
};

interface DisplayBbox {
  name: string;
  confidence: number;
  left: number;
  top: number;
  width: number;
  height: number;
  type?: string;
}

export function BboxOverlay({ imageUri, bboxes, containerHeight, containerWidth: customContainerWidth }: BboxOverlayProps) {
  const [displayBboxes, setDisplayBboxes] = useState<DisplayBbox[]>([]);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null);
  const defaultWidth = customContainerWidth || Dimensions.get('window').width;
  const defaultHeight = containerHeight || 200;

  // onLayout - 获取实际渲染的容器尺寸
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    console.log('[BboxOverlay] onLayout:', width, 'x', height);
    setContainerSize({ width, height });
  }, []);

  // 图片加载完成
  const handleImageLoad = useCallback((event: NativeSyntheticEvent<ImageLoadEventData>) => {
    const { width, height } = event.nativeEvent.source;
    console.log('[BboxOverlay] Image onLoad:', width, 'x', height);
    setImageSize({ width, height });
  }, []);

  // 加载图片尺寸（备用）
  useEffect(() => {
    if (!imageUri) return;

    Image.getSize(
      imageUri,
      (w, h) => {
        console.log('[BboxOverlay] getSize:', w, 'x', h);
        setImageSize({ width: w, height: h });
      },
      (err) => {
        console.log('[BboxOverlay] getSize failed');
      }
    );
  }, [imageUri]);

  // 计算检测框
  useEffect(() => {
    if (!imageSize) {
      console.log('[BboxOverlay] Waiting for imageSize...');
      return;
    }

    if (!bboxes || bboxes.length === 0) {
      setDisplayBboxes([]);
      return;
    }

    // 优先使用 onLayout 获取的尺寸，否则使用默认值
    const containerW = containerSize?.width || defaultWidth;
    const containerH = containerSize?.height || defaultHeight;

    console.log('[BboxOverlay] Calculating: imageSize=', imageSize.width, 'x', imageSize.height, 'container=', containerW, 'x', containerH);

    // aspectFill 模式
    const scaleX = containerW / imageSize.width;
    const scaleY = containerH / imageSize.height;
    const scale = Math.max(scaleX, scaleY);

    const displayWidth = imageSize.width * scale;
    const displayHeight = imageSize.height * scale;

    // 居中偏移
    const offsetX = (containerW - displayWidth) / 2;
    const offsetY = (containerH - displayHeight) / 2;

    console.log('[BboxOverlay] scale=', scale.toFixed(3), 'display=', displayWidth.toFixed(1), 'x', displayHeight.toFixed(1), 'offset=', offsetX.toFixed(1), offsetY.toFixed(1));

    // 转换 bbox 坐标到显示坐标系，并裁切到可见区域内
    const converted: DisplayBbox[] = bboxes.map((bbox) => {
      const [x1, y1, x2, y2] = bbox.bbox;

      // 计算检测框在显示图片上的位置
      let left = x1 * scale + offsetX;
      let top = y1 * scale + offsetY;
      let width = (x2 - x1) * scale;
      let height = (y2 - y1) * scale;

      // 在 aspectFill 模式下，图片可能被裁切
      // 需要将检测框裁切到可见区域内
      // 可见区域是容器区域 [0, containerW] x [0, containerH]

      // 水平方向裁切
      let clampedLeft = left;
      let clampedWidth = width;
      if (left < 0) {
        clampedWidth = width + left;
        clampedLeft = 0;
      }
      if (left + width > containerW) {
        clampedWidth = containerW - clampedLeft;
      }

      // 垂直方向裁切
      let clampedTop = top;
      let clampedHeight = height;
      if (top < 0) {
        clampedHeight = height + top;
        clampedTop = 0;
      }
      if (top + height > containerH) {
        clampedHeight = containerH - clampedTop;
      }

      // 确保裁切后宽度和高度不为负
      clampedWidth = Math.max(0, clampedWidth);
      clampedHeight = Math.max(0, clampedHeight);

      const isVisible = clampedWidth > 0 && clampedHeight > 0;

      if (!isVisible || clampedWidth < width || clampedHeight < height) {
        console.log('[BboxOverlay] Bbox clipped:', { left, top, width, height }, '->', { left: clampedLeft, top: clampedTop, width: clampedWidth, height: clampedHeight });
      }

      if (!isVisible) {
        return {
          name: bbox.name,
          confidence: bbox.confidence,
          type: bbox.type,
          left: 0,
          top: 0,
          width: 0,
          height: 0,
        };
      }

      return {
        name: bbox.name,
        confidence: bbox.confidence,
        type: bbox.type,
        left: clampedLeft,
        top: clampedTop,
        width: clampedWidth,
        height: clampedHeight,
      };
    });

    console.log('[BboxOverlay] Converted', converted.length, 'bboxes');
    setDisplayBboxes(converted);
  }, [imageSize, bboxes, containerSize, defaultWidth, defaultHeight]);

  if (!imageUri || !bboxes || bboxes.length === 0) {
    return null;
  }

  return (
    <View
      style={[styles.container, { width: defaultWidth, height: defaultHeight }]}
      onLayout={handleLayout}
    >
      <Image
        source={{ uri: imageUri } as ImageSourcePropType}
        style={styles.image}
        resizeMode="cover"
        onLoad={handleImageLoad}
      />

      {displayBboxes.map((bbox, index) => (
        <View
          key={index}
          style={[
            styles.bboxBox,
            {
              left: Math.round(bbox.left),
              top: Math.round(bbox.top),
              width: Math.max(2, Math.round(bbox.width)),
              height: Math.max(2, Math.round(bbox.height)),
              borderColor: getTypeColor(bbox.type),
            },
          ]}
        >
          {/* 置信度标签 */}
          <View style={[styles.bboxLabel, { backgroundColor: getTypeColor(bbox.type) }]}>
            <Text style={styles.bboxLabelText}>
              {(bbox.confidence * 100).toFixed(0)}%
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  bboxBox: {
    position: 'absolute',
    borderWidth: 2,
    borderStyle: 'solid',
    borderRadius: 4,
    overflow: 'visible',
  },
  bboxLabel: {
    position: 'absolute',
    top: -26,
    left: 0,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 44,
  },
  bboxLabelText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '600',
  },
});
