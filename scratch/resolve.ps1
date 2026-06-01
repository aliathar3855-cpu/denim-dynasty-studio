$sh = New-Object -ComObject WScript.Shell
$s = $sh.CreateShortcut('C:\Users\Ali Athar\Desktop\denim-dynasty-studio\public\logo full png - Shortcut.lnk')
Write-Output $s.TargetPath
