// 定时任务管理

class TimerManager {
  constructor() {
    this.timerId = null
    this.callback = null
    this.interval = null
    this.isRunning = false
  }
  
  // 设置定时器
  setTimer(callback, interval) {
    // 清除现有定时器
    this.clearTimer()
    
    this.callback = callback
    this.interval = interval
    this.isRunning = true
    
    // 立即执行一次
    this.callback()
    
    // 设置定时执行
    this.timerId = setInterval(() => {
      if (this.callback) {
        this.callback()
      }
    }, interval)
    
    return this.timerId
  }
  
  // 清除定时器
  clearTimer() {
    if (this.timerId) {
      clearInterval(this.timerId)
      this.timerId = null
    }
    this.isRunning = false
  }
  
  // 重启定时器
  restartTimer() {
    if (this.callback && this.interval) {
      this.setTimer(this.callback, this.interval)
    }
  }
  
  // 更新间隔
  updateInterval(newInterval) {
    if (this.isRunning && this.interval !== newInterval) {
      this.interval = newInterval
      this.restartTimer()
    } else {
      this.interval = newInterval
    }
  }
  
  // 获取状态
  getStatus() {
    return {
      isRunning: this.isRunning,
      interval: this.interval,
      timerId: this.timerId
    }
  }
}

// 导出单例
export const timerManager = new TimerManager()

// 时间格式化
export function formatTime(date) {
  const d = new Date(date)
  const now = new Date()
  const diff = now - d
  
  // 小于1分钟
  if (diff < 60 * 1000) {
    return '刚刚'
  }
  
  // 小于1小时
  if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))}分钟前`
  }
  
  // 小于24小时
  if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 60 * 1000))}小时前`
  }
  
  // 小于7天
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`
  }
  
  // 显示具体日期
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 格式化日期时间
export function formatDateTime(date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

// 间隔选项
export const intervalOptions = [
  { text: '5分钟', value: 5 * 60 * 1000 },
  { text: '10分钟', value: 10 * 60 * 1000 },
  { text: '30分钟', value: 30 * 60 * 1000 },
  { text: '1小时', value: 60 * 60 * 1000 },
  { text: '2小时', value: 2 * 60 * 60 * 1000 }
]

// 获取间隔文本
export function getIntervalText(value) {
  const option = intervalOptions.find(opt => opt.value === value)
  return option ? option.text : '10分钟'
}
