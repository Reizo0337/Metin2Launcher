loadingContainer = document.getElementById('loadingContainer')
loadingContainer.style.display = 'none'

advancedOptionContainer = document.getElementById('advanced-options-container')
advancedOptionContainer.style.display = 'none'


function setupNewsClickListeners() {
  startInstall = document.getElementById('btn-install-game')
  advancedOptionButton = document.getElementById('advanced-opt-btn')
  
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
}

setupNewsClickListeners()