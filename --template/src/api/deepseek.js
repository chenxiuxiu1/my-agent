// DeepSeek API 调用模块

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'
const API_KEY = 'sk-538618da3e61444794587e1dfdf330dd'

/**
 * 调用 DeepSeek API（带超时控制）
 * @param {Array} messages - 消息列表
 * @param {Object} options - 配置选项
 * @returns {Promise<Object>} API响应
 */
export async function callDeepSeekAPI(messages, options = {}) {
  const defaultOptions = {
    model: 'deepseek-chat',
    temperature: 0.7,
    max_tokens: 2000, // 减少token数以加快响应
    timeout: 30000, // 30秒超时
    ...options
  }

  // 创建 AbortController 用于超时控制
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), defaultOptions.timeout)

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
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

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
    clearTimeout(timeoutId)
    
    if (error.name === 'AbortError') {
      return {
        code: -1,
        message: '请求超时，请稍后重试',
        data: null
      }
    }
    
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

    let content = response.data?.choices?.[0]?.message?.content
    if (!content) {
      throw new Error('API响应内容为空')
    }

    // 清理 markdown 代码块标记
    content = content.trim()
    if (content.startsWith('```json')) {
      content = content.slice(7)
    } else if (content.startsWith('```')) {
      content = content.slice(3)
    }
    if (content.endsWith('```')) {
      content = content.slice(0, -3)
    }
    content = content.trim()

    // 尝试解析JSON
    try {
      return JSON.parse(content)
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Content:', content)
      // 如果不是JSON，返回原始内容
      return { content }
    }
  } catch (error) {
    console.error('Parse DeepSeek response failed:', error)
    throw error
  }
}

/**
 * 生成思考过程提示词（第一步）
 * @param {string} keyword - 搜索关键词
 * @returns {Array} 消息列表
 */
export function generateThinkingPrompt(keyword) {
  return [
    {
      role: 'system',
      content: `你是一位专业的数据分析专家。用户将要查询一个主题，请先展示你的思考过程。

请用简洁的要点形式（每行以"•"开头）展示你会从哪些角度分析这个主题，例如：
• 分析市场现状和趋势
• 关注相关政策和新闻
• 研究主要参与者和标的
• 评估风险和机会

只输出思考要点，不要输出JSON格式数据。保持简洁，5-8个要点即可。`
    },
    {
      role: 'user',
      content: `我准备查询"${keyword}"，请展示你的分析思路。`
    }
  ]
}

/**
 * 生成智能分析提示词（第二步）
 * @param {string} keyword - 搜索关键词
 * @returns {Array} 消息列表
 */
export function generateAnalysisPrompt(keyword) {
  return [
    {
      role: 'system',
      content: `你是一位专业的数据分析专家和投资顾问。请根据用户提供的查询关键词，生成一份详细的分析报告。

报告必须包含以下内容：
1. **概述** (summary): 对该主题的总体介绍，100字以内
2. **市场/行业数据** (marketData): 包含以下指标数组
   - 指标名称 (name)
   - 当前数值 (value)  
   - 涨跌幅/变化 (change)，如 "+2.5%" 或 "-1.2%"
   - 趋势 (trend): "up" | "down" | "flat"
3. **相关标的** (stocks): 如果是金融类查询，提供相关股票/基金信息
   - 代码 (code)
   - 名称 (name)
   - 价格 (price)
   - 涨跌幅 (change)
4. **图表数据** (chartData): 用于展示趋势的数据
   - 标题 (title)
   - X轴标签 (xAxis): 日期或时间数组
   - Y轴数据 (yAxis): 数值数组
   - 数据系列名称 (seriesName)
5. **分析要点** (keyPoints): 3-5条关键分析要点，每条包含标题和内容
6. **总结建议** (conclusion): 综合分析和参考建议，200字以内

返回严格的JSON格式：
{
  "summary": "概述文本",
  "marketData": [
    {"name": "指标名", "value": "数值", "change": "+2.5%", "trend": "up"}
  ],
  "stocks": [
    {"code": "代码", "name": "名称", "price": "价格", "change": "+1.2%"}
  ],
  "chartData": {
    "title": "图表标题",
    "xAxis": ["1月", "2月", "3月"],
    "yAxis": [100, 120, 115],
    "seriesName": "数据系列"
  },
  "keyPoints": [
    {"title": "要点标题", "content": "详细说明"}
  ],
  "conclusion": "总结建议文本"
}

注意：
- 数据要基于当前市场真实情况
- 如果是非金融类查询（如科技、行业等），stocks可以为空数组
- 确保所有数值合理可信
- 分析要有深度和专业性`
    },
    {
      role: 'user',
      content: `请对"${keyword}"进行详细分析，生成专业的分析报告。`
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
