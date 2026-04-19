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

      // aspectFill 模式：
      // 1. 计算 scale = max(containerWidth / originalWidth, containerHeight / originalHeight)
      // 2. 显示尺寸 = original * scale
      // 3. 偏移量 = (container - display) / 2 （居中裁切）
      const scaleX = containerWidth / originalWidth
      const scaleY = containerHeight / originalHeight
      const scale = Math.max(scaleX, scaleY) // aspectFill 用 max

      const displayWidth = originalWidth * scale
      const displayHeight = originalHeight * scale

      // 偏移量（居中裁切）
      const offsetX = (containerWidth - displayWidth) / 2
      const offsetY = (containerHeight - displayHeight) / 2

      // 转换 bbox 坐标
      const converted: DisplayBbox[] = bboxes.map((bbox) => {
        const [x1, y1, x2, y2] = bbox.bbox
        console.log('[BboxOverlay] Original bbox:', x1, y1, x2, y2)
        return {
          name: bbox.name,
          confidence: bbox.confidence,
          type: bbox.type,
          left: x1 * scale + offsetX,
          top: y1 * scale + offsetY,
          width: (x2 - x1) * scale,
          height: (y2 - y1) * scale,
        }
      })

      console.log('[BboxOverlay] Converted bboxes:', converted.length, 'scale:', scale, 'offsetX:', offsetX, 'offsetY:', offsetY)
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
