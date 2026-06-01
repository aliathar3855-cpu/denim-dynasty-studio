Get-ChildItem -Path "C:\Users\Ali Athar\Downloads" | Where-Object { $_.Extension -match "\.(png|jpg|jpeg|svg|ico)$" } | Select-Object Name, Length
