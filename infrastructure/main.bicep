@description('Name of the Static Web App')
param name string = 'zwijntje-halloffame'

@description('Location for the Static Web App')
param location string = 'westeurope'

@description('SKU for the Static Web App')
@allowed([
  'Free'
  'Standard'
])
param sku string = 'Free'

@description('Tags to apply to the resources')
param tags object = {
  Application: 'Zwijntje Hall of Fame'
  Environment: 'Production'
  ManagedBy: 'Bicep'
}

@description('Repository URL')
param repositoryUrl string = 'https://github.com/Febiunz/zwijntje-halloffame'

@description('Branch to deploy from')
param branch string = 'main'

resource staticWebApp 'Microsoft.Web/staticSites@2023-01-01' = {
  name: name
  location: location
  tags: tags
  sku: {
    name: sku
    tier: sku
  }
  properties: {
    repositoryUrl: repositoryUrl
    branch: branch
    buildProperties: {
      appLocation: 'src'
      apiLocation: ''
      outputLocation: ''
    }
    stagingEnvironmentPolicy: 'Enabled'
    allowConfigFileUpdates: true
  }
}

@description('Custom domain configuration (optional)')
resource customDomain 'Microsoft.Web/staticSites/customDomains@2023-01-01' = if (false) {
  parent: staticWebApp
  name: 'www.example.com'
  properties: {}
}

output staticWebAppId string = staticWebApp.id
output staticWebAppName string = staticWebApp.name
output defaultHostname string = staticWebApp.properties.defaultHostname
output repositoryUrl string = staticWebApp.properties.repositoryUrl
output branch string = staticWebApp.properties.branch
