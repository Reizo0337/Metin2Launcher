loadingContainer = document.getElementById('loadingContainer')
loadingContainer.style.display = 'none'

advancedOptionContainer = document.getElementById('advanced-options-container')
advancedOptionContainer.style.display = 'none'

const progressBar = document.getElementById('progress-bar');
const progressLabel = document.getElementById('progress-label')

window.electron.onProgress((percent) => { 
  console.log(percent)
  progressBar.value = percent;
});

window.electron.onInstallationProgress((text) => {
  console.log(text)
  progressLabel.innerHTML = text
});

function setupNewsClickListeners() {
  startInstall = document.getElementById('btn-install-game')
  advancedOptionButton = document.getElementById('advanced-opt-btn')
  saveButton = document.getElementById('saveButton') 
  
  // close-minimize buttons
  minimizeButton = document.getElementById('minimizeWindow')
  closeButton = document.getElementById('closeWindow')

  if (startInstall) {
    startInstall.addEventListener('click', (event) => {
      startInstalling()
    })
  }
  if (advancedOptionButton) {
    advancedOptionButton.addEventListener('click', (event) => {
      openAdvancedOptions()
    })
  }
  if (minimizeButton) {
    minimizeButton.addEventListener('click', () => {
      window.electron.minimizeWindow()
    })
  }
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      window.electron.closeWindow()
    })
  }
  if (saveButton) {
    saveButton.addEventListener('click', () => {
      advancedOptionContainer.style.display = 'none'
      defaultWindow.style.display = 'flex';
    })
  }
}

function openAdvancedOptions() {
  // open advanced options window
  defaultWindow = document.getElementById('defaultWindow')
  advancedOptionContainer.style.display = 'flex';
  defaultWindow.style.display = 'none';
}

function hideButtons() {
  firstContainer = document.getElementById('buttonsContainer')
  firstContainer.style.display = 'none';
}

function startInstalling() {
  hideButtons()
  loadingContainer.style.display = 'flex';
  // start installing the game
  // get directory.
  if (document.getElementById('installPath').value === '') {
    console.log('No directory provided run into default.')
    installationDirectory = 'default'
  }
  else {
    installationDirectory = document.getElementById('installPath').value;
  }
  window.electron.backInstallGame(installationDirectory);
}

async function selectInstallPath() {
  const folderPath = await window.electron.selectFolder(); // Llama al proceso principal
  if (folderPath) {
    document.getElementById('installPath').value = folderPath;
  }
}

setupNewsClickListeners()