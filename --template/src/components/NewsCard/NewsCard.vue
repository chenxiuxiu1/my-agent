<template>
  <div class="news-card" @click="handleClick">
    <div class="news-main">
      <h3 class="news-title">{{ news.title }}</h3>
      <p class="news-summary">{{ plainSummary }}</p>
      <div class="news-meta">
        <span class="news-source">{{ news.source }}</span>
        <span class="dot">·</span>
        <span class="news-time">{{ formatTime(news.publishTime) }}</span>
        <van-tag v-if="news.category" size="small" type="primary" plain>{{ news.category }}</van-tag>
      </div>
    </div>
    <div v-if="news.image" class="news-image">
      <img :src="news.image" :alt="news.title" loading="lazy">
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatTime } from '@/utils/timer.js'

const props = defineProps({
  news: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['click'])

const plainSummary = computed(() => {
  if (!props.news.summary) return ''
  return props.news.summary.replace(/<[^>]*>/g, '').slice(0, 60) + '...'
})

const handleClick = () => {
  emit('click', props.news)
}
</script>

<style scoped lang="scss">
.news-card {
  display: flex;
  gap: 12px;
  padding: 14px;
  background-color: var(--card-background);
  border-radius: 12px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:active {
    transform: scale(0.995);
    background-color: var(--hover-background);
  }
}

.news-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.news-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-color);
  line-height: 1.4;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.news-summary {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 10px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.news-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: auto;
}

.news-source {
  font-weight: 500;
  color: var(--primary-color);
}

.dot {
  opacity: 0.5;
}

.news-time {
  flex-shrink: 0;
}

.news-image {
  width: 88px;
  height: 66px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

@media (max-width: 375px) {
  .news-image {
    width: 72px;
    height: 54px;
  }
}
</style>
