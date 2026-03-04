<template>
  <div class="history-page">
    <div class="page-container">
      <!-- 页面标题 -->
      <div class="page-header">
        <h2 class="page-title">浏览历史</h2>
        <van-button 
          v-if="!showBatchMode && filteredList.length > 0"
          size="small" 
          plain
          @click="enterBatchMode"
        >
          管理
        </van-button>
        <template v-else-if="showBatchMode">
          <div class="batch-actions">
            <van-button size="small" plain @click="cancelBatchMode">取消</van-button>
            <van-button size="small" type="danger" @click="deleteSelected" :disabled="selectedIds.length === 0">
              删除({{ selectedIds.length }})
            </van-button>
          </div>
        </template>
      </div>
      
      <!-- 筛选栏 -->
      <div class="filter-bar">
        <div class="filter-row">
          <van-field
            v-model="filterKeyword"
            placeholder="搜索历史"
            clearable
            @update:model-value="onFilterChange"
          >
            <template #left-icon>
              <van-icon name="search" />
            </template>
          </van-field>
          <van-dropdown-menu>
            <van-dropdown-item v-model="filterCategory" :options="categoryOptions" @change="onFilterChange" />
          </van-dropdown-menu>
        </div>
      </div>
      
      <!-- 批量操作栏 -->
      <div v-if="showBatchMode && filteredList.length > 0" class="batch-bar">
        <van-checkbox v-model="selectAll" @change="onSelectAllChange">全选</van-checkbox>
      </div>
      
      <!-- 历史列表 -->
      <div class="history-list">
        <HistoryRecord
          v-for="record in filteredList"
          :key="record.id"
          :record="record"
          :selected="selectedIds.includes(record.id)"
          :show-checkbox="showBatchMode"
          @click="goToDetail"
          @select="onRecordSelect"
        />
      </div>
      
      <!-- 空状态 -->
      <div v-if="filteredList.length === 0" class="empty-state">
        <van-icon name="clock-o" />
        <p>{{ historyList.length === 0 ? '暂无浏览历史' : '没有匹配的记录' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'
import HistoryRecord from '@/components/HistoryRecord/HistoryRecord.vue'
import { newsHistoryStorage } from '@/utils/storage.js'
import { getCategoryList } from '@/api/agents.js'

const router = useRouter()

const historyList = ref([])
const filterKeyword = ref('')
const filterCategory = ref('all')
const showBatchMode = ref(false)
const selectedIds = ref([])
const selectAll = ref(false)

const categories = getCategoryList()

const categoryOptions = computed(() => [
  { text: '全部分类', value: 'all' },
  ...categories.filter(cat => cat.value !== 'all')
])

const filteredList = computed(() => {
  let list = historyList.value
  
  if (filterCategory.value !== 'all') {
    list = list.filter(item => item.category === filterCategory.value)
  }
  
  if (filterKeyword.value.trim()) {
    const keyword = filterKeyword.value.toLowerCase()
    list = list.filter(item => 
      item.title.toLowerCase().includes(keyword) ||
      item.keyword?.toLowerCase().includes(keyword)
    )
  }
  
  return list
})

const loadHistory = () => {
  historyList.value = newsHistoryStorage.get()
}

const onFilterChange = () => {
  selectedIds.value = []
  selectAll.value = false
}

const enterBatchMode = () => {
  showBatchMode.value = true
  selectedIds.value = []
  selectAll.value = false
}

const cancelBatchMode = () => {
  showBatchMode.value = false
  selectedIds.value = []
  selectAll.value = false
}

const onSelectAllChange = (checked) => {
  if (checked) {
    selectedIds.value = filteredList.value.map(item => item.id)
  } else {
    selectedIds.value = []
  }
}

const onRecordSelect = ({ record, selected }) => {
  if (selected) {
    selectedIds.value.push(record.id)
  } else {
    const index = selectedIds.value.indexOf(record.id)
    if (index > -1) {
      selectedIds.value.splice(index, 1)
    }
  }
  selectAll.value = selectedIds.value.length === filteredList.value.length && filteredList.value.length > 0
}

const deleteSelected = () => {
  if (selectedIds.value.length === 0) {
    showToast('请先选择要删除的记录')
    return
  }
  
  showConfirmDialog({
    title: '确认删除',
    message: `确定要删除选中的 ${selectedIds.value.length} 条记录吗？`
  }).then(() => {
    newsHistoryStorage.batchRemove(selectedIds.value)
    loadHistory()
    selectedIds.value = []
    selectAll.value = false
    showBatchMode.value = false
    showToast('删除成功')
  }).catch(() => {})
}

const goToDetail = (record) => {
  router.push({
    name: 'NewsDetail',
    params: { id: record.id },
    query: { 
      title: record.title,
      agent: record.agent
    }
  })
}

onMounted(() => {
  loadHistory()
})
</script>

<style scoped lang="scss">
.history-page {
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  
  .batch-actions {
    display: flex;
    gap: 8px;
  }
}

.filter-bar {
  margin-bottom: 12px;
  
  .filter-row {
    display: flex;
    align-items: center;
    gap: 8px;
    
    :deep(.van-field) {
      flex: 1;
      padding: 8px 12px;
      background-color: var(--card-background);
      border-radius: 12px;
    }
    
    :deep(.van-dropdown-menu) {
      flex-shrink: 0;
    }
  }
}

.batch-bar {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background-color: var(--card-background);
  border-radius: 10px;
  margin-bottom: 10px;
}

.history-list {
  margin-top: 8px;
}
</style>
