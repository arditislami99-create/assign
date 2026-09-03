$files = Get-ChildItem -Recurse -Filter "*.js" .next/static/chunks | Where-Object { $_.Length -gt 1024 }
Write-Output "scanning $($files.Count) chunks"
$patterns = @{
  'lookbehind'        = '\(\?\<[=!]'
  'Symbol.dispose'    = 'Symbol\.(async)?[Dd]ispose'
  'Promise.try'       = 'Promise\.try'
  'RegExp.escape-call'= 'RegExp\.escape\('
  'AbortSignal.any'   = 'AbortSignal\.any'
  'fromAsync'         = 'fromAsync'
}
foreach ($f in $files) {
  $b = Get-Content $f.FullName -Raw
  foreach ($k in $patterns.Keys) {
    $c = [regex]::Matches($b, $patterns[$k]).Count
    if ($c -gt 0) { Write-Output "$($f.Name): $k = $c" }
  }
}
Write-Output "done"