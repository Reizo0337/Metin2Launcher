const { NEWS_URL } = require('./commonDefines.js')

async function fetchNews() {
  try {
    const response = await fetch(NEWS_URL, { method: 'GET' })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid response format: Expected an array')
    }

    return parseNews(data)
  } catch (error) {
    return []
  }
}

function parseNews(content) {
  return content
    .filter(item => item && typeof item === 'object')
    .map(item => ({
      title: item.title || 'No Title',
      content: item.content || 'No Content',
      date: item.date ? new Date(item.date) : new Date(),
      url: item.url || '#'
    }))
}

module.exports = { fetchNews }
