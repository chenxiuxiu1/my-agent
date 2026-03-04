<template>
  <div class="news-detail-page">
    <van-nav-bar
      :title="pageTitle"
      left-arrow
      @click-left="goBack"
      fixed
      placeholder
    />
    
    <div class="detail-container">
      <div v-if="loading" class="skeleton-wrapper">
        <van-skeleton title :row="10" />
      </div>
      
      <template v-else-if="news">
        <div class="news-header">
          <h1 class="news-title">{{ news.title }}</h1>
          <div class="news-meta">
            <span class="news-source">{{ news.source }}</span>
            <span class="news-time">{{ formatDateTime(news.publishTime) }}</span>
            <van-tag v-if="news.category" type="primary">{{ news.category }}</van-tag>
          </div>
        </div>
        
        <div v-if="news.image" class="news-image">
          <img :src="news.image" :alt="news.title">
        </div>
        
        <div class="news-content" v-html="news.content"></div>
        
        <div class="news-footer">
          <div class="news-tags">
            <van-tag v-if="news.keyword" plain>{{ news.keyword }}</van-tag>
            <van-tag v-if="news.agent" type="success">{{ getAgentName(news.agent) }}</van-tag>
          </div>
          <van-button 
            type="primary" 
            size="small" 
            round 
            block
            :url="news.url"
            target="_blank"
          >
            查看原文
          </van-button>
        </div>
      </template>
      
      <div v-else class="error-state">
        <van-icon name="fail" />
        <p>加载失败，请重试</p>
        <van-button type="primary" size="small" @click="loadNewsDetail">重新加载</van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getNewsDetail, getAgentList } from '@/api/agents.js'
import { formatDateTime } from '@/utils/timer.js'

const route = useRoute()
const router = useRouter()

const news = ref(null)
const loading = ref(false)

const pageTitle = computed(() => {
  return route.query.title ? '新闻详情' : '新闻详情'
})

const getAgentName = (agentValue) => {
  const agents = getAgentList()
  const agent = agents.find(a => a.value === agentValue)
  return agent ? agent.text : agentValue
}

const loadNewsDetail = async () => {
  const { id } = route.params
  if (!id) {
    showToast('新闻ID不存在')
    return
  }
  
  loading.value = true
  
  try {
    const agent = route.query.agent || 'deepseek'
    const title = route.query.title || ''
    const keyword = route.query.keyword || ''
    const res = await getNewsDetail(Number(id), title, keyword, agent)
    
    if (res.code === 0) {
      news.value = res.data
    } else {
      showToast('获取新闻详情失败')
    }
  } catch (error) {
    console.error('Load news detail error:', error)
    showToast('加载失败，请重试')
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.back()
}

onMounted(() => {
  loadNewsDetail()
})
</script>

<style scoped lang="scss">
.news-detail-page {
  min-height: 100vh;
  background-color: var(--background-color);
}

.detail-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 16px;
}

.skeleton-wrapper {
  padding: 16px;
  background-color: var(--card-background);
  border-radius: 12px;
}

.news-header {
  background-color: var(--card-background);
  padding: 20px 16px;
  border-radius: 12px;
  margin-bottom: 16px;
}

.news-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-color);
  line-height: 1.5;
  margin-bottom: 12px;
}

.news-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 13px;
  color: var(--text-tertiary);
}

.news-source {
  font-weight: 500;
  color: var(--primary-color);
}

.news-image {
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
  
  img {
    width: 100%;
    height: auto;
    display: block;
  }
}

.news-content {
  background-color: var(--card-background);
  padding: 20px 16px;
  border-radius: 12px;
  margin-bottom: 16px;
  font-size: 16px;
  line-height: 1.8;
  color: var(--text-color);
  
  :deep(p) {
    margin-bottom: 16px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  :deep(img) {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin: 12px 0;
  }
  
  :deep(a) {
    color: var(--primary-color);
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
}

.news-footer {
  background-color: var(--card-background);
  padding: 16px;
  border-radius: 12px;
  
  .news-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
  }
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  color: var(--text-tertiary);
  
  .van-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }
  
  p {
    margin-bottom: 16px;
  }
}
</style>
