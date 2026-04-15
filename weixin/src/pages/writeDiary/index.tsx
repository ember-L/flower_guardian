import { View, Text, ScrollView, Input, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import './index.scss'
import { getMyPlants, createDiary, uploadDiaryImages, type Plant } from '../../services/diaryService'

export default function WriteDiary() {
  const [plants, setPlants] = useState<Plant[]>([])
  const [selectedPlantId, setSelectedPlantId] = useState<number | null>(null)
  const [images, setImages] = useState<string[]>([])
  const [height, setHeight] = useState('')
  const [leafCount, setLeafCount] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    loadPlants()
  }, [])

  const loadPlants = async () => {
    try {
      const data = await getMyPlants()
      setPlants(data)
      if (data.length > 0) {
        setSelectedPlantId(data[0].id)
      }
    } catch (error) {
      console.error('Failed to load plants:', error)
    } finally {
      setInitialLoading(false)
    }
  }

  const handleAddImage = () => {
    if (images.length >= 9) {
      Taro.showToast({ title: '最多只能添加9张图片', icon: 'none' })
      return
    }

    Taro.showActionSheet({
      itemList: ['拍照', '相册'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 拍照
          Taro.chooseImage({
            count: 1,
            sizeType: ['compressed'],
            sourceType: ['camera'],
            success: (res) => {
              setImages([...images, ...res.tempFilePaths].slice(0, 9))
            },
          })
        } else if (res.tapIndex === 1) {
          // 相册
          Taro.chooseImage({
            count: 9 - images.length,
            sizeType: ['compressed'],
            sourceType: ['album'],
            success: (res) => {
              setImages([...images, ...res.tempFilePaths].slice(0, 9))
            },
          })
        }
      },
    })
  }

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!selectedPlantId) {
      Taro.showToast({ title: '请选择植物', icon: 'none' })
      return
    }

    if (!content.trim() && images.length === 0) {
      Taro.showToast({ title: '请添加图片或文字内容', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      let serverImageUrls: string[] = []
      if (images.length > 0) {
        serverImageUrls = await uploadDiaryImages(images)
      }

      await createDiary({
        user_plant_id: selectedPlantId,
        content: content.trim(),
        images: serverImageUrls.length > 0 ? serverImageUrls : undefined,
        height: height ? parseInt(height, 10) : undefined,
        leaf_count: leafCount ? parseInt(leafCount, 10) : undefined,
      })

      Taro.showToast({ title: '日记保存成功', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 1000)
    } catch (error) {
      console.error('保存日记失败:', error)
      Taro.showToast({ title: '保存失败，请重试', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <View className='write-diary'>
        <View className='loading-container'>
          <Text className='loading-text'>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='write-diary'>
      {/* 头部 - 渐变设计 */}
      <View className='header-gradient'>
        <View className='header'>
          <View className='close-btn' onClick={() => Taro.navigateBack()}>
            <Text className='close-icon'>X</Text>
          </View>

          <View className='header-center'>
            <View className='header-icon-badge'>
              <Text className='header-icon-text'>~</Text>
            </View>
            <Text className='header-title'>记录生长</Text>
          </View>

          <View className='save-btn' onClick={handleSave}>
            {loading ? (
              <Text className='save-btn-text'>...</Text>
            ) : (
              <Text className='save-btn-text'>保存</Text>
            )}
          </View>
        </View>
      </View>

      <ScrollView scrollY className='content'>
        {/* 植物选择 */}
        <View className='section'>
          <View className='section-header'>
            <View className='section-icon-box'>
              <Text className='section-icon-text'>~</Text>
            </View>
            <Text className='section-title'>选择植物</Text>
          </View>

          {plants.length === 0 ? (
            <View className='empty-card' onClick={() => Taro.navigateTo({ url: '/pages/garden/index' })}>
              <View className='empty-icon-wrap'>
                <Text className='empty-icon'>+</Text>
              </View>
              <View className='empty-content'>
                <Text className='empty-title'>还没有植物</Text>
                <Text className='empty-desc'>点击添加你的第一株植物</Text>
              </View>
              <Text className='chevron-right'>&gt;</Text>
            </View>
          ) : (
            <ScrollView scrollX className='plant-scroll'>
              <View className='plant-chips'>
                {plants.map((plant) => (
                  <View
                    key={plant.id}
                    className={`plant-chip ${selectedPlantId === plant.id ? 'active' : ''}`}
                    onClick={() => setSelectedPlantId(plant.id)}
                  >
                    <View className={`plant-chip-icon ${selectedPlantId === plant.id ? 'active' : ''}`}>
                      <Text className='chip-leaf'>*</Text>
                    </View>
                    <Text className={`plant-chip-text ${selectedPlantId === plant.id ? 'active' : ''}`}>
                      {plant.name || '植物'}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        </View>

        {/* 图片区域 */}
        <View className='section'>
          <View className='section-header'>
            <View className='section-icon-box accent'>
              <Text className='section-icon-text'>~</Text>
            </View>
            <Text className='section-title'>拍照记录</Text>
            <Text className='image-count'>{images.length}/9</Text>
          </View>

          <View className='image-grid'>
            {images.map((uri, index) => (
              <View key={index} className='image-wrapper'>
                <Image className='image' src={uri} mode='aspectFill' />
                <View className='remove-btn' onClick={() => handleRemoveImage(index)}>
                  <Text className='remove-icon'>X</Text>
                </View>
              </View>
            ))}
            {images.length < 9 && (
              <View className='add-btn' onClick={handleAddImage}>
                <View className='add-icon-wrap'>
                  <Text className='add-icon'>~</Text>
                </View>
                <Text className='add-text'>添加照片</Text>
              </View>
            )}
          </View>
        </View>

        {/* 生长数据 */}
        <View className='section'>
          <View className='section-header'>
            <View className='section-icon-box secondary'>
              <Text className='section-icon-text'>~</Text>
            </View>
            <Text className='section-title'>生长数据</Text>
            <Text className='optional-tag'>选填</Text>
          </View>

          <View className='growth-row'>
            <View className='growth-card'>
              <View className='growth-label-row'>
                <View className='growth-icon-box accent-light'>
                  <Text className='growth-icon-text'>~</Text>
                </View>
                <Text className='growth-label'>株高</Text>
              </View>
              <View className='input-row'>
                <Input
                  className='growth-input'
                  type='digit'
                  value={height}
                  onInput={(e) => setHeight(e.detail.value)}
                  placeholder='0'
                  placeholderClass='growth-placeholder'
                />
                <Text className='growth-unit'>cm</Text>
              </View>
            </View>

            <View className='growth-card'>
              <View className='growth-label-row'>
                <View className='growth-icon-box secondary-light'>
                  <Text className='growth-icon-text'>*</Text>
                </View>
                <Text className='growth-label'>叶片数</Text>
              </View>
              <View className='input-row'>
                <Input
                  className='growth-input'
                  type='number'
                  value={leafCount}
                  onInput={(e) => setLeafCount(e.detail.value)}
                  placeholder='0'
                  placeholderClass='growth-placeholder'
                />
                <Text className='growth-unit'>片</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 养护笔记 */}
        <View className='section'>
          <View className='section-header'>
            <View className='section-icon-box dark'>
              <Text className='section-icon-text'>~</Text>
            </View>
            <Text className='section-title'>养护笔记</Text>
            <Text className='optional-tag'>选填</Text>
          </View>

          <View className='text-area-wrap'>
            <Input
              className='text-area'
              value={content}
              onInput={(e) => setContent(e.detail.value)}
              placeholder='记录今天的养护心得、观察发现...'
              placeholderClass='text-placeholder'
              maxlength={500}
            />
            <View className='char-count-wrap'>
              <View className='char-count-left'>
                <Text className='char-count'>~ {content.length}/500</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 底部装饰 */}
        <View className='decoration'>
          <View className='decoration-line' />
          <View className='decoration-icon'>
            <Text className='decoration-icon-text'>~</Text>
          </View>
          <View className='decoration-line' />
        </View>

        <View className='bottom-spacer' />
      </ScrollView>
    </View>
  )
}
