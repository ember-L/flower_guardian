import { View, Text } from '@tarojs/components'
import { useEffect, useState } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

export interface BboxItem {
  name: string
  confidence: number
  bbox: number[] // [x1, y1, x2, y2] 原始像素坐标
  type?: string
}

interface BboxOverlayProps {
  imageSrc: string
  bboxes: BboxItem[]
  imageHeightRpx?: number // 容器高度（单位 rpx）
  imageWidth?: number  // 图片原始宽度（可选）
  imageHeight?: number  // 图片原始高度（可选）
}

interface DisplayBbox {
  name: string
  confidence: number
  left: number
  top: number
  width: number
  height: number
  type?: string
}

export default function BboxOverlay({ imageSrc, bboxes, imageHeightRpx = 360, imageWidth, imageHeight }: BboxOverlayProps) {
  const [displayBboxes, setDisplayBboxes] = useState<DisplayBbox[]>([])
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!imageSrc || bboxes.length === 0) {
      console.log('[BboxOverlay] Skip: imageSrc=', !!imageSrc, 'bboxes.length=', bboxes.length)
      setDisplayBboxes([])
      setIsReady(false)
      return
    }

    console.log('[BboxOverlay] Starting with', bboxes.length, 'bboxes, imageSrc:', imageSrc)

    // 如果已有图片尺寸，直接使用
    if (imageWidth && imageHeight) {
      console.log('[BboxOverlay] Using provided dimensions:', imageWidth, 'x', imageHeight)
      calculateBboxes(imageWidth, imageHeight)
      return
    }

    // 获取图片原始尺寸
    Taro.getImageInfo({
      src: imageSrc,
      success: (res) => {
        console.log('[BboxOverlay] Image info success:', res.width, 'x', res.height)
        calculateBboxes(res.width, res.height)
      },
      fail: (err) => {
        console.log('[BboxOverlay] Image info failed:', err)
        setDisplayBboxes([])
        setIsReady(false)
      }
    })

    function calculateBboxes(originalWidth: number, originalHeight: number) {
      // 获取系统信息进行单位转换
      const sysInfo = Taro.getSystemInfoSync()
      const windowWidth = sysInfo.windowWidth

      // rpx 转 px: 1rpx = windowWidth / 750
      const rpxToPx = windowWidth / 750

      // 容器宽度（屏幕全宽）
      const containerWidth = windowWidth

      // 容器高度（rpx -> px）
      const containerHeight = imageHeightRpx * rpxToPx

      // 计算 scale 以便图片在容器中正确缩放
      const scaleX = containerWidth / originalWidth
      const scaleY = containerHeight / originalHeight
      const scale = Math.max(scaleX, scaleY)

      // 计算图片实际显示尺寸
      const displayWidth = originalWidth * scale
      const displayHeight = originalHeight * scale

      // 计算偏移量（居中裁切）
      const offsetX = (containerWidth - displayWidth) / 2
      const offsetY = (containerHeight - displayHeight) / 2

      // 转换 bbox 坐标到显示坐标系
      const converted: DisplayBbox[] = bboxes.map((bbox) => {
        const [x1, y1, x2, y2] = bbox.bbox

        // 计算检测框在显示图片上的位置
        let left = x1 * scale + offsetX
        let top = y1 * scale + offsetY
        let width = (x2 - x1) * scale
        let height = (y2 - y1) * scale

        // 在 aspectFill 模式下，图片可能被裁切
        // 需要将检测框裁切到可见区域内
        // 可见区域是容器区域 [0, containerWidth] x [0, containerHeight]

        // 水平方向裁切
        let clampedLeft = left
        let clampedWidth = width
        if (left < 0) {
          clampedWidth = width + left  // 减少宽度
          clampedLeft = 0
        }
        if (left + width > containerWidth) {
          clampedWidth = containerWidth - clampedLeft
        }

        // 垂直方向裁切
        let clampedTop = top
        let clampedHeight = height
        if (top < 0) {
          clampedHeight = height + top  // 减少高度
          clampedTop = 0
        }
        if (top + height > containerHeight) {
          clampedHeight = containerHeight - clampedTop
        }

        // 确保裁切后宽度和高度不为负
        clampedWidth = Math.max(0, clampedWidth)
        clampedHeight = Math.max(0, clampedHeight)

        const isVisible = clampedWidth > 0 && clampedHeight > 0

        if (!isVisible || clampedWidth < width || clampedHeight < height) {
          console.log('[BboxOverlay] Bbox clipped:', { left, top, width, height }, '->', { left: clampedLeft, top: clampedTop, width: clampedWidth, height: clampedHeight })
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
          }
        }

        return {
          name: bbox.name,
          confidence: bbox.confidence,
          type: bbox.type,
          left: clampedLeft,
          top: clampedTop,
          width: clampedWidth,
          height: clampedHeight,
        }
      })

      console.log('[BboxOverlay] Converted bboxes:', converted.length, 'scale:', scale, 'offsetX:', offsetX, 'offsetY:', offsetY, 'original:', originalWidth, originalHeight)
      setDisplayBboxes(converted)
      setIsReady(true)
    }
  }, [imageSrc, bboxes, imageHeightRpx, imageWidth, imageHeight])

  if (!imageSrc || bboxes.length === 0 || !isReady) {
    return null
  }

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'disease':
        return '#faad14'
      case 'insect':
        return '#ff4d4f'
      case 'plant':
        return '#52c41a'
      default:
        return '#52c41a'
    }
  }

  return (
    <View className='bbox-overlay'>
      {displayBboxes.map((bbox, index) => (
        <View
          key={index}
          className='bbox-box'
          style={{
            left: `${bbox.left}px`,
            top: `${bbox.top}px`,
            width: `${bbox.width}px`,
            height: `${bbox.height}px`,
            borderColor: getTypeColor(bbox.type),
          }}
        >
          <View
            className='bbox-label'
            style={{ backgroundColor: getTypeColor(bbox.type) }}
          >
            <Text className='bbox-label-text'>
              {Math.round(bbox.confidence * 100)}%
            </Text>
          </View>
        </View>
      ))}
    </View>
  )
}
