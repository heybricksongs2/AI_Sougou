@echo off
chcp 65001 >nul
echo フォルダアイコンを適用しています...

copy /y "%~dp0apple.ico" "C:\gdrive\NFolder\apple.ico" >nul

(
echo [.ShellClassInfo]
echo IconResource=apple.ico,0
echo [ViewState]
echo Mode=
echo Vid=
echo FolderType=Generic
) > "C:\gdrive\NFolder\desktop.ini"

attrib +h +s "C:\gdrive\NFolder\desktop.ini"
attrib +r "C:\gdrive\NFolder"

echo 適用が完了しました。エクスプローラーを再読み込みします...
taskkill /f /im explorer.exe >nul 2>&1
start explorer.exe
pause
