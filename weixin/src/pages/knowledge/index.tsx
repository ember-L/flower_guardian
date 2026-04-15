import { View, Text, ScrollView, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import './index.scss'
import Icon from '../../components/Icon'
import { knowledgeBase, categories, searchArticles, getArticlesByCategory } from '../../data/knowledgeBase'

definePageConfig({
  navigationBarTitleText: '养护知识',
  navigationBarBackgroundColor: '#ffffff',
  navigationBarTextStyle: 'black',
})

export default function Knowledge() {
  const [selectedTab, setSelectedTab] = useState<'general' | 'personal'>('general')
  const [searchText, setSearchText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [diagnosisHistory, setDiagnosisHistory] = useState<any[]>([])
  const [hasDiagnosisHistory, setHasDiagnosisHistory] = useState(false)

  useEffect(() => {
    checkDiagnosisHistory()
  }, [])

  const checkDiagnosisHistory = async () => {
    try {
      const token = Taro.getStorageSync('token')
      if (!token) return
      // 尝试获取诊断历史
      const res = await Taro.request({
        url: `${getBaseUrl()}/api/diagnoses/`,
        method: 'GET',
        header: { 'Authorization': `Bearer ${token}` },
      })
      if (res.statusCode === 200 && res.data?.items?.length > 0) {
        setHasDiagnosisHistory(true)
        setDiagnosisHistory(res.data.items.slice(0, 5))
        setSelectedTab('personal')
      }
    } catch (error) {
      console.log('No diagnosis history')
    }
  }

  const getBaseUrl = () => {
    return Taro.getStorageSync('baseUrl') || 'https://api.example.com'
  }

  // 搜索过滤
  const filteredArticles = searchText
    ? searchArticles(searchText)
    : selectedCategory
    ? getArticlesByCategory(selectedCategory)
    : knowledgeBase

  const handleArticleClick = (articleId: string) => {
    const index = knowledgeBase.findIndex(a => a.id === articleId)
    if (index >= 0) {
      Taro.navigateTo({ url: `/pages/knowledgeDetail/index?index=${index}` })
    }
  }

  // 渲染知识卡片
  const renderArticle = (article: any) => {
    return (
      <View
        key={article.id}
        className='article-card'
        onClick={() => handleArticleClick(article.id)}
      >
        <View className='article-icon'>
          <Icon name="sprout" size={20} color="#4CAF50" />
        </View>
        <View className='article-info'>
          <View className='article-category'>
            <Text className='article-category-text'>{article.category}</Text>
          </View>
          <Text className='article-title'>{article.title}</Text>
          <Text className='article-summary'>{article.summary}</Text>
        </View>
        <Icon name="chevron-right" size={18} color="#ccc" />
      </View>
    )
  }

  // 渲染个性化建议
  const renderPersonalized = () => (
    <ScrollView scrollY className='personal-container'>
      {/* 诊断历史概要 */}
      <View className='history-summary'>
        <View className='history-header'>
          <Icon name="alert-triangle" size={18} color="#F59E0B" />
          <Text className='history-title'>您的诊断历史</Text>
        </View>
        <Text className='history-count'>
          已有 {diagnosisHistory.length} 条诊断记录
        </Text>
      </View>

      {/* 基于诊断历史的建议 */}
      <View className='suggestions-section'>
        <Text className='section-title'>根据您的诊断记录</Text>

        {diagnosisHistory.map((record, index) => (
          <View key={record.id || index} className='suggestion-card'>
            <View className='suggestion-header'>
              <View className='suggestion-icon'>
                <Icon name="alert-triangle" size={18} color="#F59E0B" />
              </View>
              <Text className='suggestion-name'>{record.disease_name}</Text>
            </View>
            {record.treatment && (
              <View className='suggestion-content'>
                <Text className='suggestion-label'>治疗建议</Text>
                <Text className='suggestion-text'>{record.treatment}</Text>
              </View>
            )}
            {record.prevention && (
              <View className='suggestion-content'>
                <Text className='suggestion-label'>预防措施</Text>
                <Text className='suggestion-text'>{record.prevention}</Text>
              </View>
            )}
          </View>
        ))}

        {diagnosisHistory.length === 0 && (
          <View className='empty-history'>
            <Icon name="clipboard" size={40} color="#ccc" />
            <Text className='empty-history-text'>暂无诊断记录</Text>
            <Text className='empty-history-subtext'>
              进行病害诊断后，将为您生成个性化建议
            </Text>
          </View>
        )}
      </View>

      {/* 快速入口：查看所有知识 */}
      <View className='view-all-button' onClick={() => setSelectedTab('general')}>
        <Text className='view-all-text'>查看全部养护知识</Text>
        <Icon name="chevron-right" size={18} color="#4CAF50" />
      </View>
    </ScrollView>
  )

  return (
    <View className='container'>
      {/* Tab切换 */}
      <View className='tab-container'>
        <View
          className={`tab ${selectedTab === 'general' ? 'tab-active' : ''}`}
          onClick={() => setSelectedTab('general')}
        >
          <Text className={`tab-text ${selectedTab === 'general' ? 'tab-text-active' : ''}`}>
            知识库
          </Text>
        </View>
        <View
          className={`tab ${selectedTab === 'personal' ? 'tab-active' : ''}`}
          onClick={() => setSelectedTab('personal')}
        >
          <Text className={`tab-text ${selectedTab === 'personal' ? 'tab-text-active' : ''}`}>
            个性化
          </Text>
          {hasDiagnosisHistory && <View className='tab-badge' />}
        </View>
      </View>

      {selectedTab === 'general' ? (
        <>
          {/* 搜索栏 */}
          <View className='search-container'>
            <View className='search-input-wrapper'>
              <Icon name="search" size={18} color="#999" />
              <Input
                className='search-input'
                placeholder='搜索知识...'
                placeholderClass='search-placeholder'
                value={searchText}
                onInput={(e) => setSearchText(e.detail.value)}
              />
              {searchText ? (
                <View className='search-clear' onClick={() => setSearchText('')}>
                  <Icon name="x" size={16} color="#999" />
                </View>
              ) : null}
            </View>
          </View>

          {/* 分类筛选 */}
          {!searchText && (
            <ScrollView scrollX className='category-scroll'>
              <View className='category-container'>
                <View
                  className={`category-chip ${!selectedCategory ? 'category-chip-active' : ''}`}
                  onClick={() => setSelectedCategory(null)}
                >
                  <Text className={`category-chip-text ${!selectedCategory ? 'category-chip-text-active' : ''}`}>
                    全部
                  </Text>
                </View>
                {categories.map((category) => (
                  <View
                    key={category}
                    className={`category-chip ${selectedCategory === category ? 'category-chip-active' : ''}`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    <Text className={`category-chip-text ${selectedCategory === category ? 'category-chip-text-active' : ''}`}>
                      {category}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}

          {/* 知识列表 */}
          <ScrollView scrollY className='articles-scroll'>
            {filteredArticles.length === 0 ? (
              <View className='empty'>
                <Icon name="search" size={40} color="#ccc" />
                <Text className='empty-text'>未找到相关知识</Text>
              </View>
            ) : (
              <View className='list'>
                {filteredArticles.map(renderArticle)}
              </View>
            )}
          </ScrollView>
        </>
      ) : (
        renderPersonalized()
      )}
    </View>
  )
}
