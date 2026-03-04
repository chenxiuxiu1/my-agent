<template>
  <div class="settings-page">
    <div class="page-container">
      <h2 class="page-title">设置</h2>
      
      <!-- 搜索设置 -->
      <div class="settings-group">
        <div class="group-title">搜索</div>
        <div class="settings-card">
          <div class="setting-item action-item" @click="showAgentPicker = true">
            <div class="setting-info">
              <van-icon name="cluster-o" class="setting-icon" />
              <div class="setting-text">
                <div class="setting-name">智能体</div>
                <div class="setting-desc">{{ selectedAgentName }}</div>
              </div>
            </div>
            <div class="setting-right">
              <span class="sub-value">{{ selectedAgentName }}</span>
              <van-icon name="arrow" class="arrow-icon" />
            </div>
          </div>
        </div>
      </div>
      
      <!-- 外观设置 -->
      <div class="settings-group">
        <div class="group-title">外观</div>
        <div class="settings-card">
          <div class="setting-item" @click="toggleTheme">
            <div class="setting-info">
              <van-icon :name="isDarkTheme ? 'moon-o' : 'sun-o'" class="setting-icon" />
              <div class="setting-text">
                <div class="setting-name">深色模式</div>
                <div class="setting-desc">{{ isDarkTheme ? '已开启' : '已关闭' }}</div>
              </div>
            </div>
            <van-switch v-model="isDarkTheme" @click.stop @change="onThemeChange" />
          </div>
        </div>
      </div>
      
      <!-- 定时更新设置 -->
      <div class="settings-group">
        <div class="group-title">自动更新</div>
        <div class="settings-card">
          <div class="setting-item">
            <div class="setting-info">
              <van-icon name="clock-o" class="setting-icon" />
              <div class="setting-text">
                <div class="setting-name">启用自动更新</div>
                <div class="setting-desc">按设定间隔自动搜索关注内容</div>
              </div>
            </div>
            <van-switch v-model="autoUpdate" @change="onAutoUpdateChange" />
          </div>
          
          <div v-if="autoUpdate" class="sub-settings">
            <div class="sub-item" @click="showIntervalPicker = true">
              <span>更新间隔</span>
              <span class="sub-value">{{ intervalText }}</span>
            </div>
            <div class="sub-item">
              <span>关注关键词</span>
              <van-field
                v-model="keywordsInput"
                placeholder="用逗号分隔"
                size="small"
                @blur="onKeywordsBlur"
              />
            </div>
            <div class="sub-item tags-item">
              <span>订阅分类</span>
              <div class="category-tags">
                <span
                  v-for="cat in categories"
                  :key="cat.value"
                  class="cat-tag"
                  :class="{ active: selectedCategories.includes(cat.value) }"
                  @click="toggleCategory(cat.value)"
                >
                  {{ cat.text }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 数据管理 -->
      <div class="settings-group">
        <div class="group-title">数据</div>
        <div class="settings-card">
          <div class="setting-item action-item" @click="clearNewsHistory">
            <div class="setting-info">
              <van-icon name="delete-o" class="setting-icon" />
              <span class="setting-name">清空浏览历史</span>
            </div>
            <van-icon name="arrow" class="arrow-icon" />
          </div>
          <div class="setting-item action-item" @click="clearSearchHistory">
            <div class="setting-info">
              <van-icon name="search" class="setting-icon" />
              <span class="setting-name">清空搜索历史</span>
            </div>
            <van-icon name="arrow" class="arrow-icon" />
          </div>
          <div class="setting-item action-item" @click="resetSettings">
            <div class="setting-info">
              <van-icon name="replay" class="setting-icon" />
              <span class="setting-name">重置所有设置</span>
            </div>
            <van-icon name="arrow" class="arrow-icon" />
          </div>
        </div>
      </div>
      
      <!-- 关于 -->
      <div class="settings-group">
        <div class="group-title">关于</div>
        <div class="settings-card">
          <div class="setting-item">
            <div class="setting-info">
              <van-icon name="info-o" class="setting-icon" />
              <span class="setting-name">版本</span>
            </div>
            <span class="version-text">v1.0.0</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 智能体选择器 -->
    <van-popup v-model:show="showAgentPicker" position="bottom" round>
      <van-picker
        :columns="agentColumns"
        @confirm="onAgentConfirm"
        @cancel="showAgentPicker = false"
        :default-index="defaultAgentIndex"
      />
    </van-popup>
    
    <!-- 间隔选择器 -->
    <van-popup v-model:show="showIntervalPicker" position="bottom" round>
      <van-picker
        :columns="intervalColumns"
        @confirm="onIntervalConfirm"
        @cancel="showIntervalPicker = false"
        :default-index="defaultIntervalIndex"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { showConfirmDialog, showToast } from 'vant'
import { settingsStorage, themeStorage, newsHistoryStorage, searchHistoryStorage } from '@/utils/storage.js'
import { intervalOptions, getIntervalText, timerManager } from '@/utils/timer.js'
import { getAgentList, getDefaultAgent, getCategoryList } from '@/api/agents.js'

const isDarkTheme = ref(false)
const autoUpdate = ref(false)
const updateInterval = ref(10 * 60 * 1000)
const keywords = ref([])
const keywordsInput = ref('')
const selectedCategories = ref([])
const showIntervalPicker = ref(false)
const showAgentPicker = ref(false)
const selectedAgent = ref(getDefaultAgent())

const agents = getAgentList()
const categories = getCategoryList().filter(cat => cat.value !== 'all')

const agentColumns = computed(() => agents)
const selectedAgentName = computed(() => {
  const agent = agents.find(a => a.value === selectedAgent.value)
  return agent ? agent.text : 'DeepSeek'
})
const defaultAgentIndex = computed(() => agents.findIndex(a => a.value === selectedAgent.value))

const intervalText = computed(() => getIntervalText(updateInterval.value))
const intervalColumns = intervalOptions.map(opt => ({ text: opt.text, value: opt.value }))
const defaultIntervalIndex = computed(() => intervalOptions.findIndex(opt => opt.value === updateInterval.value))

const toggleTheme = () => {
  isDarkTheme.value = !isDarkTheme.value
  onThemeChange(isDarkTheme.value)
}

const onThemeChange = (value) => {
  const theme = value ? 'dark' : 'light'
  themeStorage.set(theme)
  settingsStorage.set({ theme })
}

const onAutoUpdateChange = (value) => {
  settingsStorage.set({ autoUpdate: value })
  if (value) {
    startTimer()
    showToast('自动更新已开启')
  } else {
    timerManager.clearTimer()
    showToast('自动更新已关闭')
  }
}

const onAgentConfirm = ({ selectedOptions }) => {
  selectedAgent.value = selectedOptions[0].value
  showAgentPicker.value = false
  settingsStorage.set({ agent: selectedAgent.value })
  showToast(`已切换到 ${selectedOptions[0].text}`)
}

const onIntervalConfirm = ({ selectedOptions }) => {
  updateInterval.value = selectedOptions[0].value
  showIntervalPicker.value = false
  settingsStorage.set({ updateInterval: updateInterval.value })
  
  if (autoUpdate.value) {
    startTimer()
  }
}

const onKeywordsBlur = () => {
  if (keywordsInput.value.trim()) {
    const newKeywords = keywordsInput.value.split(/[,，]/).map(k => k.trim()).filter(k => k)
    keywords.value = [...new Set([...keywords.value, ...newKeywords])]
    keywordsInput.value = ''
    settingsStorage.set({ keywords: keywords.value })
  }
}

const toggleCategory = (category) => {
  const index = selectedCategories.value.indexOf(category)
  if (index > -1) {
    selectedCategories.value.splice(index, 1)
  } else {
    selectedCategories.value.push(category)
  }
  settingsStorage.set({ categories: selectedCategories.value })
}

const startTimer = () => {
  timerManager.setTimer(() => {
    console.log('Auto update triggered')
  }, updateInterval.value)
}

const clearNewsHistory = () => {
  showConfirmDialog({
    title: '确认清空',
    message: '确定要清空所有浏览历史吗？'
  }).then(() => {
    newsHistoryStorage.clear()
    showToast('浏览历史已清空')
  }).catch(() => {})
}

const clearSearchHistory = () => {
  showConfirmDialog({
    title: '确认清空',
    message: '确定要清空所有搜索历史吗？'
  }).then(() => {
    searchHistoryStorage.clear()
    showToast('搜索历史已清空')
  }).catch(() => {})
}

const resetSettings = () => {
  showConfirmDialog({
    title: '确认重置',
    message: '确定要重置所有设置吗？'
  }).then(() => {
    const defaultSettings = {
      autoUpdate: false,
      updateInterval: 10 * 60 * 1000,
      keywords: [],
      categories: [],
      theme: 'light',
      agent: getDefaultAgent()
    }
    settingsStorage.set(defaultSettings)
    themeStorage.set('light')
    isDarkTheme.value = false
    autoUpdate.value = false
    updateInterval.value = 10 * 60 * 1000
    keywords.value = []
    selectedCategories.value = []
    selectedAgent.value = getDefaultAgent()
    showToast('设置已重置')
  }).catch(() => {})
}

onMounted(() => {
  const settings = settingsStorage.get()
  isDarkTheme.value = settings.theme === 'dark'
  autoUpdate.value = settings.autoUpdate
  updateInterval.value = settings.updateInterval
  keywords.value = settings.keywords || []
  selectedCategories.value = settings.categories || []
  if (settings.agent) {
    selectedAgent.value = settings.agent
  }
})
</script>

<style scoped lang="scss">
.settings-page {
  min-height: 100vh;
}

.settings-group {
  margin-bottom: 20px;
}

.group-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  padding-left: 4px;
}

.settings-card {
  background-color: var(--card-background);
  border-radius: 16px;
  overflow: hidden;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  
  & + .setting-item {
    border-top: 1px solid var(--divider-color);
  }
  
  &.action-item {
    cursor: pointer;
    
    &:active {
      background-color: var(--hover-background);
    }
  }
}

.setting-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.setting-icon {
  font-size: 20px;
  color: var(--primary-color);
}

.setting-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.setting-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-color);
}

.setting-desc {
  font-size: 12px;
  color: var(--text-tertiary);
}

.setting-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.arrow-icon {
  font-size: 14px;
  color: var(--text-tertiary);
}

.version-text {
  font-size: 14px;
  color: var(--text-tertiary);
}

.sub-settings {
  padding: 0 16px 16px;
  border-top: 1px solid var(--divider-color);
}

.sub-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  font-size: 14px;
  color: var(--text-secondary);
  
  & + .sub-item {
    border-top: 1px solid var(--divider-color);
  }
  
  .sub-value {
    color: var(--primary-color);
    font-weight: 500;
  }
  
  :deep(.van-field) {
    width: 120px;
    padding: 4px 8px;
    background-color: var(--surface-color);
    border-radius: 8px;
  }
}

.tags-item {
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

.category-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;
}

.cat-tag {
  padding: 4px 10px;
  font-size: 12px;
  color: var(--text-secondary);
  background-color: var(--surface-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &.active {
    color: #fff;
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
  }
}
</style>
