// Drinks Up — Azure infrastructure
//   • Azure Database for PostgreSQL Flexible Server (database: drinksup)
//   • Azure App Service (Linux, Node 22) running the Express API  (backend/)
//   • 2 × Azure Static Web Apps: storefront (frontend/) and admin dashboard (admin/)
//   • Storage account + public blob container for product image uploads
//
// Deploy:  see infra/deploy.ps1  (az deployment group create -f infra/main.bicep …)

@description('Short lowercase prefix for resource names, e.g. drinksup')
@minLength(3)
@maxLength(12)
param prefix string = 'drinksup'

@description('Region for the database, API and storage. Australia East keeps data close to customers.')
param location string = 'australiaeast'

@description('Static Web Apps are only offered in a few regions; East Asia is the closest to Australia.')
@allowed(['eastasia', 'westus2', 'centralus', 'eastus2', 'westeurope'])
param swaLocation string = 'eastasia'

@description('PostgreSQL administrator login')
param pgAdminUser string = 'drinksupadmin'

@secure()
@description('PostgreSQL administrator password (min 8 chars, upper/lower/number/symbol)')
param pgAdminPassword string

@secure()
@description('Secret used to sign API session tokens — a long random string')
param jwtSecret string

@description('Shopify store that takes the payment hand-off')
param shopifyStoreUrl string = 'https://drinksup.com.au'

var suffix = uniqueString(resourceGroup().id)
var pgName = '${prefix}-pg-${suffix}'
var apiName = '${prefix}-api-${suffix}'
var planName = '${prefix}-plan'
var storageName = take(toLower(replace('${prefix}img${suffix}', '-', '')), 24)

/* ---------------- PostgreSQL ---------------- */
resource pg 'Microsoft.DBforPostgreSQL/flexibleServers@2024-08-01' = {
  name: pgName
  location: location
  sku: { name: 'Standard_B1ms', tier: 'Burstable' }
  properties: {
    version: '16'
    administratorLogin: pgAdminUser
    administratorLoginPassword: pgAdminPassword
    storage: { storageSizeGB: 32, autoGrow: 'Enabled' }
    backup: { backupRetentionDays: 7, geoRedundantBackup: 'Disabled' }
    highAvailability: { mode: 'Disabled' }
    network: { publicNetworkAccess: 'Enabled' }
  }
}

resource pgDb 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2024-08-01' = {
  parent: pg
  name: 'drinksup'
  properties: { charset: 'UTF8', collation: 'en_US.utf8' }
}

// 0.0.0.0 – 0.0.0.0 = "allow Azure services" (the App Service). Add your own IP for migrations (deploy.ps1 does).
resource pgAllowAzure 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2024-08-01' = {
  parent: pg
  name: 'AllowAzureServices'
  properties: { startIpAddress: '0.0.0.0', endIpAddress: '0.0.0.0' }
}

/* ---------------- Storage (product images) ---------------- */
resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageName
  location: location
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
  properties: {
    allowBlobPublicAccess: true
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
  }
}

resource blobSvc 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  parent: storage
  name: 'default'
}

resource imagesContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: blobSvc
  name: 'product-images'
  properties: { publicAccess: 'Blob' }
}

/* ---------------- Static Web Apps ---------------- */
resource storefront 'Microsoft.Web/staticSites@2023-12-01' = {
  name: '${prefix}-store'
  location: swaLocation
  sku: { name: 'Standard', tier: 'Standard' }
  properties: {}
}

resource adminSite 'Microsoft.Web/staticSites@2023-12-01' = {
  name: '${prefix}-admin'
  location: swaLocation
  sku: { name: 'Standard', tier: 'Standard' }
  properties: {}
}

/* ---------------- API (App Service) ---------------- */
resource plan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: planName
  location: location
  kind: 'linux'
  sku: { name: 'B1', tier: 'Basic' }
  properties: { reserved: true }
}

var storageConn = 'DefaultEndpointsProtocol=https;AccountName=${storage.name};AccountKey=${storage.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}'

resource api 'Microsoft.Web/sites@2023-12-01' = {
  name: apiName
  location: location
  kind: 'app,linux'
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|22-lts'
      appCommandLine: 'node dist/index.js'
      alwaysOn: true
      healthCheckPath: '/api/health'
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      appSettings: [
        { name: 'NODE_ENV', value: 'production' }
        { name: 'SCM_DO_BUILD_DURING_DEPLOYMENT', value: 'false' }
        { name: 'DATABASE_URL', value: 'postgres://${pgAdminUser}:${uriComponent(pgAdminPassword)}@${pg.properties.fullyQualifiedDomainName}:5432/drinksup' }
        { name: 'DATABASE_SSL', value: 'true' }
        { name: 'JWT_SECRET', value: jwtSecret }
        { name: 'CORS_ORIGINS', value: 'https://${storefront.properties.defaultHostname},https://${adminSite.properties.defaultHostname}' }
        { name: 'SHOPIFY_STORE_URL', value: shopifyStoreUrl }
        { name: 'AZURE_STORAGE_CONNECTION_STRING', value: storageConn }
        { name: 'AZURE_STORAGE_CONTAINER', value: 'product-images' }
      ]
    }
  }
}

output apiUrl string = 'https://${api.properties.defaultHostName}'
output apiName string = api.name
output storefrontUrl string = 'https://${storefront.properties.defaultHostname}'
output storefrontName string = storefront.name
output adminUrl string = 'https://${adminSite.properties.defaultHostname}'
output adminName string = adminSite.name
output pgServerName string = pg.name
output pgHost string = pg.properties.fullyQualifiedDomainName
