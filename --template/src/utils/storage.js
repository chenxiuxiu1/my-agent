// 本地存储管理

const STORAGE_KEYS = {
  NEWS_HISTORY: 'news_history',
  SEARCH_HISTORY: 'search_history',
  SETTINGS: 'settings',
  THEME: 'theme'
}

// 新闻历史记录
export const newsHistoryStorage = {
  get() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NEWS_HISTORY)
      return data ? JSON.parse(data) : []
    } catch (e) {
      console.error('Failed to get news history:', e)
      return []
    }
  },
  
  set(data) {
    try {
      localStorage.setItem(STORAGE_KEYS.NEWS_HISTORY, JSON.stringify(data))
    } catch (e) {
      console.error('Failed to set news history:', e)
    }
  },
  
  add(news) {
    const history = this.get()
    const exists = history.find(item => item.id === news.id)
    if (!exists) {
      history.unshift({
        ...news,
        viewTime: new Date().toISOString()
      })
      // 最多保留100条
      if (history.length > 100) {
        history.pop()
      }
      this.set(history)
    }
  },
  
  remove(id) {
    const history = this.get()
    const filtered = history.filter(item => item.id !== id)
    this.set(filtered)
  },
  
  clear() {
    localStorage.removeItem(STORAGE_KEYS.NEWS_HISTORY)
  },
  
  batchRemove(ids) {
    const history = this.get()
    const filtered = history.filter(item => !ids.includes(item.id))
    this.set(filtered)
  }
}

// 搜索历史记录
export const searchHistoryStorage = {
  get() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY)
      return data ? JSON.parse(data) : []
    } catch (e) {
      console.error('Failed to get search history:', e)
      return []
    }
  },
  
  set(data) {
    try {
      localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(data))
    } catch (e) {
      console.error('Failed to set search history:', e)
    }
  },
  
  add(keyword, category = 'all') {
    if (!keyword.trim()) return
    
    const history = this.get()
    const existsIndex = history.findIndex(
      item => item.keyword === keyword && item.category === category
    )
    
    if (existsIndex > -1) {
      history.splice(existsIndex, 1)
    }
    
    history.unshift({
      keyword: keyword.trim(),
      category,
      timestamp: new Date().toISOString()
    })
    
    // 最多保留10条
    if (history.length > 10) {
      history.pop()
    }
    
    this.set(history)
  },
  
  remove(keyword, category) {
    const history = this.get()
    const filtered = history.filter(
      item => !(item.keyword === keyword && item.category === category)
    )
    this.set(filtered)
  },
  
  clear() {
    localStorage.removeItem(STORAGE_KEYS.SEARCH_HISTORY)
  }
}

// 设置
export const settingsStorage = {
  get() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS)
      const defaultSettings = {
        autoUpdate: false,
        updateInterval: 10 * 60 * 1000, // 10分钟
        keywords: [],
        categories: [],
        theme: 'light'
      }
      return data ? { ...defaultSettings, ...JSON.parse(data) } : defaultSettings
    } catch (e) {
      console.error('Failed to get settings:', e)
      return {
        autoUpdate: false,
        updateInterval: 10 * 60 * 1000,
        keywords: [],
        categories: [],
        theme: 'light'
      }
    }
  },
  
  set(settings) {
    try {
      const current = this.get()
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ ...current, ...settings }))
    } catch (e) {
      console.error('Failed to set settings:', e)
    }
  }
}

// 主题
export const themeStorage = {
  get() {
    try {
      return localStorage.getItem(STORAGE_KEYS.THEME) || 'light'
    } catch (e) {
      return 'light'
    }
  },
  
  set(theme) {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme)
      document.documentElement.setAttribute('data-theme', theme)
    } catch (e) {
      console.error('Failed to set theme:', e)
    }
  },
  
  init() {
    const theme = this.get()
    document.documentElement.setAttribute('data-theme', theme)
    return theme
  }
}
