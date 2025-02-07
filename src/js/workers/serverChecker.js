const http = require('http')
const https = require('http')

const { SERVER_URL } = require('../commonDefines.js') 

function checkServerLoad () {
  return new Promise((resolve, reject) => {
    const protocol = SERVER_URL.startsWith('https') ? require('https') : require('http');
    const startTime = Date.now()
    protocol.get(SERVER_URL + 'serverChecker.php', (response) => {
      const endTime = Date.now()
      const responseTime = endTime - startTime

      if (response === 503) {
        console.log(`Server load too high. Response time: ${responseTime}ms`)
        resolve(false)
      } else {
        console.log(`Server load OK. Response time: ${responseTime}ms`)
        resolve(true)
      }
    }).on ('error', (err) => {
      console.error(`Request error: ${err}`)
      resolve(false)
    })
  })
}

module.exports = {
  checkServerLoad
}