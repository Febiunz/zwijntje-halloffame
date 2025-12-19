# Copilot Instructions for Zwijntje Hall of Fame

## Project Overview
This project is a static website hosted on Azure Static Web Apps that displays hall of fame results for JBV 't Zwijntje, a Dutch jeu de boules (petanque) club.

## Architecture
- **Frontend**: Pure HTML, CSS, and JavaScript (no frameworks required)
- **Data**: Extracted from official website and stored in JSON format
- **Hosting**: Azure Static Web Apps
- **Infrastructure**: Bicep templates for Azure resources
- **CI/CD**: GitHub Actions for automated deployment

## Key Requirements
1. **Responsive Design**: Mobile-first approach, must work well on all devices
2. **Modern Features**: Use latest CSS features (CSS Grid, Flexbox, CSS Variables)
3. **Data Aggregation**: Count wins across all championships (only Poule A/A Poule counts)
4. **Name Normalization**: Handle similar names (e.g., "Cédric" vs "Cedric")
5. **Clean Code**: Well-structured, commented, and maintainable

## Data Sources
The website aggregates data from 7 URLs on www.zwijntje.nl:
- **Clubkampioenschappen (Championships)**: Doubletten, Mix, Tête-à-tête, Tripletten
- **Clubcompetities (Competitions)**: Doubletten, Tripletten, Zomercyclus

## Coding Standards
- Use semantic HTML5 elements
- CSS: Use CSS custom properties for theming
- JavaScript: Modern ES6+ syntax, no jQuery
- Comments: Add comments for complex logic
- Accessibility: Ensure proper ARIA labels and keyboard navigation

## File Structure
```
/
├── .github/
│   ├── workflows/          # GitHub Actions workflows
│   └── copilot-instructions.md
├── infrastructure/         # Bicep templates
├── src/                   # Website source code
│   ├── index.html
│   ├── styles/
│   ├── scripts/
│   └── data/
├── README.md
└── LICENSE
```

## Deployment
- Automatic deployment to Azure on push to main branch
- PR deployments create preview environments
- Infrastructure provisioned via Bicep templates

## Documentation Requirements
- Update README.md with every significant change
- Document all PR changes in commit messages
- Keep this instructions file updated with architectural decisions
