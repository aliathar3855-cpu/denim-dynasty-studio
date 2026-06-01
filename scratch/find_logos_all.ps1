Get-ChildItem -Path "C:\Users\Ali Athar" -Filter "*logo*" -Recurse -ErrorAction SilentlyContinue | 
    Where-Object { $_.FullName -notmatch "node_modules|AppData" } | 
    Where-Object { $_.Name -like "*logo-icon*" -or $_.Name -like "*logo-full*" -or $_.Name -like "*logo_icon*" -or $_.Name -like "*logo_full*" } |
    Select-Object Name, Length, FullName
