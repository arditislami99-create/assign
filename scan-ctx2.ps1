$b = Get-Content "$env:TEMP\bundle.txt" -Raw
foreach ($pat in @('RegExp\.escape', 'navigation\.addEventListener')) {
  Write-Output "===== $pat ====="
  $m = [regex]::Matches($b, $pat)
  foreach ($match in $m) {
    $start = [Math]::Max(0, $match.Index - 300)
    $len = [Math]::Min(700, $b.Length - $start)
    Write-Output "----- context -----"
    Write-Output $b.Substring($start, $len)
  }
}
