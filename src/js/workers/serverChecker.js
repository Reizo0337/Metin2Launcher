const http = require("http");
const https = require("https");

const {
  SERVER_URL,
  MAX_NUMBER_OF_RETRIES,
  TIME_BETWEEN_RETRIES,
} = require("../commonDefines.js");

// 20/02/2025 rewrited this utility cause it causes some problems.

function checkServerLoad(retriesLeft = MAX_NUMBER_OF_RETRIES) {
  return new Promise((resolve) => {
    const protocol = SERVER_URL.startsWith("https") ? https : http;
    const startTime = Date.now();

    const request = protocol.get(SERVER_URL + "serverChecker.php", (response) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (response === 503) {
        console.log(`Server load too high. Response time: ${responseTime}ms`);
        return retryCheck(retriesLeft, resolve);
      }

      console.log(`Server load OK. Response time: ${responseTime}ms`);
      resolve(true);
    });

    request.on("error", (err) => {
		console.error(`Request error: ${err.message}`);
		retryCheck(retriesLeft, resolve);
    });

    request.end();
  });
}

function retryCheck(retriesLeft, resolve) {
  if (retriesLeft > 0) {
    console.log(`Retrying after ${TIME_BETWEEN_RETRIES}ms...`);
    setTimeout(() => {
      checkServerLoad(retriesLeft - 1).then(resolve);
    }, TIME_BETWEEN_RETRIES);
  } else {
    console.log("Max retries exceeded. Server is down.");
    resolve(false);
  }
}

module.exports = {
  checkServerLoad,
};
