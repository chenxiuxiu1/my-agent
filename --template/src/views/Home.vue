<template>
  <div class="home-page">
    <div class="page-container">
      <!-- 精简搜索栏 -->
      <div class="search-section card">
        <div class="search-row">
          <van-search
            v-model="searchKeyword"
            placeholder="搜索新闻..."
            shape="round"
            @search="onSearch"
          />
          <van-button 
            type="primary" 
            size="small" 
            round
            class="search-btn"
            @click="onSearch"
            :loading="loading"
          >
            搜索
          </van-button>
        </div>
        
        <!-- 分类标签 -->
        <div class="category-tags">
          <span
            v-for="cat in categories"
            :key="cat.value"
            class="category-tag"
            :class="{ active: selectedCategory === cat.value }"
            @click="selectCategory(cat.value)"
          >
            {{ cat.text }}
          </span>
        </div>
      </div>
      
      <!-- 搜索历史和推荐 - 折叠式 -->
      <div v-if="!hasSearched" class="quick-section card">
        <div v-if="searchHistory.length > 0" class="quick-block">
          <div class="quick-header">
            <span>最近搜索</span>
            <van-icon name="delete-o" @click="clearHistory" />
          </div>
          <div class="quick-tags">
            <span
              v-for="(item, index) in searchHistory.slice(0, 5)"
              :key="index"
              class="quick-tag"
              @click="quickSearch(item.keyword, item.category)"
            >
              {{ item.keyword }}
            </span>
          </div>
        </div>
        
        <div class="quick-block">
          <div class="quick-header">
            <span>热门推荐</span>
            <van-icon name="refresh" @click="refreshRecommendations" />
          </div>
          <div class="quick-tags">
            <span
              v-for="(keyword, index) in recommendedKeywords"
              :key="index"
              class="quick-tag primary"
              @click="quickSearch(keyword, 'all')"
            >
              {{ keyword }}
            </span>
          </div>
        </div>
      </div>
      
      <!-- 新闻列表 -->
      <div class="news-section">
        <div v-if="hasSearched" class="section-header">
          <span class="result-text">找到 {{ newsList.length }} 条结果</span>
          <van-icon name="bar-chart-o" class="stats-icon" @click="showStats = true" />
        </div>
        
        <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
          <van-list
            v-model:loading="loading"
            :finished="finished"
            finished-text="没有更多了"
            @load="onLoad"
          >
            <NewsCard
              v-for="news in newsList"
              :key="news.id"
              :news="news"
              @click="goToDetail"
            />
          </van-list>
        </van-pull-refresh>
        
        <!-- 空状态 -->
        <div v-if="!loading && newsList.length === 0 && hasSearched" class="empty-state">
          <van-icon name="search" />
          <p>暂无搜索结果</p>
        </div>
        
        <div v-if="!hasSearched" class="empty-state">
          <van-icon name="guide-o" />
          <p>输入关键词开始探索</p>
        </div>
      </div>
    </div>
    
    <!-- 统计弹窗 -->
    <van-popup v-model:show="showStats" position="bottom" round :style="{ height: '50%' }">
      <div class="stats-popup">
        <div class="stats-header">
          <span>新闻来源分布</span>
          <van-icon name="cross" @click="showStats = false" />
        </div>
        <div ref="chartRef" class="chart-container"></div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import * as echarts from 'echarts'
import NewsCard from '@/components/NewsCard/NewsCard.vue'
import { searchNews, getDefaultAgent, getCategoryList, getRecommendedKeywords } from '@/api/agents.js'
import { searchHistoryStorage, newsHistoryStorage, settingsStorage } from '@/utils/storage.js'

const router = useRouter()

const searchKeyword = ref('')
const selectedCategory = ref('all')
const selectedAgent = ref(getDefaultAgent())
const showStats = ref(false)

const categories = getCategoryList()

const searchHistory = ref([])
const recommendedKeywords = ref([])

const newsList = ref([])
const loading = ref(false)
const refreshing = ref(false)
const finished = ref(false)
const hasSearched = ref(false)
const currentPage = ref(1)

const chartRef = ref(null)
let chartInstance = null

// 初始化图表
const initChart = () => {
  if (!chartRef.value || !showStats.value) return
  
  if (chartInstance) {
    chartInstance.dispose()
  }
  
  chartInstance = echarts.init(chartRef.value)
  updateChart()
}

const updateChart = () => {
  if (!chartInstance) return
  
  const sourceStats = {}
  newsList.value.forEach(news => {
    sourceStats[news.source] = (sourceStats[news.source] || 0) + 1
  })
  
  const data = Object.entries(sourceStats).map(([name, value]) => ({ name, value }))
  
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
  const textColor = isDark ? '#e8eaf6' : '#1a1a2e'
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: 10,
      textStyle: { color: textColor, fontSize: 12 }
    },
    series: [
      {
        type: 'pie',
        radius: ['35%', '60%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: isDark ? '#1a1f2e' : '#ffffff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        data: data.length > 0 ? data : [{ name: '暂无数据', value: 1 }]
      }
    ]
  }
  
  chartInstance.setOption(option)
}

watch(showStats, (val) => {
  if (val) {
    nextTick(() => {
      initChart()
    })
  }
})

const loadSearchHistory = () => {
  searchHistory.value = searchHistoryStorage.get()
}

const loadRecommendations = async () => {
  try {
    const res = await getRecommendedKeywords(selectedAgent.value)
    if (res.code === 0) {
      recommendedKeywords.value = res.data
    }
  } catch (error) {
    console.error('Failed to load recommendations:', error)
  }
}

const selectCategory = (category) => {
  selectedCategory.value = category
  if (searchKeyword.value.trim()) {
    onSearch()
  }
}

const onSearch = async () => {
  if (!searchKeyword.value.trim()) {
    showToast('请输入搜索关键词')
    return
  }
  
  searchHistoryStorage.add(searchKeyword.value, selectedCategory.value)
  loadSearchHistory()
  
  hasSearched.value = true
  currentPage.value = 1
  finished.value = false
  newsList.value = []
  
  await loadNews()
}

const quickSearch = (keyword, category) => {
  searchKeyword.value = keyword
  selectedCategory.value = category
  onSearch()
}

const clearHistory = () => {
  showConfirmDialog({
    title: '确认清空',
    message: '确定要清空搜索历史吗？'
  }).then(() => {
    searchHistoryStorage.clear()
    searchHistory.value = []
    showToast('已清空')
  }).catch(() => {})
}

const refreshRecommendations = () => {
  loadRecommendations()
  showToast('已刷新')
}

const loadNews = async () => {
  if (loading.value) return
  
  loading.value = true
  
  try {
    const res = await searchNews({
      keyword: searchKeyword.value,
      category: selectedCategory.value,
      agent: selectedAgent.value,
      page: currentPage.value,
      pageSize: 10
    })
    
    if (res.code === 0) {
      if (currentPage.value === 1) {
        newsList.value = res.data.list
      } else {
        newsList.value.push(...res.data.list)
      }
      
      if (newsList.value.length >= res.data.total) {
        finished.value = true
      }
    }
  } catch (error) {
    showToast('搜索失败')
    console.error('Search error:', error)
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

const onRefresh = () => {
  currentPage.value = 1
  finished.value = false
  loadNews()
}

const onLoad = () => {
  if (!hasSearched.value) {
    loading.value = false
    return
  }
  currentPage.value++
  loadNews()
}

const goToDetail = (news) => {
  newsHistoryStorage.add(news)
  
  router.push({
    name: 'NewsDetail',
    params: { id: news.id },
    query: { 
      title: news.title,
      agent: news.agent,
      keyword: news.keyword
    }
  })
}

onMounted(() => {
  const settings = settingsStorage.get()
  if (settings.agent) {
    selectedAgent.value = settings.agent
  }
  loadSearchHistory()
  loadRecommendations()
})
</script>

<style scoped lang="scss">
.home-page {
  min-height: 100vh;
}

.search-section {
  padding: 12px;
}

.search-row {
  display: flex;
  align-items: center;
  gap: 8px;
  
  :deep(.van-search) {
    flex: 1;
    padding: 0;
  }
  
  .search-btn {
    flex-shrink: 0;
  }
}

.category-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--divider-color);
}

.category-tag {
  padding: 4px 12px;
  font-size: 13px;
  color: var(--text-secondary);
  background-color: var(--surface-color);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &.active {
    color: #fff;
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
  }
}

.quick-section {
  padding: 16px;
}

.quick-block {
  & + .quick-block {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--divider-color);
  }
}

.quick-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 13px;
  color: var(--text-tertiary);
  
  .van-icon {
    padding: 4px;
    cursor: pointer;
  }
}

.quick-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-tag {
  padding: 6px 12px;
  font-size: 13px;
  color: var(--text-secondary);
  background-color: var(--surface-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &.primary {
    color: var(--primary-color);
    background-color: var(--primary-light);
  }
}

.news-section {
  margin-top: 8px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 4px;
  margin-bottom: 8px;
  
  .result-text {
    font-size: 13px;
    color: var(--text-tertiary);
  }
  
  .stats-icon {
    font-size: 18px;
    color: var(--primary-color);
    padding: 4px;
    cursor: pointer;
  }
}

.stats-popup {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  
  .van-icon {
    padding: 4px;
    cursor: pointer;
    color: var(--text-tertiary);
  }
}

.chart-container {
  flex: 1;
  min-height: 200px;
}
</style>
