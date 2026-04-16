import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import './index.scss'
import Icon from '../../components/Icon'
import { knowledgeBase } from '../../data/knowledgeBase'

definePageConfig({
  navigationBarTitleText: '知识详情',
  navigationBarBackgroundColor: '#ffffff',
  navigationBarTextStyle: 'black',
})

export default function KnowledgeDetail() {
  const router = useRouter()
  const index = Number(router.params.index)
  const [article, setArticle] = useState<typeof knowledgeBase[0] | null>(null)

  useEffect(() => {
    if (!isNaN(index) && knowledgeBase[index]) {
      setArticle(knowledgeBase[index])
    }
  }, [index])

  if (!article) {
    return (
      <View className='page-empty'>
        <Icon name="file-text" size={40} color="#999" />
        <Text className='empty-text'>文章未找到</Text>
      </View>
    )
  }

  // Markdown-like渲染 - 与RN端renderContent一致
  const renderContent = (content: string) => {
    const lines = content.split('\n')
    return lines.map((line, index) => {
      if (line.startsWith('## ')) {
        return (
          <Text key={index} className='h2'>
            {line.replace('## ', '')}
          </Text>
        )
      }
      if (line.startsWith('### ')) {
        return (
          <Text key={index} className='h3'>
            {line.replace('### ', '')}
          </Text>
        )
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <View key={index} className='bullet-item'>
            <Text className='bullet'>•</Text>
            <Text className='body'>{line.replace(/^[*-] /, '')}</Text>
          </View>
        )
      }
      if (line.match(/^\d+\./)) {
        return (
          <View key={index} className='number-item'>
            <Text className='number'>{line.match(/^\d+/)?.[0]}.</Text>
            <Text className='body'>{line.replace(/^\d+\. /, '')}</Text>
          </View>
        )
      }
      if (line.trim() === '') {
        return <View key={index} className='spacer' />
      }
      return (
        <Text key={index} className='body'>
          {line}
        </Text>
      )
    })
  }

  return (
    <View className='container'>
      <ScrollView scrollY className='scroll-view'>
        <View className='content'>
          {/* 分类标签 - 对应RN categoryBadge */}
          <View className='category-badge'>
            <Text className='category-text'>{article.category}</Text>
          </View>

          {/* 标题 - 对应RN title */}
          <Text className='title'>{article.title}</Text>

          {/* 摘要 - 对应RN summary */}
          <Text className='summary'>{article.summary}</Text>

          {/* 分割线 - 对应RN divider */}
          <View className='divider' />

          {/* 内容 - 对应RN articleContent */}
          <View className='article-content'>{renderContent(article.content)}</View>
        </View>
      </ScrollView>
    </View>
  )
}
