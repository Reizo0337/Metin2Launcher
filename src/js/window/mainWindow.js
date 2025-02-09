// first of all hideWindows
function hideWindows () {
  const configWindow = document.getElementById('configWindow')
  const updaterUI = document.getElementById('updaterUI')
  const playButton = document.getElementById('playButton')
  // hide'em and leave only updaterUI i use this also for hiding the play button.
  configWindow.classList.remove('show')
  playButton.style.display = 'none'

  updaterUI.style.display = 'block'
}

hideWindows()

// first of all hideWindows

// switch trough window

function clickConfigButton () {
  const configWindow = document.getElementById('configWindow')
  const updaterUI = document.getElementById('updaterUI')
  const switchConfig = document.querySelector('.config a')

  if (configWindow.classList.contains('show')) {
    switchConfig.style.backgroundImage = 'url(../img/config.png)'
    configWindow.classList.remove('show')
    updaterUI.style.display = 'block'
  } else {
    switchConfig.style.backgroundImage = 'url(../img/back.png)'
    updaterUI.style.display = 'none'
    configWindow.classList.add('show')
  }
}
// switch trough window

// make news clickable
function makeNewsClickable(element) {
  const href = element.getAttribute('href')

  if (href && href.trim() !== '' && href !== '#') {
    event.preventDefault()
    window.electron.openExternal(href)
  } else {
    console.log('invalid url')
  }
}

// make news clickable
function setupNewsClickListeners() {
  const news1Clickable = document.getElementById('news_1_url');
  const news2Clickable = document.getElementById('news_2_url');

  // close-minimize buttons
  const minimizeButton = document.getElementById('minimizeWindow')
  const closeButton = document.getElementById('closeWindow')

  // playbutton
  const playButton = document.getElementById('playButton')

  if (playButton) {
    playButton.addEventListener('click', () => {
      hideWindows()
      playButton.style.display = 'none'
      window.electron.openGame()
    })
  }

  // listen for clicking config <a>
  const config = document.getElementById('switchConfig')
  if (config) {
    config.addEventListener('click', (event) => {
      clickConfigButton()
    })
  }
  // listen for clicking config <a>

  if (news1Clickable) {
    news1Clickable.addEventListener('click', (event) => {
      makeNewsClickable(news1Clickable)
    })
  }

  if (news2Clickable) {
    news2Clickable.addEventListener('click', (event) => {
      makeNewsClickable(news2Clickable)
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

setupNewsClickListeners()

// make news clickable
function checkOverflow (elementID) {
  const element = document.getElementById(elementID)
  if (element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientHeight) { 
    // idk why comparing scrollWidth with clientHeight but it works so let it like that btw is weird.
    element.classList.add('news-desc')
  }
}

window.electron.checkUpdates()

// fetching news
window.electron.newsFetch()

window.electron.onUpdateNews((news) => {
  document.getElementById('news_1_title').innerText = news[0].title;
  document.getElementById('news_1_desc').innerText = news[0].content;
  document.getElementById('news_2_title').innerText = news[1].title;
  document.getElementById('news_2_desc').innerText = news[1].content;
  document.getElementById('news_2_url').href = news[1].url;

  // check if text gets out of max_width and add learn more button..
  checkOverflow('news_1_desc');
  checkOverflow('news_2_desc');
})

window.electron.onUpdateStatus((message) => {
  if (message === 'ok') {
    // add play button
    document.getElementById('status').innerText = ''
    document.getElementById('playButton').style.display = 'block'
  } else if (message === 'Updated successfully.') {
    // work on updating cheching status
    document.getElementById('status').innerText = ''
  } else {
    document.getElementById('status').innerText = message // info for user
  }
})