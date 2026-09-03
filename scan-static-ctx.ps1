foreach ($name in @("36gp9luro0cal.js", "3ypblguq2t7ro.js")) {
  $f = Get-ChildItem -Recurse -Filter $name .next/static/chunks | Select-Object -First 1
  Write-Output "===== $($f.FullName) ($($f.Length) bytes) ====="
  $b = Get-Content $f.FullName -Raw
  $m = [regex]::Matches($b, 'static\{')
  foreach ($match in $m) {
    $start = [Math]::Max(0, $match.Index - 250)
    $len = [Math]::Min(600, $b.Length - $start)
    Write-Output "----- context -----"
    Write-Output $b.Substring($start, $len)
  }
}