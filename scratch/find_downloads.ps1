Get-ChildItem -Path "C:\Users\Ali Athar\Desktop" -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.Name -like "*logo*" -or $_.Name -like "*icon*" } | Select-Object Name, Length, FullName
