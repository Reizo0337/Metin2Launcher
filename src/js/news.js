const { NEWS_URL } = require('./commonDefines.js')

async function fetchNews () {
  try {
    const response = await fetch(NEWS_URL)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    // parse the response and return the array
    const news = await response.json()
    console.log('Fetched data:', news)
    return parseNews(news)
  } catch (error) {
    console.error('Error fetching news:', error)
    return []
  }
}

// parse the .json file into an array
function parseNews (content) {
  return content.map(item => ({
    title: item.title,
    content: item.content,
    date: new Date(item.date),
    url: item.url
  }))
}

module.exports = { fetchNews }
