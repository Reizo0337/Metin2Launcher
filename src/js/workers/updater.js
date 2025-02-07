const fs = require('fs')
const path = require('path')
const http = require('http')
const https = require('https')
const crypto = require('crypto')

const { SERVER_URL, UPLOADS_FOLDER, PATCH_LIST_URL, PATCHER_CONFIG_FILE, ENABLE_PARALLEL_DOWNLOADS , MAX_CONCURRENT_DOWNLOADS } = require('../commonDefines.js') 
// const { readPatcherConfig } = require('./installer.js')

function readPatcherConfig() {
  const configPath = PATCHER_CONFIG_FILE
  if (!fs.existsSync(configPath)) {
    console.error('Error: Cannot find patch_config.json')
    throw new Error('patch_config.json not found')
  }
  return JSON.parse(fs.readFileSync(configPath, 'utf8'))
}

// Download a single file and report its status via updateCallback
function downloadFile(patch, updateCallback) {
  return new Promise((resolve, reject) => {
    const patchConfigFile = readPatcherConfig()
    const filePath = path.join(patchConfigFile.gamePath, patch.filePath)
    const file = fs.createWriteStream(filePath)
    const protocol = SERVER_URL.startsWith('https') ? https : http

    console.log(`Downloading from ${SERVER_URL + UPLOADS_FOLDER + patch.filePath}`)

    protocol.get(SERVER_URL + UPLOADS_FOLDER + patch.filePath, (response) => {
      response.pipe(file)

      file.on('finish', () => {
        file.close()
        TraceLog(`Download completed for ${patch.filePath}`)
        resolve()
      })

      file.on('error', (err) => {
        fs.unlinkSync(filePath) // Delete partial file on error
        TraceLog(`Error downloading ${patch.filePath}: ${err}`)
        reject(err)
      })
    }).on('error', (err) => {
      fs.unlinkSync(filePath) // Delete partial file on error
      TraceLog(`Request error: ${err}`)
      reject(err)
    })
  })
}

// Download the patch list, then check and update files.
function downloadPatchList(updateCallback) {
  return new Promise((resolve, reject) => {
    const protocol = SERVER_URL.startsWith('https') ? https : http
    let data = ''

    protocol.get(PATCH_LIST_URL, (response) => {
      response.on('data', (chunk) => {
        data += chunk
      })

      response.on('end', async () => {
        try {
          const patches = parsePatchList(data)
          if (patches.length === 0) {
            throw new Error('Patch list is empty')
          }
          await checkFiles(patches, updateCallback)
          resolve()
        } catch (err) {
          updateCallback(`Error processing patch list: ${err.message}`)
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
function parsePatchList(data) {
  const lines = data.split('\n').filter(line => line.trim() !== '')
  return lines.map(line => {
    const [filePath, hash] = line.split(',')
    if (!filePath || !hash) {
      throw new Error(`Invalid line in patch list: ${line}`)
    }
    return { filePath, hash }
  })
}

// Check each file against the patch list and download if needed.
async function checkFiles(patches, updateCallback) {
  if (ENABLE_PARALLEL_DOWNLOADS === true) {
    const downloadQueue = [...patches];
    const inProgress = [];

    async function downloadNext() {
      if (downloadQueue.length === 0) return;

      const patch = downloadQueue.shift();
      // check sums
      const patchConfigFile = readPatcherConfig()
      const localFilePath = path.join(patchConfigFile.gamePath, patch.filePath);
    
      const localFileHash = await getFileHash(localFilePath)

      if (fs.existsSync(localFilePath) && localFileHash === patch.hash) {
        TraceLog(`Skipping ${patch.filePath} (already up to date)`);
        // await downloadNext(); // next download  -- 07/2 commented innecesary.
        return;
      }
      const downloadPromise = downloadFile(patch, updateCallback)

      inProgress.push(downloadPromise);
      try {
        await downloadPromise;
      } catch (e) {
        updateCallback(`Error downloading ${patch.filePath}: ${e.message}`);
      } finally {
        inProgress.splice(inProgress.indexOf(downloadPromise), 1);
      }

      if (downloadQueue.length > 0 && inProgress.length < MAX_CONCURRENT_DOWNLOADS) {
        await downloadNext();
      }
    }

    // for parallel.
    const initialDownloads = Math.min(MAX_CONCURRENT_DOWNLOADS, downloadQueue.length);
    const downloadPromises = [];
    for (let i = 0; i < initialDownloads; i++) {
      downloadPromises.push(downloadNext());
    }

    await Promise.all(downloadPromises);

    while (downloadQueue.length > 0) {
      await downloadNext();
    }
  } else {
    for (const patch of patches) {
      const patchConfigFile = readPatcherConfig();
      const localFilePath = path.join(patchConfigFile.gamePath, patch.filePath);
      const dirPath = path.dirname(localFilePath);

      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      const localFileHash = await getFileHash(localFilePath);

      if (!fs.existsSync(localFilePath) || localFileHash !== patch.hash) {
        TraceLog(`Downloading file ${patch.filePath}`);
        await downloadFile(patch, updateCallback);
      }
    }
  }
}

// Generate MD5 hash for a file (reading in chunks, like Python)
function getFileHash(filePath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) return resolve(null)

    const hash = crypto.createHash('md5')
    const fileStream = fs.createReadStream(filePath)

    fileStream.on('data', (chunk) => {
      hash.update(chunk)
    })

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
  const logFile = path.join(patchConfigFile.gamePath, 'log.txt')

  if (!fs.existsSync(patchConfigFile.gamePath)) {
    fs.mkdirSync(patchConfigFile.gamePath, { recursive: true })
  }

  fs.writeFileSync(logFile, '', { flag: 'w' })

  TraceLog('log.txt - started')
}

// add log trace
function TraceLog(message) {
  const patchConfigFile = readPatcherConfig()
  const logFile = path.join(patchConfigFile.gamePath, 'log.txt')
  fs.appendFileSync(logFile, `${new Date().toISOString()}: ${message}\n`)
}

module.exports = { downloadPatchList, logInit }
