const fs = require('fs')
const path = require('path')
const http = require('http')
const https = require('https')
const crypto = require('crypto')

const { SERVER_URL, UPLOADS_FOLDER, PATCH_LIST_URL, PATCHER_CONFIG_FILE} = require('./commonDefines.js')

function readPatcherConfig () {
  // open /dev/patch_config.json
  const configPath = PATCHER_CONFIG_FILE
  if (!fs.existsSync(configPath)) {
    console.error('Error: Cannot find /dev/patch_config.json')
    // process.exit(1)
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
  // console.log(config[0])
  return config.gamePath
}

// Download a single file and report its status via updateCallback
function downloadFile (patch, updateCallback) {
  return new Promise((resolve, reject) => {
    const patchConfigFile = readPatcherConfig()
    const filePath = path.join(patchConfigFile, patch)
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
        const patches = parsePatchList(data)
        try {
          await checkFiles(patches, updateCallback)
          resolve()
        } catch (err) {
          reject(err)
        }
      })
    }).on('error', (err) => {
      updateCallback('Request error: ' + err.message)
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
    const patchConfigFile = readPatcherConfig()
    const localFilePath = path.join(patchConfigFile, patch.filePath)
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
function logInit() {
  const patchConfigFile = readPatcherConfig()
  const logFile = path.join(patchConfigFile, 'log.txt');

  if (!fs.existsSync(patchConfigFile)) {
    fs.mkdirSync(patchConfigFile, { recursive: true });
  }

  fs.writeFileSync(logFile, '', { flag: 'w' });

  TraceLog('log.txt - started');
}
// add log trace
function TraceLog (message) {
  const patchConfigFile = readPatcherConfig()
  const logFile = path.join(patchConfigFile, 'log.txt')
  fs.appendFileSync(logFile, `${new Date().toISOString()}: ${message}\n`)
}

module.exports = { downloadPatchList, logInit }
