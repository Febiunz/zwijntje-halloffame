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
 * Name mapping for handling same people with different names
 * Maps variations to the canonical name to use
 */
const NAME_MAPPINGS = {
  'anette van velzen': 'Anette Boluijt',
  'vikas arumugan': 'Vikas Arumugam',
  'roy derksen': 'Roy Derks',
  'jan van de bosch': 'Jan van den Bosch',
  'chantal kamphuis': 'Chantal Brinks-Kamphuis',
  'bert jan rietveld': 'Bert-Jan Rietveld'
};

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
 * Apply name mappings to ensure consistent names
 * Returns the canonical name to use
 */
function applyNameMapping(name) {
  const normalized = normalizeName(name);
  
  // Check if there's a mapping for this name
  if (NAME_MAPPINGS[normalized]) {
    return NAME_MAPPINGS[normalized];
  }
  
  return name;
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
 * Fetch HTML content from a URL with retry logic
 */
function fetchUrl(url, retries = 3, delayMs = 500) {
  return new Promise((resolve, reject) => {
    function attempt(remainingRetries, currentDelay) {
      const req = https.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          const statusCode = res.statusCode || 0;
          
          // Retry on common transient status codes
          const shouldRetryStatus = statusCode === 429 || (statusCode >= 500 && statusCode < 600);
          
          if (statusCode === 200) {
            resolve(data);
          } else if (shouldRetryStatus && remainingRetries > 0) {
            console.log(`   ⚠ Status ${statusCode}, retrying... (${remainingRetries} attempts left)`);
            setTimeout(() => {
              attempt(remainingRetries - 1, currentDelay * 2);
            }, currentDelay);
          } else {
            reject(new Error(`Request to ${url} failed with status code ${statusCode}`));
          }
        });
      });
      
      req.on('error', (err) => {
        if (remainingRetries > 0) {
          console.log(`   ⚠ Network error, retrying... (${remainingRetries} attempts left)`);
          setTimeout(() => {
            attempt(remainingRetries - 1, currentDelay * 2);
          }, currentDelay);
        } else {
          reject(err);
        }
      });
    }
    
    attempt(retries, delayMs);
  });
}

/**
 * Parse table data from HTML
 * Note: This function runs in Node.js during build time to extract data from HTML.
 * The output is stored in JSON and never rendered as HTML in the browser.
 * Frontend uses textContent (not innerHTML) to safely display the data.
 */
function parseTableData(html) {
  const tdRegex = /<td[^>]*>(.*?)<\/td>/gs;
  const cells = [];
  
  let match;
  while ((match = tdRegex.exec(html)) !== null) {
    // Remove HTML tags and decode entities
    // This is safe because: (1) runs in Node.js, not browser
    // (2) output stored as JSON, not rendered as HTML
    let content = match[1]
      // Remove all HTML tags
      .replace(/<[^>]*>/g, '')
      // Decode HTML entities
      .replace(/&[^;]+;/g, (entity) => {
        const entities = {
          '&#8211;': '–',
          '&nbsp;': ' ',
          '&amp;': '&',
          '&lt;': '<',
          '&gt;': '>',
          '&quot;': '"',
          '&#39;': "'"
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
  
  // Determine expected columns based on source
  if (source.category === 'zomercyclus') {
    // Zomercyclus: Jaar, Naam
    // Skip header (first 2 cells)
    for (let i = 2; i < cells.length; i += 2) {
      const year = cells[i];
      if (!year || !/^\d{4}$/.test(year)) continue;
      
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
    }
  } else if (source.category === 'tete-a-tete') {
    // Tête-à-tête: Jaar, Heren, Dames
    // Skip header (first 3 cells)
    for (let i = 3; i < cells.length; i += 3) {
      const year = cells[i];
      if (!year || !/^\d{4}$/.test(year)) continue;
      
      const menWinner = cells[i + 1];
      const womenWinner = cells[i + 2];
      
      if (menWinner && menWinner !== '–') {
        results.push({
          year: parseInt(year),
          category: source.category,
          type: source.type,
          poule: 'A',
          winners: [menWinner]
        });
      }
      
      if (womenWinner && womenWinner !== '–') {
        results.push({
          year: parseInt(year),
          category: source.category,
          type: source.type,
          poule: 'A',
          winners: [womenWinner]
        });
      }
    }
  } else {
    // Other categories: Process row by row, detecting year cells
    // Table structure varies: some rows have 3 cells (Year, A, B), some have 4 (Year, A, B, C)
    let i = 0;
    
    // Skip until we find first year (after header)
    while (i < cells.length && !/^\d{4}$/.test(cells[i])) {
      i++;
    }
    
    // Process remaining cells
    while (i < cells.length) {
      const year = cells[i];
      
      // Check if this is a valid year
      if (!/^\d{4}$/.test(year)) {
        i++;
        continue;
      }
      
      const parsedYear = parseInt(year);
      i++; // Move to Poule A
      
      // Get Poule A data
      const pouleA = cells[i];
      if (pouleA && pouleA !== '–' && pouleA.trim() !== '') {
        const names = extractNames(pouleA);
        if (names.length > 0) {
          results.push({
            year: parsedYear,
            category: source.category,
            type: source.type,
            poule: 'A',
            winners: names
          });
        }
      }
      i++; // Move past Poule A
      
      // Skip Poule B and optionally Poule C until we find the next year or end
      while (i < cells.length && !/^\d{4}$/.test(cells[i])) {
        i++;
      }
    }
  }
  
  return results;
}

/**
 * Count diacritical marks in a name (accents, etc.)
 * Used to prefer the most complete version of a name
 */
function countDiacritics(str) {
  return (str.match(/[éèêëáàâäíìîïóòôöúùûüçñ]/gi) || []).length;
}

/**
 * Build aggregated statistics per player
 */
function buildPlayerStats(allResults) {
  const playerMap = new Map();
  
  // Count wins per category per player
  allResults.forEach(result => {
    result.winners.forEach(name => {
      // Apply name mapping first to get canonical name
      const canonicalName = applyNameMapping(name);
      const normalizedName = normalizeName(canonicalName);
      
      if (!playerMap.has(normalizedName)) {
        playerMap.set(normalizedName, {
          displayName: canonicalName,
          wins: {},
          totalWins: 0
        });
      } else {
        // Update display name to prefer version with more diacritics (accents)
        const player = playerMap.get(normalizedName);
        if (countDiacritics(canonicalName) > countDiacritics(player.displayName)) {
          player.displayName = canonicalName;
        }
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
