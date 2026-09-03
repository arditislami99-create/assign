$b = Get-Content "$env:TEMP\bundle.txt" -Raw
$m = [regex]::Matches($b, 'withResolvers')
foreach ($match in $m) {
  $start = [Math]::Max(0, $match.Index - 400)
  $len = [Math]::Min(800, $b.Length - $start)
  Write-Output "----- context -----"
  Write-Output $b.Substring($start, $len)
}
