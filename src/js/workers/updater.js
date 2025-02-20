const fs = require('fs')
const path = require('path')
const http = require('http')
const https = require('https')
const crypto = require('crypto')

const { SERVER_URL, UPLOADS_FOLDER, PATCH_LIST_URL, ENABLE_PARALLEL_DOWNLOADS , MAX_CONCURRENT_DOWNLOADS, PATCHER_PATH_LOG } = require('../commonDefines.js') 
const { loadConfig } = require('./loadPatchConfig.js')
const { config } = require('process')

// Download a single file and report its status via updateCallback
function downloadFile(patch) {
  return new Promise((resolve, reject) => {
		patchConfigFile = loadConfig()
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
		patchConfigFile = loadConfig()
		
		if (!fs.existsSync(patchConfigFile.gamePath)) {
			// game path isn't avaible.
			console.log('GAME_PATH_NOT_FOUND' + patchConfigFile.gamePath)
			reject(new Error('INVALID_GAME_PATH'))
      return
		}
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
					reject(err)
				}
			})
		}).on('error', (err) => {
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
	// first check if the file exists
	patchConfigFile = loadConfig()

  if (ENABLE_PARALLEL_DOWNLOADS === true) {
    const downloadQueue = [...patches];
    const inProgress = [];

    async function downloadNext() {
      if (downloadQueue.length === 0) return;

      const patch = downloadQueue.shift();
      // check sums
      const localFilePath = path.join(patchConfigFile.gamePath, patch.filePath);
    
      const localFileHash = await getFileHash(localFilePath)

      if (fs.existsSync(localFilePath) && localFileHash === patch.hash) {
        TraceLog(`Skipping ${patch.filePath} (already up to date)`);
        return;
      }
      const downloadPromise = downloadFile(patch, updateCallback)

      inProgress.push(downloadPromise);
      try {
        await downloadPromise;
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
  const logFile = PATCHER_PATH_LOG + "patch_log.txt"

  if (!fs.existsSync(PATCHER_PATH_LOG)) {
    fs.mkdirSync(PATCHER_PATH_LOG, { recursive: true })
  }

  fs.writeFileSync(logFile, '', { flag: 'w' })

  TraceLog('log.txt - started')
}

// add log trace
function TraceLog(message) {
  const logFile = path.join(PATCHER_PATH_LOG, 'patch_log.txt')
  fs.appendFileSync(logFile, `${new Date().toISOString()}: ${message}\n`)
}

module.exports = { downloadPatchList, logInit }
