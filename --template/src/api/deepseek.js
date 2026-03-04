// DeepSeek API 调用模块

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'
const API_KEY = 'sk-538618da3e61444794587e1dfdf330dd'

/**
 * 调用 DeepSeek API
 * @param {Array} messages - 消息列表
 * @param {Object} options - 配置选项
 * @returns {Promise<Object>} API响应
 */
export async function callDeepSeekAPI(messages, options = {}) {
  const defaultOptions = {
    model: 'deepseek-chat',
    temperature: 0.7,
    max_tokens: 4000,
    ...options
  }

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: defaultOptions.model,
        messages: messages,
        temperature: defaultOptions.temperature,
        max_tokens: defaultOptions.max_tokens,
        stream: false
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    return {
      code: 0,
      message: 'success',
      data: data
    }
  } catch (error) {
    console.error('DeepSeek API call failed:', error)
    return {
      code: -1,
      message: error.message || 'API调用失败',
      data: null
    }
  }
}

/**
 * 解析 DeepSeek 响应
 * @param {Object} response - API响应
 * @returns {Object} 解析后的内容
 */
export function parseDeepSeekResponse(response) {
  try {
    if (response.code !== 0) {
      throw new Error(response.message || 'API响应错误')
    }

    const content = response.data?.choices?.[0]?.message?.content
    if (!content) {
      throw new Error('API响应内容为空')
    }

    // 尝试解析JSON
    try {
      return JSON.parse(content)
    } catch {
      // 如果不是JSON，返回原始内容
      return { content }
    }
  } catch (error) {
    console.error('Parse DeepSeek response failed:', error)
    throw error
  }
}

/**
 * 生成新闻搜索提示词
 * @param {string} keyword - 搜索关键词
 * @param {string} category - 新闻分类
 * @param {number} count - 生成数量
 * @returns {Array} 消息列表
 */
export function generateNewsSearchPrompt(keyword, category = 'all', count = 10) {
  const categoryText = category === 'all' ? '综合' : category
  
  return [
    {
      role: 'system',
      content: `你是一个专业的新闻编辑助手。请根据用户提供的搜索词，生成${count}条相关的新闻内容。
要求：
1. 新闻标题要吸引人，符合中文新闻标题习惯
2. 新闻内容要真实可信，包含具体细节
3. 每条新闻包含：id、title（标题）、summary（摘要，100字以内）、content（正文，300-500字）、source（来源，如：新浪新闻、网易新闻、腾讯新闻等）、publishTime（发布时间，ISO格式）、category（分类）、image（图片URL，使用https://picsum.photos/400/300?random={id}）
4. 返回JSON格式：{ "news": [{...}] }
5. 确保新闻内容与搜索词高度相关`
    },
    {
      role: 'user',
      content: `请搜索关于"${keyword}"的${categoryText}新闻，生成${count}条。`
    }
  ]
}

/**
 * 生成新闻详情提示词
 * @param {string} title - 新闻标题
 * @param {string} keyword - 关键词
 * @returns {Array} 消息列表
 */
export function generateNewsDetailPrompt(title, keyword) {
  return [
    {
      role: 'system',
      content: `你是一个专业的新闻编辑。请根据标题生成一篇完整的新闻报道。
要求：
1. 正文内容800-1500字，分段清晰
2. 包含导语、主体、背景、展望等部分
3. 使用HTML标签（<p>、<h3>等）格式化内容
4. 返回JSON格式：{ "title": "标题", "content": "HTML内容", "summary": "摘要" }`
    },
    {
      role: 'user',
      content: `请生成一篇关于"${title}"的完整新闻报道，关键词：${keyword}`
    }
  ]
}

/**
 * 生成推荐关键词提示词
 * @returns {Array} 消息列表
 */
export function generateRecommendKeywordsPrompt() {
  return [
    {
      role: 'system',
      content: `你是一个热门话题分析专家。请生成当前最热门的10个新闻关键词。
要求：
1. 涵盖不同领域（科技、财经、社会、国际等）
2. 关键词要简洁（2-6个字）
3. 返回JSON格式：{ "keywords": ["关键词1", "关键词2", ...] }`
    },
    {
      role: 'user',
      content: '请生成当前热门新闻关键词推荐'
    }
  ]
}
