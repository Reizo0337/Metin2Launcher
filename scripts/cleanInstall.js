const fs = require('fs');
const path = require('path');

module.exports = async function(context) {
  const appPath = path.join(context.appOutDir, 'gamelauncher');
  const filesToRemove = [
    path.join(appPath, 'LICENSE.electron.txt'),
    path.join(appPath, 'license.chromium.html')
  ];

  filesToRemove.forEach(filePath => {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Removed ${filePath}`);
      }
    } catch (err) {
      console.error(`Error removing ${filePath}:`, err);
    }
  });
};
