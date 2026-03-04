<template>
  <div class="home-page">
    <div class="page-container">
      <!-- 搜索栏 -->
      <div class="search-section card">
        <div class="search-row">
          <van-search
            v-model="searchKeyword"
            placeholder="输入关键词进行智能分析..."
            shape="round"
            @search="onSearch"
            :disabled="isAnalyzing"
          />
          <van-button 
            type="primary" 
            size="small" 
            round
            class="search-btn"
            @click="onSearch"
            :loading="isAnalyzing"
            :disabled="isAnalyzing"
          >
            {{ isAnalyzing ? '分析中' : '分析' }}
          </van-button>
        </div>
      </div>
      
      <!-- 搜索历史和推荐 -->
      <div v-if="!hasSearched && !isAnalyzing" class="quick-section card">
        <div v-if="searchHistory.length > 0" class="quick-block">
          <div class="quick-header">
            <span>最近分析</span>
            <van-icon name="delete-o" @click="clearHistory" />
          </div>
          <div class="quick-tags">
            <span
              v-for="(item, index) in searchHistory.slice(0, 5)"
              :key="index"
              class="quick-tag"
              @click="quickSearch(item.keyword)"
            >
              {{ item.keyword }}
            </span>
          </div>
        </div>
        
        <div class="quick-block">
          <div class="quick-header">
            <span>热门分析</span>
            <van-icon name="refresh" @click="refreshRecommendations" />
          </div>
          <div class="quick-tags">
            <span
              v-for="(keyword, index) in recommendedKeywords"
              :key="index"
              class="quick-tag primary"
              @click="quickSearch(keyword)"
            >
              {{ keyword }}
            </span>
          </div>
        </div>
      </div>
      
      <!-- 思考过程展示 -->
      <div v-if="isAnalyzing && thinkingPoints.length > 0" class="thinking-section">
        <div class="card thinking-card">
          <div class="thinking-header">
            <div class="thinking-icon">
              <van-icon name="bulb-o" />
            </div>
            <span>正在分析...</span>
          </div>
          <div class="thinking-content">
            <div 
              v-for="(point, index) in displayedThinkingPoints" 
              :key="index"
              class="thinking-point"
              :class="{ 'show': index < displayedThinkingPoints.length }"
            >
              <span class="point-bullet">•</span>
              <span class="point-text">{{ point }}</span>
            </div>
          </div>
          <div class="thinking-cursor" v-if="isThinking">
            <span class="cursor"></span>
          </div>
        </div>
      </div>

      <!-- 加载中提示（无思考内容时） -->
      <div v-if="isAnalyzing && thinkingPoints.length === 0" class="loading-state">
        <van-loading type="spinner" color="var(--primary-color)" />
        <p>正在准备分析...</p>
      </div>
      
      <!-- 分析报告 -->
      <div v-if="!isAnalyzing && analysisResult" class="analysis-section">
        <!-- 概述卡片 -->
        <div class="card summary-card">
          <div class="card-header">
            <van-icon name="description" />
            <span>分析概述</span>
          </div>
          <p class="summary-text">{{ analysisResult.summary }}</p>
          <div class="analysis-time">
            <van-icon name="clock-o" />
            <span>{{ formatTime(analysisResult.timestamp) }}</span>
          </div>
        </div>

        <!-- 市场数据 -->
        <div v-if="analysisResult.marketData && analysisResult.marketData.length > 0" class="card">
          <div class="card-header">
            <van-icon name="chart-trending-o" />
            <span>市场数据</span>
          </div>
          <div class="market-data-grid">
            <div 
              v-for="(item, index) in analysisResult.marketData" 
              :key="index"
              class="market-item"
            >
              <div class="market-name">{{ item.name }}</div>
              <div class="market-value">{{ item.value }}</div>
              <div 
                class="market-change"
                :class="{ 'up': item.trend === 'up', 'down': item.trend === 'down' }"
              >
                {{ item.change }}
                <van-icon :name="item.trend === 'up' ? 'arrow-up' : item.trend === 'down' ? 'arrow-down' : 'minus'" />
              </div>
            </div>
          </div>
        </div>

        <!-- 相关标的 -->
        <div v-if="analysisResult.stocks && analysisResult.stocks.length > 0" class="card">
          <div class="card-header">
            <van-icon name="points" />
            <span>相关标的</span>
          </div>
          <div class="stocks-list">
            <div 
              v-for="(stock, index) in analysisResult.stocks" 
              :key="index"
              class="stock-item"
            >
              <div class="stock-info">
                <span class="stock-name">{{ stock.name }}</span>
                <span class="stock-code">{{ stock.code }}</span>
              </div>
              <div class="stock-price">
                <span class="price">{{ stock.price }}</span>
                <span 
                  class="change"
                  :class="{ 'up': stock.change.startsWith('+'), 'down': stock.change.startsWith('-') }"
                >
                  {{ stock.change }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 趋势图表 -->
        <div v-if="analysisResult.chartData" class="card">
          <div class="card-header">
            <van-icon name="bar-chart-o" />
            <span>{{ analysisResult.chartData.title || '趋势分析' }}</span>
          </div>
          <div ref="chartRef" class="analysis-chart"></div>
        </div>

        <!-- 分析要点 -->
        <div v-if="analysisResult.keyPoints && analysisResult.keyPoints.length > 0" class="card">
          <div class="card-header">
            <van-icon name="bulb-o" />
            <span>分析要点</span>
          </div>
          <div class="key-points">
            <div 
              v-for="(point, index) in analysisResult.keyPoints" 
              :key="index"
              class="key-point-item"
            >
              <div class="point-index">{{ index + 1 }}</div>
              <div class="point-content">
                <div class="point-title">{{ point.title }}</div>
                <div class="point-desc">{{ point.content }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 总结建议 -->
        <div v-if="analysisResult.conclusion" class="card conclusion-card">
          <div class="card-header">
            <van-icon name="bookmark-o" />
            <span>总结建议</span>
          </div>
          <p class="conclusion-text">{{ analysisResult.conclusion }}</p>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-if="!hasSearched && !isAnalyzing" class="empty-state">
        <van-icon name="search" />
        <p>输入关键词开始智能分析</p>
        <span class="empty-hint">支持股票、行业、概念等分析</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import * as echarts from 'echarts'
import { getThinkingProcess, analyzeKeyword, getRecommendedKeywords } from '@/api/agents.js'
import { searchHistoryStorage, themeStorage } from '@/utils/storage.js'

const router = useRouter()

const searchKeyword = ref('')
const isAnalyzing = ref(false)
const hasSearched = ref(false)
const analysisResult = ref(null)

// 思考过程相关
const thinkingPoints = ref([])
const displayedThinkingPoints = ref([])
const isThinking = ref(false)

const searchHistory = ref([])
const recommendedKeywords = ref([])

const chartRef = ref(null)
let chartInstance = null

// 打字机效果展示思考要点
const typeWriterEffect = async (points) => {
  displayedThinkingPoints.value = []
  isThinking.value = true
  
  for (let i = 0; i < points.length; i++) {
    // 随机延迟，模拟打字效果
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400))
    displayedThinkingPoints.value.push(points[i])
  }
  
  isThinking.value = false
}

// 初始化图表
const initChart = () => {
  if (!chartRef.value || !analysisResult.value?.chartData) return
  
  if (chartInstance) {
    chartInstance.dispose()
  }
  
  chartInstance = echarts.init(chartRef.value)
  updateChart()
}

const updateChart = () => {
  if (!chartInstance || !analysisResult.value?.chartData) return
  
  const chartData = analysisResult.value.chartData
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
  const textColor = isDark ? '#e8eaf6' : '#1a1a2e'
  const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
  
  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark ? 'rgba(30,30,46,0.9)' : 'rgba(255,255,255,0.9)',
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      textStyle: { color: textColor }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: chartData.xAxis || [],
      axisLine: { lineStyle: { color: gridColor } },
      axisLabel: { color: textColor, fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: gridColor } },
      axisLabel: { color: textColor, fontSize: 11 }
    },
    series: [{
      name: chartData.seriesName || '数据',
      type: 'line',
      data: chartData.yAxis || [],
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: {
        color: '#4a6cf7',
        width: 2
      },
      itemStyle: {
        color: '#4a6cf7',
        borderWidth: 2,
        borderColor: isDark ? '#1e1e2e' : '#fff'
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(74, 108, 247, 0.3)' },
          { offset: 1, color: 'rgba(74, 108, 247, 0.05)' }
        ])
      }
    }]
  }
  
  chartInstance.setOption(option)
}

// 监听主题变化
watch(() => themeStorage.get(), () => {
  nextTick(() => {
    if (chartInstance) {
      chartInstance.dispose()
      initChart()
    }
  })
})

// 监听分析结果变化，初始化图表
watch(() => analysisResult.value, () => {
  if (analysisResult.value?.chartData) {
    nextTick(() => {
      initChart()
    })
  }
})

// 搜索 - 两步流程
const onSearch = async () => {
  if (!searchKeyword.value.trim()) {
    showToast('请输入关键词')
    return
  }
  
  const keyword = searchKeyword.value.trim()
  isAnalyzing.value = true
  hasSearched.value = true
  analysisResult.value = null
  thinkingPoints.value = []
  displayedThinkingPoints.value = []
  
  try {
    // 第一步：获取思考过程
    const thinkingRes = await getThinkingProcess({ keyword })
    
    if (thinkingRes.code === 0 && thinkingRes.data) {
      thinkingPoints.value = thinkingRes.data.thinkingPoints
      // 展示打字机效果
      await typeWriterEffect(thinkingPoints.value)
    }
    
    // 第二步：生成完整报告
    const analysisRes = await analyzeKeyword({ keyword })
    
    if (analysisRes.code === 0 && analysisRes.data) {
      analysisResult.value = analysisRes.data
      // 保存搜索历史
      searchHistoryStorage.add({ keyword, timestamp: Date.now() })
      loadSearchHistory()
    } else {
      showToast(analysisRes.message || '分析失败')
    }
  } catch (error) {
    console.error('Search error:', error)
    showToast('分析失败，请重试')
  } finally {
    isAnalyzing.value = false
  }
}

// 快速搜索
const quickSearch = (keyword) => {
  searchKeyword.value = keyword
  onSearch()
}

// 加载搜索历史
const loadSearchHistory = () => {
  searchHistory.value = searchHistoryStorage.get()
}

// 清空历史
const clearHistory = () => {
  showConfirmDialog({
    title: '确认清空',
    message: '确定要清空所有搜索历史吗？'
  }).then(() => {
    searchHistoryStorage.clear()
    searchHistory.value = []
    showToast('已清空')
  }).catch(() => {})
}

// 刷新推荐
const refreshRecommendations = () => {
  recommendedKeywords.value = getRecommendedKeywords()
}

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 初始化
onMounted(() => {
  loadSearchHistory()
  refreshRecommendations()
})
</script>

<style scoped lang="scss">
.home-page {
  min-height: 100%;
}

.page-container {
  padding: 12px;
}

.card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid var(--border-color);
}

.search-section {
  padding: 12px;
  margin-bottom: 12px;
}

.search-row {
  display: flex;
  align-items: center;
  gap: 8px;
  
  :deep(.van-search) {
    flex: 1;
    padding: 0;
    background: transparent;
    
    .van-search__content {
      background: var(--bg-secondary);
      border-radius: 20px;
    }
  }
  
  .search-btn {
    height: 36px;
    padding: 0 16px;
    font-size: 14px;
  }
}

.quick-section {
  .quick-block {
    margin-bottom: 16px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  .quick-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    font-size: 14px;
    color: var(--text-secondary);
    
    .van-icon {
      padding: 4px;
      cursor: pointer;
      color: var(--text-tertiary);
    }
  }
  
  .quick-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .quick-tag {
    padding: 6px 12px;
    background: var(--bg-secondary);
    border-radius: 16px;
    font-size: 13px;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s;
    
    &:active {
      opacity: 0.7;
    }
    
    &.primary {
      background: rgba(74, 108, 247, 0.1);
      color: var(--primary-color);
    }
  }
}

// 思考过程样式
.thinking-section {
  .thinking-card {
    background: linear-gradient(135deg, rgba(74, 108, 247, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
    border: 1px solid rgba(74, 108, 247, 0.15);
  }
  
  .thinking-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    font-size: 15px;
    font-weight: 600;
    color: var(--primary-color);
    
    .thinking-icon {
      width: 28px;
      height: 28px;
      background: linear-gradient(135deg, var(--primary-color) 0%, #8b5cf6 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pulse 2s infinite;
      
      .van-icon {
        color: white;
        font-size: 16px;
      }
    }
  }
  
  .thinking-content {
    min-height: 120px;
  }
  
  .thinking-point {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 10px;
    opacity: 0;
    transform: translateY(10px);
    animation: fadeInUp 0.4s ease forwards;
    
    @for $i from 1 through 10 {
      &:nth-child(#{$i}) {
        animation-delay: #{$i * 0.05}s;
      }
    }
    
    &.show {
      opacity: 1;
      transform: translateY(0);
    }
    
    .point-bullet {
      color: var(--primary-color);
      font-weight: bold;
      font-size: 14px;
      line-height: 1.6;
    }
    
    .point-text {
      font-size: 14px;
      color: var(--text-secondary);
      line-height: 1.6;
    }
  }
  
  .thinking-cursor {
    margin-top: 12px;
    padding-left: 16px;
    
    .cursor {
      display: inline-block;
      width: 2px;
      height: 18px;
      background: var(--primary-color);
      animation: blink 1s infinite;
      vertical-align: middle;
    }
  }
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(74, 108, 247, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(74, 108, 247, 0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}

.analysis-section {
  .card-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 15px;
    font-weight: 600;
    color: var(--text-color);
    margin-bottom: 12px;
    
    .van-icon {
      font-size: 18px;
      color: var(--primary-color);
    }
  }
}

.summary-card {
  .summary-text {
    font-size: 14px;
    line-height: 1.7;
    color: var(--text-secondary);
    margin-bottom: 12px;
  }
  
  .analysis-time {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--text-tertiary);
    
    .van-icon {
      font-size: 12px;
    }
  }
}

.market-data-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.market-item {
  background: var(--bg-secondary);
  border-radius: 10px;
  padding: 12px;
  text-align: center;
  
  .market-name {
    font-size: 12px;
    color: var(--text-tertiary);
    margin-bottom: 6px;
  }
  
  .market-value {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-color);
    margin-bottom: 4px;
  }
  
  .market-change {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-size: 12px;
    font-weight: 500;
    
    &.up {
      color: #f44336;
    }
    
    &.down {
      color: #4caf50;
    }
    
    .van-icon {
      font-size: 10px;
    }
  }
}

.stocks-list {
  .stock-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid var(--border-color);
    
    &:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    
    &:first-child {
      padding-top: 0;
    }
  }
  
  .stock-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    
    .stock-name {
      font-size: 15px;
      font-weight: 500;
      color: var(--text-color);
    }
    
    .stock-code {
      font-size: 12px;
      color: var(--text-tertiary);
    }
  }
  
  .stock-price {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
    
    .price {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-color);
    }
    
    .change {
      font-size: 12px;
      font-weight: 500;
      
      &.up {
        color: #f44336;
      }
      
      &.down {
        color: #4caf50;
      }
    }
  }
}

.analysis-chart {
  height: 200px;
  width: 100%;
}

.key-points {
  .key-point-item {
    display: flex;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid var(--border-color);
    
    &:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    
    &:first-child {
      padding-top: 0;
    }
  }
  
  .point-index {
    width: 24px;
    height: 24px;
    min-width: 24px;
    background: var(--primary-color);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
  }
  
  .point-content {
    flex: 1;
  }
  
  .point-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-color);
    margin-bottom: 4px;
  }
  
  .point-desc {
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.6;
  }
}

.conclusion-card {
  background: linear-gradient(135deg, rgba(74, 108, 247, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%);
  border: 1px solid rgba(74, 108, 247, 0.2);
  
  .conclusion-text {
    font-size: 14px;
    line-height: 1.8;
    color: var(--text-secondary);
  }
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  color: var(--text-secondary);
  
  p {
    margin-top: 16px;
    font-size: 15px;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 16px;
  color: var(--text-tertiary);
  
  .van-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
  }
  
  p {
    font-size: 15px;
    margin-bottom: 8px;
  }
  
  .empty-hint {
    font-size: 13px;
    opacity: 0.7;
  }
}
</style>
