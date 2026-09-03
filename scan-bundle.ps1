$b = Get-Content "$env:TEMP\bundle.txt" -Raw
$patterns = @{
  'lookbehind'      = '\(\?\<[=!]'
  'withResolvers'   = 'withResolvers'
  'structuredClone' = 'structuredClone'
  'Object.hasOwn'   = 'Object\.hasOwn'
  'findLast('       = '\.findLast\('
  'toSorted('       = '\.toSorted\('
  'toReversed('     = '\.toReversed\('
  'groupBy'         = 'Object\.groupBy|Map\.groupBy'
  'randomUUID'      = 'randomUUID'
  'Array.fromAsync' = 'fromAsync'
}
foreach ($k in $patterns.Keys) {
  $c = [regex]::Matches($b, $patterns[$k]).Count
  Write-Output "$k = $c"
}
