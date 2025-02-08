<h1>REIZO_GAMELAUNCHER</h1>
This launcher is made by Reizo#0337.

Dependencies:
- standard
- nodejs
- electron
- bootstrap
- vscode/any other editor.


Attr:
- Clean & Modern UI.
- Update faster than never.
- updates are made now by md5 verification.
- If the page is getting flooder/something that can't get the file in the moment it will retry.
- Added log.txt file
- Config Page added, now you are able to config the game from the GamePatcher.
- Download's max 3 files simultaneously (it can be changed.)
- If the CDN/Server is under DDoS attack or something that make it slow, the patcher will detect this and return immediately. (and check after 5 minutes.)


TODO:

- Verify if the Launcher really download something. (Cause if the files are already uploaded, he will say Updated Succesfully and that's not really ok)
- MultiLanguage support.


IDEAS:

- Chunking the files and downloading them by chunks, to let user restart the download if there's any problem with the internet or server. This will prevent of bad downloads. PARTIAL DOWNLOADS.
- Add 2process updating. (while playing the game)