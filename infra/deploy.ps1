<#
.SYNOPSIS
  Provision Azure resources and deploy Drinks Up (database, API, storefront, admin).

.REQUIREMENTS
  Azure CLI (az) logged in:  az login ; az account set -s <subscription>
  Node.js 20+ and npm.

.EXAMPLE
  # first deployment (creates everything and loads the product catalogue)
  ./infra/deploy.ps1 -PgAdminPassword 'S0me-Strong-Pass!' -JwtSecret '<long random string>' -Seed

  # later code-only deployments
  ./infra/deploy.ps1 -PgAdminPassword '…' -JwtSecret '<same secret>'
#>
param(
  # Dedicated resource group for this project only — never shared with other web apps.
  [string]$ResourceGroup = 'drinksup-ecommerce-rg',
  [string]$Location = 'australiaeast',
  [string]$SwaLocation = 'eastasia',
  [string]$Prefix = 'drinksup',
  [string]$PgAdminUser = 'drinksupadmin',
  [Parameter(Mandatory = $true)][string]$PgAdminPassword,
  [Parameter(Mandatory = $true)][string]$JwtSecret,
  [string]$AdminEmail = 'admin@drinksup.com.au',
  [string]$AdminPassword = '',
  # -Seed WIPES all data and loads the product catalogue. Use it only on the first deployment.
  [switch]$Seed,
  [switch]$SkipInfra,
  # Safety: the script refuses to deploy into a resource group that already holds resources it didn't create.
  [switch]$AllowExistingGroup
)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent

function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }

# ---------------------------------------------------------------- infrastructure
Step "Resource group $ResourceGroup ($Location)"
$exists = (az group exists -n $ResourceGroup) -eq 'true'
if ($exists -and -not $SkipInfra -and -not $AllowExistingGroup) {
  $tag = az group show -n $ResourceGroup --query "tags.project" -o tsv
  if ($tag -ne 'drinksup-ecommerce') {
    throw "Resource group '$ResourceGroup' already exists and was not created by this project. " +
          "Choose a new name with -ResourceGroup so Drinks Up gets its own database and resources."
  }
}
az group create -n $ResourceGroup -l $Location --tags project=drinksup-ecommerce -o none

Step 'Bicep deployment (PostgreSQL, App Service, Static Web Apps, Storage)'
$deployArgs = @('deployment', 'group', 'create', '-g', $ResourceGroup, '-f', "$PSScriptRoot/main.bicep",
  '-p', "prefix=$Prefix", "location=$Location", "swaLocation=$SwaLocation", "pgAdminUser=$PgAdminUser",
  "pgAdminPassword=$PgAdminPassword", "jwtSecret=$JwtSecret", '--query', 'properties.outputs', '-o', 'json')
if ($SkipInfra) {
  $deployArgs = @('deployment', 'group', 'show', '-g', $ResourceGroup, '-n', 'main', '--query', 'properties.outputs', '-o', 'json')
}
$out = (az @deployArgs) | ConvertFrom-Json
$apiUrl = $out.apiUrl.value; $apiName = $out.apiName.value
$storeUrl = $out.storefrontUrl.value; $storeName = $out.storefrontName.value
$adminUrl = $out.adminUrl.value; $adminName = $out.adminName.value
$pgServer = $out.pgServerName.value; $pgHost = $out.pgHost.value

# ---------------------------------------------------------------- database
Step 'Database schema'
$ip = (Invoke-RestMethod -Uri 'https://api.ipify.org')
az postgres flexible-server firewall-rule create -g $ResourceGroup --name $pgServer --rule-name deploy-client `
  --start-ip-address $ip --end-ip-address $ip -o none
$env:DATABASE_URL = "postgres://${PgAdminUser}:$([uri]::EscapeDataString($PgAdminPassword))@${pgHost}:5432/drinksup"
$env:DATABASE_SSL = 'true'
Push-Location "$root/database"
npm ci
npm run migrate
if ($Seed) {
  Step 'Seeding product catalogue (wipes existing data)'
  $env:ADMIN_EMAIL = $AdminEmail
  if ($AdminPassword) { $env:ADMIN_PASSWORD = $AdminPassword }
  npm run seed
}
Pop-Location
Remove-Item Env:DATABASE_URL, Env:DATABASE_SSL -ErrorAction SilentlyContinue

# ---------------------------------------------------------------- API
Step "API → $apiUrl"
Push-Location "$root/backend"
npm ci
npm run build
$stage = Join-Path ([IO.Path]::GetTempPath()) 'drinksup-api'
Remove-Item $stage, "$stage.zip" -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory $stage | Out-Null
Copy-Item -Recurse dist, package.json, package-lock.json $stage
Pop-Location
Push-Location $stage
npm ci --omit=dev
# bsdtar writes forward-slash paths, which Linux App Service needs (Compress-Archive on PS 5.1 does not)
tar -a -c -f "$stage.zip" *
Pop-Location
az webapp deploy -g $ResourceGroup -n $apiName --src-path "$stage.zip" --type zip -o none

# ---------------------------------------------------------------- storefront
Step "Storefront → $storeUrl"
$env:VITE_API_URL = $apiUrl
Push-Location "$root/frontend"
npm ci
npm run build
$tok = az staticwebapp secrets list -n $storeName -g $ResourceGroup --query 'properties.apiKey' -o tsv
npx --yes @azure/static-web-apps-cli@2 deploy ./dist --deployment-token $tok --env production
Pop-Location

# ---------------------------------------------------------------- admin
Step "Admin → $adminUrl"
$env:VITE_STORE_URL = $storeUrl
Push-Location "$root/admin"
npm ci
npm run build
$tok = az staticwebapp secrets list -n $adminName -g $ResourceGroup --query 'properties.apiKey' -o tsv
npx --yes @azure/static-web-apps-cli@2 deploy ./dist --deployment-token $tok --env production
Pop-Location
Remove-Item Env:VITE_API_URL, Env:VITE_STORE_URL -ErrorAction SilentlyContinue

Step 'Done'
Write-Host "Storefront : $storeUrl"
Write-Host "Admin      : $adminUrl"
Write-Host "API        : $apiUrl/api/health"
