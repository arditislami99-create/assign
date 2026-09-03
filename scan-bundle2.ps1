$b = Get-Content "$env:TEMP\bundle.txt" -Raw
$patterns = @{
  'AbortSignal.any'   = 'AbortSignal\.any'
  'Promise.try'       = 'Promise\.try'
  'RegExp.escape'     = 'RegExp\.escape'
  'Symbol.dispose'    = 'Symbol\.(async)?[Dd]ispose'
  'Set.union'         = '\.union\('
  'Iterator.map'      = '\.values\(\)\.'
  'ArrayBuffer.transfer' = '\.transfer\('
  'requestIdleCallback'  = 'requestIdleCallback'
  'scheduler.postTask'   = 'postTask'
  'navigation API'       = 'navigation\.addEventListener'
}
foreach ($k in $patterns.Keys) {
  $c = [regex]::Matches($b, $patterns[$k]).Count
  Write-Output "$k = $c"
}
