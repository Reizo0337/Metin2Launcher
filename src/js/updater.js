const fs = require('fs')
const path = require('path')
const http = require('http')
const https = require('https')
const crypto = require('crypto')

const { SERVER_URL, UPLOADS_FOLDER, GAME_FOLDER, PATCH_LIST_URL } = require('./commonDefines.js')


// Download a single file and report its status via updateCallback
function downloadFile (patch, updateCallback) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(GAME_FOLDER, patch)
    const file = fs.createWriteStream(filePath)
    const protocol = SERVER_URL.startsWith('https') ? https : http
    console.log(SERVER_URL + UPLOADS_FOLDER + patch)

    protocol.get(SERVER_URL + UPLOADS_FOLDER + patch, (response) => {
      response.pipe(file)

      file.on('finish', () => {
        file.close()
        TraceLog(`Download completed for ${patch}`)
        resolve()
      })

      file.on('error', (err) => {
        TraceLog(`Error downloading ${patch}:`, err)
        reject(err)
      })
    }).on('error', (err) => {
      TraceLog('Request error:', err)
      reject(err)
    })
  })
}

// Download the patch list, then check and update files.
function downloadPatchList (updateCallback) {
  return new Promise((resolve, reject) => {
    const protocol = SERVER_URL.startsWith('https') ? https : http
    let data = ''

    protocol.get(PATCH_LIST_URL, (response) => {
      response.on('data', (chunk) => {
        data += chunk
      })

      response.on('end', async () => {
        TraceLog('patch_list.txt successfully downloaded')
        const patches = parsePatchList(data)
        await checkFiles(patches, updateCallback)
        resolve()
      })
    }).on('error', (err) => {
      TraceLog('Request error:', err)
      reject(err)
    })
  })
}

// Parse the patch list into objects with filePath and hash.
function parsePatchList (data) {
  const lines = data.split('\n').filter(line => line.trim() !== '')
  return lines.map(line => {
    const [filePath, hash] = line.split(',') // separate file and hash.
    return { filePath, hash }
  })
}

// Check each file against the patch list and download if needed.
async function checkFiles (patches, updateCallback) {
  for (const patch of patches) {
    const localFilePath = path.join(GAME_FOLDER, patch.filePath)
    const dirPath = path.dirname(localFilePath)
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }

    const localFileHash = await getFileHash(localFilePath)

    if (!fs.existsSync(localFilePath) || localFileHash !== patch.hash) {
      TraceLog('Downloading file ' + patch.filePath)
      await downloadFile(patch.filePath, updateCallback)
    }
  }
}

// Generate MD5 hash for a file (reading in chunks, like Python)
function getFileHash (filePath) {
  if (!fs.existsSync(filePath)) return null

  const hash = crypto.createHash('md5')
  const fileStream = fs.createReadStream(filePath)

  fileStream.on('data', (chunk) => {
    hash.update(chunk)
  })

  return new Promise((resolve, reject) => {
    fileStream.on('end', () => {
      resolve(hash.digest('hex'))
    })

    fileStream.on('error', (err) => {
      reject(err)
    })
  })
}

// log.txt file
function logInit () {
  const logFile = path.join(GAME_FOLDER, 'log.txt')
  if (fs.existsSync(logFile)) {
    fs.truncateSync(logFile, 0)
  } else {
    fs.writeFileSync(logFile, '')
  }
  TraceLog('log.txt - started')
}
// add log trace
function TraceLog (message) {
  const logFile = path.join(GAME_FOLDER, 'log.txt')
  fs.appendFileSync(logFile, `${new Date().toISOString()}: ${message}\n`)
}

module.exports = { downloadPatchList, logInit }
