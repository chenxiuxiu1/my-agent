<template>
  <div class="app-wrapper">
    <router-view v-slot="{ Component }">
      <keep-alive :include="['Home', 'History', 'Settings']">
        <component :is="Component" />
      </keep-alive>
    </router-view>
    
    <!-- 底部导航 -->
    <van-tabbar v-model="activeTab" route class="bottom-tabbar" safe-area-inset-bottom>
      <van-tabbar-item to="/" icon="home-o">首页</van-tabbar-item>
      <van-tabbar-item to="/history" icon="clock-o">历史</van-tabbar-item>
      <van-tabbar-item to="/settings" icon="setting-o">设置</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const activeTab = ref(0)

const tabRoutes = ['/', '/history', '/settings']

watch(() => route.path, (path) => {
  const index = tabRoutes.indexOf(path)
  if (index !== -1) {
    activeTab.value = index
  }
}, { immediate: true })
</script>

<style scoped lang="scss">
.app-wrapper {
  min-height: 100vh;
  background-color: var(--background-color);
  padding-bottom: 60px;
}

.bottom-tabbar {
  background-color: var(--card-background);
  border-top: 1px solid var(--border-color);
  
  :deep(.van-tabbar-item) {
    color: var(--text-tertiary);
    background-color: transparent;
    
    &.van-tabbar-item--active {
      color: var(--primary-color);
      background-color: transparent;
    }
    
    .van-tabbar-item__icon {
      font-size: 22px;
    }
    
    .van-tabbar-item__text {
      font-size: 11px;
    }
  }
}
</style>
