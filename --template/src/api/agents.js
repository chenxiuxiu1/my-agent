// 智能分析助手 - 使用 DeepSeek API 生成专业分析报告

import {
  callDeepSeekAPI,
  parseDeepSeekResponse,
  generateThinkingPrompt,
  generateAnalysisPrompt,
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

// 第一步：获取思考过程
export async function getThinkingProcess({ keyword, agent = 'deepseek', onStream }) {
  try {
    const messages = generateThinkingPrompt(keyword)
    
    // 使用更快的参数获取思考过程
    const response = await callDeepSeekAPI(messages, {
      temperature: 0.5,
      max_tokens: 800,
      timeout: 15000
    })

    if (response.code !== 0) {
      throw new Error(response.message)
    }

    const content = response.data?.choices?.[0]?.message?.content || ''
    
    // 解析思考要点
    const thinkingPoints = content
      .split('\n')
      .filter(line => line.trim().startsWith('•') || line.trim().startsWith('-'))
      .map(line => line.trim().replace(/^[•-]\s*/, ''))
      .filter(line => line.length > 0)

    return {
      code: 0,
      message: 'success',
      data: {
        thinkingPoints: thinkingPoints.length > 0 ? thinkingPoints : [content.trim()],
        rawContent: content
      }
    }
  } catch (error) {
    console.error('Get thinking process failed:', error)
    return {
      code: -1,
      message: error.message || '获取思考过程失败',
      data: null
    }
  }
}

// 第二步：生成完整分析报告
export async function analyzeKeyword({ keyword, agent = 'deepseek' }) {
  try {
    // 生成分析提示词
    const messages = generateAnalysisPrompt(keyword)
    
    // 调用 DeepSeek API - 优化参数以平衡速度和质量
    const response = await callDeepSeekAPI(messages, {
      temperature: 0.5,
      max_tokens: 2500,
      timeout: 35000
    })

    if (response.code !== 0) {
      throw new Error(response.message)
    }

    // 解析响应
    const parsedData = parseDeepSeekResponse(response)
    
    // 验证返回数据格式
    if (!parsedData.summary) {
      throw new Error('API返回数据格式错误')
    }

    // 构造分析结果
    const analysisResult = {
      keyword: keyword,
      summary: parsedData.summary || '',
      marketData: parsedData.marketData || [],
      stocks: parsedData.stocks || [],
      chartData: parsedData.chartData || null,
      keyPoints: parsedData.keyPoints || [],
      conclusion: parsedData.conclusion || '',
      timestamp: new Date().toISOString()
    }

    return {
      code: 0,
      message: 'success',
      data: analysisResult
    }
  } catch (error) {
    console.error('Analyze keyword failed:', error)
    return {
      code: -1,
      message: error.message || '分析失败',
      data: null
    }
  }
}

// 保留旧接口用于兼容
export async function searchNews({ keyword, category = 'all', agent = 'deepseek', page = 1, pageSize = 5 }) {
  return analyzeKeyword({ keyword, agent })
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
