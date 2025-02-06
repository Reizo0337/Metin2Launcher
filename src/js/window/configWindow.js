// onInit
hideUI()
switchUI('general')

document.getElementById('file-input').addEventListener('change', function(event) {
  let fileName = event.target.files.length > 0 ? event.target.files[0].name : 'Choose a file...'
  document.getElementById('file-name').textContent = fileName
})
// onInit

// Listener
document.getElementById('generalToggle').addEventListener('click', function () {
  switchUI('general')
})

document.getElementById('displayToggle').addEventListener('click', function () {
  switchUI('display')
})

document.getElementById('soundToggle').addEventListener('click', function () {
  switchUI('sound')
})

document.getElementById('effectsToggle').addEventListener('click', function () {
  switchUI('effects')
})
// Listener

// Workers
function hideUI () {
  if (document.getElementById('updaterUI').style.display === 'block') {
    document.getElementById('configWindow').style.display = 'none'
  } else {
    document.getElementById('general').style.display = 'none'
    document.getElementById('display').style.display = 'none'
    document.getElementById('sound').style.display = 'none'
    document.getElementById('effects').style.display = 'none'
  }
}

function switchUI (id) {
  hideUI()
  document.getElementById(id).style.display =
        document.getElementById(id).style.display === 'none' ? 'block' : 'none'
}
// Workers
