# 🏆 Zwijntje Hall of Fame

A modern, responsive website showcasing the championship results and hall of fame for JBV 't Zwijntje, a Dutch jeu de boules (petanque) club.

[![Deploy to Azure](https://github.com/Febiunz/zwijntje-halloffame/workflows/Deploy%20to%20Azure%20Static%20Web%20Apps/badge.svg)](https://github.com/Febiunz/zwijntje-halloffame/actions)

## 🎯 Features

- **📊 Comprehensive Statistics**: Aggregates wins across 7 different championship and competition categories
- **🔍 Smart Search & Filtering**: Find players by name or filter by minimum wins
- **📱 Mobile-First Design**: Fully responsive layout optimized for all devices
- **🌓 Dark Mode**: Automatic theme switching with user preference storage
- **⚡ Modern Technology**: Built with vanilla JavaScript, CSS Grid, and modern web standards
- **🤖 Automated Updates**: Data automatically extracted from official website
- **☁️ Azure Hosting**: Deployed on Azure Static Web Apps with CI/CD

## 📈 Data Sources

The website aggregates championship data from the official [Zwijntje website](https://www.zwijntje.nl):

### Championships (Kampioenschappen)
- Doubletten (Doubles)
- Mix (Mixed Doubles)
- Tête-à-tête (Singles - Men & Women)
- Tripletten (Triples)

### Competitions (Competities)
- Doubletten
- Tripletten
- Zomercyclus (Summer Cycle)

**Note**: Only wins from Poule A (top division) are counted towards the total.

## 🏗️ Architecture

### Frontend
- **HTML5**: Semantic markup with accessibility features
- **CSS3**: Modern features including CSS Grid, Flexbox, and Custom Properties
- **JavaScript**: Vanilla ES6+ with no framework dependencies
- **Design**: Mobile-first, responsive design with dark mode support

### Backend & Infrastructure
- **Data Extraction**: Node.js script that scrapes official website
- **Hosting**: Azure Static Web Apps
- **Infrastructure as Code**: Bicep templates
- **CI/CD**: GitHub Actions for automated deployment

### Project Structure
```
zwijntje-halloffame/
├── .github/
│   ├── workflows/
│   │   └── azure-static-web-apps.yml    # Deployment workflow
│   ├── copilot-instructions.md          # Copilot guidance
│   └── dependabot.yml                   # Dependency updates
├── infrastructure/
│   └── main.bicep                       # Azure infrastructure
├── scripts/
│   └── extract-data.js                  # Data extraction script
├── src/
│   ├── data/
│   │   └── halloffame.json             # Generated data
│   ├── scripts/
│   │   └── main.js                     # Frontend JavaScript
│   ├── styles/
│   │   └── main.css                    # Stylesheet
│   └── index.html                      # Main page
├── package.json
├── LICENSE
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/Febiunz/zwijntje-halloffame.git
   cd zwijntje-halloffame
   ```

2. **Extract the latest data**
   ```bash
   npm run extract-data
   ```

3. **Start local server**
   ```bash
   npm start
   ```
   
   The website will be available at `http://localhost:3000`

### Updating Data

To refresh the hall of fame data from the official website:

```bash
npm run extract-data
```

This script:
- Fetches data from all 7 championship/competition pages
- Normalizes player names (handles accents and variations)
- Calculates win statistics per category
- Generates `src/data/halloffame.json`

## 🔧 Configuration

### Azure Deployment

The project uses Azure Static Web Apps for hosting. To deploy:

1. **Create Azure Static Web App** (one-time setup)
   ```bash
   az deployment group create \
     --resource-group <your-rg> \
     --template-file infrastructure/main.bicep
   ```

2. **Configure GitHub Secret**
   - Get the deployment token from Azure Portal
   - Add as `AZURE_STATIC_WEB_APPS_API_TOKEN` in GitHub repository secrets

3. **Deploy**
   - Push to `main` branch triggers automatic deployment
   - Pull requests create preview environments

### Environment Variables

No environment variables required for basic operation. All configuration is in code.

## 🎨 Customization

### Theme Colors

Colors are defined as CSS custom properties in `src/styles/main.css`:

```css
:root {
    --color-primary: #2c5f2d;      /* Club green */
    --color-accent: #d4af37;       /* Gold */
    /* ... more colors ... */
}
```

### Data Categories

To add or modify categories, update:
1. `scripts/extract-data.js` - DATA_SOURCES array
2. `src/scripts/main.js` - CATEGORY_MAP object
3. `src/index.html` - Table headers

## 📊 Data Format

The generated `halloffame.json` structure:

```json
{
  "lastUpdated": "2025-12-19T19:56:38.246Z",
  "sources": [...],
  "players": [
    {
      "displayName": "Ferdinand Wiese",
      "wins": {
        "championship_doubletten": 6,
        "championship_mix": 4,
        ...
      },
      "totalWins": 29
    }
  ],
  "allResults": [...]
}
```

## 🧪 Testing

The website can be tested locally:

```bash
# Extract fresh data
npm run extract-data

# Start local server
npm start

# Open browser to http://localhost:3000
```

Manual testing checklist:
- ✅ Table loads and displays data
- ✅ Search filters players correctly
- ✅ Sorting works for all columns
- ✅ Dark/light mode toggle functions
- ✅ Responsive on mobile devices
- ✅ All links work correctly

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- JBV 't Zwijntje for the championship data
- All the players and members of the club
- [Azure Static Web Apps](https://azure.microsoft.com/en-us/services/app-service/static/) for hosting

## 📞 Contact

- Website: [www.zwijntje.nl](https://www.zwijntje.nl)
- GitHub: [@Febiunz](https://github.com/Febiunz)

## 🗺️ Roadmap

Future enhancements:
- [ ] Add historical trend charts
- [ ] Player detail pages with year-by-year breakdown
- [ ] Export to PDF functionality
- [ ] Multi-language support (Dutch/English)
- [ ] Add team statistics
- [ ] Performance metrics and analytics

---

Made with ❤️ for JBV 't Zwijntje | Last updated: December 2025