<template>
  <div class="history-record" :class="{ 'is-selected': selected }" @click="handleClick">
    <van-checkbox v-if="showCheckbox" v-model="checked" @click.stop @change="onCheckChange" />
    <div class="record-content">
      <h4 class="record-title">{{ record.title }}</h4>
      <div class="record-meta">
        <span class="record-source">{{ record.source }}</span>
        <span class="dot">·</span>
        <span class="record-time">{{ formatTime(record.viewTime || record.publishTime) }}</span>
        <van-tag v-if="record.category" size="small" type="primary" plain>{{ record.category }}</van-tag>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { formatTime } from '@/utils/timer.js'

const props = defineProps({
  record: {
    type: Object,
    required: true
  },
  selected: {
    type: Boolean,
    default: false
  },
  showCheckbox: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click', 'select'])

const checked = ref(props.selected)

watch(() => props.selected, (val) => {
  checked.value = val
})

const handleClick = () => {
  if (props.showCheckbox) {
    checked.value = !checked.value
    onCheckChange(checked.value)
  } else {
    emit('click', props.record)
  }
}

const onCheckChange = (val) => {
  emit('select', { record: props.record, selected: val })
}
</script>

<style scoped lang="scss">
.history-record {
  display: flex;
  align-items: center;
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

  &.is-selected {
    box-shadow: 0 0 0 2px var(--primary-color);
  }
}

.record-content {
  flex: 1;
  min-width: 0;
}

.record-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
  line-height: 1.4;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.record-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.record-source {
  font-weight: 500;
  color: var(--primary-color);
}

.dot {
  opacity: 0.5;
}
</style>
