$files = Get-ChildItem -Recurse -Filter "*.js" .next/static/chunks | Where-Object { $_.Length -gt 1024 }
foreach ($f in $files) {
  $b = Get-Content $f.FullName -Raw
  $c1 = [regex]::Matches($b, 'static\{').Count
  $c2 = [regex]::Matches($b, '#[A-Za-z_$][\w$]*\s+in\s').Count
  if ($c1 -gt 0 -or $c2 -gt 0) { Write-Output "$($f.Name): static{=$c1 private-in=$c2" }
}
Write-Output "done"