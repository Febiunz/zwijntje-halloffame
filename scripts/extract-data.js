#!/usr/bin/env node

/**
 * Data extraction script for Zwijntje Hall of Fame
 * Fetches championship data from www.zwijntje.nl and processes it into JSON
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Data sources configuration
const DATA_SOURCES = [
  {
    name: 'Doubletten Kampioenschappen',
    url: 'https://www.zwijntje.nl/vereniging/eregalerij/clubkampioenschappen/doubletten/',
    type: 'championship',
    category: 'doubletten'
  },
  {
    name: 'Mix Kampioenschappen',
    url: 'https://www.zwijntje.nl/vereniging/eregalerij/clubkampioenschappen/mix/',
    type: 'championship',
    category: 'mix'
  },
  {
    name: 'Tête-à-tête Kampioenschappen',
    url: 'https://www.zwijntje.nl/vereniging/eregalerij/clubkampioenschappen/tete-a-tete/',
    type: 'championship',
    category: 'tete-a-tete'
  },
  {
    name: 'Tripletten Kampioenschappen',
    url: 'https://www.zwijntje.nl/vereniging/eregalerij/clubkampioenschappen/tripletten/',
    type: 'championship',
    category: 'tripletten'
  },
  {
    name: 'Doubletten Competities',
    url: 'https://www.zwijntje.nl/vereniging/eregalerij/clubcompetities/doubletten/',
    type: 'competition',
    category: 'doubletten'
  },
  {
    name: 'Tripletten Competities',
    url: 'https://www.zwijntje.nl/vereniging/eregalerij/clubcompetities/tripletten/',
    type: 'competition',
    category: 'tripletten'
  },
  {
    name: 'Zomercyclus',
    url: 'https://www.zwijntje.nl/vereniging/eregalerij/clubcompetities/zomercyclus/',
    type: 'competition',
    category: 'zomercyclus'
  }
];

/**
 * Normalize a person's name for matching
 * Handles accents, case, and common variations
 */
function normalizeName(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[éèêë]/g, 'e')
    .replace(/[áàâä]/g, 'a')
    .replace(/[íìîï]/g, 'i')
    .replace(/[óòôö]/g, 'o')
    .replace(/[úùûü]/g, 'u')
    .replace(/ç/g, 'c')
    .replace(/ñ/g, 'n')
    .replace(/\s+/g, ' ');
}

/**
 * Extract names from a string (handles comma and "en" separated lists)
 */
function extractNames(text) {
  if (!text || text === '–' || text === '-' || text.trim() === '') {
    return [];
  }
  
  // Split by comma or " en " (Dutch for "and")
  const names = text
    .split(/,|\sen\s/)
    .map(name => name.trim())
    .filter(name => name && name !== '–' && name !== '-');
  
  return names;
}

/**
 * Fetch HTML content from a URL
 */
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

/**
 * Parse table data from HTML
 */
function parseTableData(html) {
  const results = [];
  const tdRegex = /<td[^>]*>(.*?)<\/td>/gs;
  const cells = [];
  
  let match;
  while ((match = tdRegex.exec(html)) !== null) {
    // Remove HTML tags and decode entities
    let content = match[1]
      .replace(/<[^>]*>/g, '')
      .replace(/&[^;]+;/g, (entity) => {
        const entities = {
          '&#8211;': '–',
          '&nbsp;': ' ',
          '&amp;': '&'
        };
        return entities[entity] || entity;
      })
      .trim();
    
    cells.push(content);
  }
  
  return cells;
}

/**
 * Process championship/competition data
 */
function processData(cells, source) {
  const results = [];
  
  // Skip header row (first 3 or 2 cells)
  let headerSize = 3;
  if (source.category === 'zomercyclus') {
    headerSize = 2;
  } else if (source.category === 'tete-a-tete') {
    headerSize = 3; // Jaar, Heren, Dames
  }
  
  // Process data in rows
  for (let i = headerSize; i < cells.length; i += headerSize) {
    const year = cells[i];
    
    // Skip if not a valid year
    if (!year || !/^\d{4}$/.test(year)) continue;
    
    if (source.category === 'zomercyclus') {
      // Zomercyclus has only year and name
      const winner = cells[i + 1];
      if (winner && winner !== '–') {
        results.push({
          year: parseInt(year),
          category: source.category,
          type: source.type,
          poule: 'A',
          winners: [winner]
        });
      }
    } else if (source.category === 'tete-a-tete') {
      // Tête-à-tête has separate columns for men and women
      const menWinner = cells[i + 1];
      const womenWinner = cells[i + 2];
      
      if (menWinner && menWinner !== '–') {
        results.push({
          year: parseInt(year),
          category: source.category + '-heren',
          type: source.type,
          poule: 'A',
          winners: [menWinner]
        });
      }
      
      if (womenWinner && womenWinner !== '–') {
        results.push({
          year: parseInt(year),
          category: source.category + '-dames',
          type: source.type,
          poule: 'A',
          winners: [womenWinner]
        });
      }
    } else {
      // Regular format: Year, Poule A, Poule B (or C)
      const pouleA = cells[i + 1];
      const pouleB = cells[i + 2];
      
      if (pouleA && pouleA !== '–') {
        const names = extractNames(pouleA);
        if (names.length > 0) {
          results.push({
            year: parseInt(year),
            category: source.category,
            type: source.type,
            poule: 'A',
            winners: names
          });
        }
      }
      
      // We don't count Poule B as wins per requirements
    }
  }
  
  return results;
}

/**
 * Build aggregated statistics per player
 */
function buildPlayerStats(allResults) {
  const playerMap = new Map();
  
  // Count wins per category per player
  allResults.forEach(result => {
    result.winners.forEach(name => {
      const normalizedName = normalizeName(name);
      
      if (!playerMap.has(normalizedName)) {
        playerMap.set(normalizedName, {
          displayName: name, // Keep first occurrence as display name
          wins: {},
          totalWins: 0
        });
      }
      
      const player = playerMap.get(normalizedName);
      const categoryKey = `${result.type}_${result.category}`;
      
      if (!player.wins[categoryKey]) {
        player.wins[categoryKey] = 0;
      }
      
      player.wins[categoryKey]++;
      player.totalWins++;
    });
  });
  
  // Convert to array and sort by total wins
  const players = Array.from(playerMap.values())
    .sort((a, b) => b.totalWins - a.totalWins);
  
  return players;
}

/**
 * Main execution
 */
async function main() {
  console.log('🏆 Extracting Zwijntje Hall of Fame data...\n');
  
  const allResults = [];
  
  for (const source of DATA_SOURCES) {
    console.log(`📥 Fetching: ${source.name}`);
    try {
      const html = await fetchUrl(source.url);
      const cells = parseTableData(html);
      const results = processData(cells, source);
      
      allResults.push(...results);
      console.log(`   ✓ Found ${results.length} wins`);
    } catch (error) {
      console.error(`   ✗ Error: ${error.message}`);
    }
  }
  
  console.log(`\n📊 Processing ${allResults.length} total wins...`);
  
  const playerStats = buildPlayerStats(allResults);
  console.log(`   ✓ Found ${playerStats.length} unique players`);
  
  // Prepare output data
  const outputData = {
    lastUpdated: new Date().toISOString(),
    sources: DATA_SOURCES.map(s => ({ name: s.name, url: s.url })),
    players: playerStats,
    allResults: allResults
  };
  
  // Write to JSON file
  const outputPath = path.join(__dirname, '../src/data/halloffame.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
  
  console.log(`\n✅ Data saved to: ${outputPath}`);
  console.log(`📈 Top 5 players:`);
  playerStats.slice(0, 5).forEach((player, index) => {
    console.log(`   ${index + 1}. ${player.displayName}: ${player.totalWins} wins`);
  });
}

// Run the script
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
