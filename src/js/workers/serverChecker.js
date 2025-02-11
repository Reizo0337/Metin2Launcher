const http = require('http')
const https = require('http')

const { SERVER_URL, MAX_NUMBER_OF_RETRIES, TIME_BETWEEN_RETRIES } = require('../commonDefines.js') 

function checkServerLoad (retriesLeft = MAX_NUMBER_OF_RETRIES) {
  return new Promise((resolve, reject) => {
    const protocol = SERVER_URL.startsWith('https') ? require('https') : require('http');
    const startTime = Date.now()
    protocol.get(SERVER_URL + 'serverChecker.php', (response) => {
      const endTime = Date.now()
      const responseTime = endTime - startTime

      if (response === 503) { // should check for status code?????????????
        // retry it.
        console.log(`Server load too high. Response time: ${responseTime}ms`)
        if (MAX_NUMBER_OF_RETRIES > 0) {
          // retry bro.
          console.log(`Retrying after ${TIME_BETWEEN_RETRIES}ms...`)
          setTimeout(() => {
            checkServerLoad(retriesLeft - 1).then(resolve).catch(reject);
          }, TIME_BETWEEN_RETRIES);
        }
        else {
          console.log('Max retries exceeded. Response time: ${responseTime}ms')
          resolve(false)
        }
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