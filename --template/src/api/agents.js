// 多智能体统一接口管理 - 使用 DeepSeek API 生成真实数据

import {
  callDeepSeekAPI,
  parseDeepSeekResponse,
  generateNewsSearchPrompt,
  generateNewsDetailPrompt,
  generateRecommendKeywordsPrompt
} from './deepseek.js'

// 智能体配置
export const AGENTS = {
  DEEPSEEK: {
    name: 'DeepSeek',
    value: 'deepseek',
    default: true
  },
  WENXIN: {
    name: '百度文心一言',
    value: 'wenxin'
  },
  DOUBAO: {
    name: '豆包',
    value: 'doubao'
  },
  QIANWEN: {
    name: '通义千问',
    value: 'qianwen'
  },
  KIMI: {
    name: 'Kimi',
    value: 'kimi'
  }
}

// 获取智能体列表
export function getAgentList() {
  return Object.values(AGENTS).map(agent => ({
    text: agent.name,
    value: agent.value
  }))
}

// 获取默认智能体
export function getDefaultAgent() {
  return AGENTS.DEEPSEEK.value
}

// 统一搜索接口 - 使用 DeepSeek API
export async function searchNews({ keyword, category = 'all', agent = 'deepseek', page = 1, pageSize = 10 }) {
  try {
    // 生成提示词
    const messages = generateNewsSearchPrompt(keyword, category, pageSize)
    
    // 调用 DeepSeek API
    const response = await callDeepSeekAPI(messages, {
      temperature: 0.8,
      max_tokens: 4000
    })

    if (response.code !== 0) {
      throw new Error(response.message)
    }

    // 解析响应
    const parsedData = parseDeepSeekResponse(response)
    
    if (!parsedData.news || !Array.isArray(parsedData.news)) {
      throw new Error('API返回数据格式错误')
    }

    // 处理新闻数据
    const newsList = parsedData.news.map((news, index) => ({
      id: news.id || Date.now() + index,
      title: news.title || '无标题',
      content: news.content || news.summary || '暂无内容',
      summary: news.summary || news.content?.substring(0, 100) + '...' || '暂无摘要',
      source: news.source || '网络新闻',
      publishTime: news.publishTime || new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      image: news.image || `https://picsum.photos/400/300?random=${Date.now() + index}`,
      url: news.url || `https://example.com/news/${Date.now() + index}`,
      keyword: keyword,
      category: news.category || (category === 'all' ? '综合' : category),
      agent: agent
    }))

    return {
      code: 0,
      message: 'success',
      data: {
        list: newsList,
        total: newsList.length * 5, // 模拟更多数据
        page,
        pageSize
      }
    }
  } catch (error) {
    console.error('Search news failed:', error)
    // 如果API调用失败，返回错误信息
    return {
      code: -1,
      message: error.message || '搜索失败',
      data: {
        list: [],
        total: 0,
        page,
        pageSize
      }
    }
  }
}

// 获取新闻详情 - 使用 DeepSeek API
export async function getNewsDetail(id, title = '', keyword = '', agent = 'deepseek') {
  try {
    // 生成提示词
    const messages = generateNewsDetailPrompt(title, keyword)
    
    // 调用 DeepSeek API
    const response = await callDeepSeekAPI(messages, {
      temperature: 0.7,
      max_tokens: 3000
    })

    if (response.code !== 0) {
      throw new Error(response.message)
    }

    // 解析响应
    const parsedData = parseDeepSeekResponse(response)

    const sources = ['新浪新闻', '网易新闻', '腾讯新闻', '搜狐新闻', '人民网', '新华网']
    const categories = ['财经', '科技', '国际', '体育', '娱乐', '社会']

    return {
      code: 0,
      message: 'success',
      data: {
        id,
        title: parsedData.title || title || '新闻详情',
        content: parsedData.content || '<p>暂无详细内容</p>',
        summary: parsedData.summary || '暂无摘要',
        source: sources[Math.floor(Math.random() * sources.length)],
        publishTime: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString(),
        image: `https://picsum.photos/800/400?random=${id}`,
        url: `https://example.com/news/${id}`,
        keyword: keyword || '热点',
        category: categories[Math.floor(Math.random() * categories.length)],
        agent
      }
    }
  } catch (error) {
    console.error('Get news detail failed:', error)
    return {
      code: -1,
      message: error.message || '获取详情失败',
      data: null
    }
  }
}

// 获取推荐关键词 - 使用 DeepSeek API
export async function getRecommendedKeywords(agent = 'deepseek') {
  try {
    // 生成提示词
    const messages = generateRecommendKeywordsPrompt()
    
    // 调用 DeepSeek API
    const response = await callDeepSeekAPI(messages, {
      temperature: 0.9,
      max_tokens: 500
    })

    if (response.code !== 0) {
      throw new Error(response.message)
    }

    // 解析响应
    const parsedData = parseDeepSeekResponse(response)

    if (parsedData.keywords && Array.isArray(parsedData.keywords)) {
      return {
        code: 0,
        message: 'success',
        data: parsedData.keywords.slice(0, 10)
      }
    }

    // 如果解析失败，使用默认推荐
    throw new Error('关键词数据格式错误')
  } catch (error) {
    console.error('Get recommended keywords failed:', error)
    // 返回默认推荐
    return {
      code: 0,
      message: 'success',
      data: ['人工智能', '新能源汽车', '数字经济', '碳中和', '5G技术', '股市行情', '房地产', '医疗健康']
    }
  }
}

// 获取分类列表
export function getCategoryList() {
  return [
    { text: '全部分类', value: 'all' },
    { text: '财经', value: '财经' },
    { text: '科技', value: '科技' },
    { text: '国际', value: '国际' },
    { text: '体育', value: '体育' },
    { text: '娱乐', value: '娱乐' }
  ]
}
