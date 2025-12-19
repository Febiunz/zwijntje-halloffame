/**
 * Zwijntje Hall of Fame - Main JavaScript
 * Handles data loading, table rendering, sorting, filtering, and theme management
 */

// Global state
let allPlayers = [];
let filteredPlayers = [];
let currentSort = { column: 'total', direction: 'desc' };
let hallOfFameData = null;

// Category mapping for display
const CATEGORY_MAP = {
    'championship_doubletten': 'champ-doubletten',
    'championship_mix': 'champ-mix',
    'championship_tete-a-tete-heren': 'champ-tete-heren',
    'championship_tete-a-tete-dames': 'champ-tete-dames',
    'championship_tripletten': 'champ-tripletten',
    'competition_doubletten': 'comp-doubletten',
    'competition_tripletten': 'comp-tripletten',
    'competition_zomercyclus': 'comp-zomer'
};

/**
 * Initialize the application
 */
async function init() {
    // Load theme preference
    loadTheme();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load and display data
    await loadData();
    
    // Initial render
    renderTable();
    updateStats();
}

/**
 * Load hall of fame data from JSON
 */
async function loadData() {
    try {
        // Set a reasonable timeout for the fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch('data/halloffame.json', {
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        hallOfFameData = await response.json();
        allPlayers = hallOfFameData.players;
        filteredPlayers = [...allPlayers];
        
        console.log(`✓ Loaded ${allPlayers.length} players`);
    } catch (error) {
        console.error('Error loading data:', error);
        
        let errorMessage = 'Fout bij laden van data. ';
        if (error.name === 'AbortError') {
            errorMessage += 'De verbinding duurde te lang. Controleer je internetverbinding.';
        } else if (error.message.includes('HTTP')) {
            errorMessage += `Server fout: ${error.message}`;
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage += 'Kan geen verbinding maken. Controleer je internetverbinding.';
        } else {
            errorMessage += 'Probeer de pagina te verversen.';
        }
        
        showError(errorMessage);
    }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    
    // Min wins filter
    const minWins = document.getElementById('minWins');
    if (minWins) {
        minWins.addEventListener('change', handleMinWinsChange);
    }
    
    // Sort buttons
    const sortButtons = document.querySelectorAll('.sortable');
    sortButtons.forEach(button => {
        button.addEventListener('click', handleSort);
    });
}

/**
 * Handle search input
 */
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    const minWins = parseInt(document.getElementById('minWins').value) || 1;
    
    filteredPlayers = allPlayers.filter(player => {
        const nameMatch = player.displayName.toLowerCase().includes(searchTerm);
        const winsMatch = player.totalWins >= minWins;
        return nameMatch && winsMatch;
    });
    
    renderTable();
    updateStats();
}

/**
 * Handle minimum wins filter change
 */
function handleMinWinsChange(event) {
    const minWins = parseInt(event.target.value) || 1;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    
    filteredPlayers = allPlayers.filter(player => {
        const nameMatch = !searchTerm || player.displayName.toLowerCase().includes(searchTerm);
        const winsMatch = player.totalWins >= minWins;
        return nameMatch && winsMatch;
    });
    
    renderTable();
    updateStats();
}

/**
 * Handle column sorting
 */
function handleSort(event) {
    const th = event.currentTarget;
    const sortColumn = th.dataset.sort;
    
    if (!sortColumn) return;
    
    // Toggle direction if same column, otherwise default to descending
    if (currentSort.column === sortColumn) {
        currentSort.direction = currentSort.direction === 'desc' ? 'asc' : 'desc';
    } else {
        currentSort.column = sortColumn;
        currentSort.direction = 'desc';
    }
    
    // Sort the data
    sortPlayers();
    
    // Update UI
    updateSortIndicators();
    renderTable();
}

/**
 * Sort players based on current sort settings
 */
function sortPlayers() {
    filteredPlayers.sort((a, b) => {
        let valueA, valueB;
        
        if (currentSort.column === 'name') {
            valueA = a.displayName.toLowerCase();
            valueB = b.displayName.toLowerCase();
        } else if (currentSort.column === 'total') {
            valueA = a.totalWins;
            valueB = b.totalWins;
        } else if (currentSort.column === 'rank') {
            // Rank is based on position after sorting by total
            return 0; // Will be handled by index
        } else {
            // Category-specific sorting
            const categoryKey = Object.keys(CATEGORY_MAP).find(
                key => CATEGORY_MAP[key] === currentSort.column
            );
            valueA = a.wins[categoryKey] || 0;
            valueB = b.wins[categoryKey] || 0;
        }
        
        // Compare values
        let comparison = 0;
        if (typeof valueA === 'string') {
            comparison = valueA.localeCompare(valueB, 'nl');
        } else {
            comparison = valueA - valueB;
        }
        
        // Apply sort direction
        return currentSort.direction === 'asc' ? comparison : -comparison;
    });
}

/**
 * Update sort indicators in table header
 */
function updateSortIndicators() {
    // Reset all indicators
    document.querySelectorAll('.sort-icon').forEach(icon => {
        icon.classList.remove('active');
        icon.textContent = '';
    });
    
    // Set active indicator
    const activeTh = document.querySelector(`[data-sort="${currentSort.column}"]`);
    if (activeTh) {
        const icon = activeTh.querySelector('.sort-icon');
        if (icon) {
            icon.classList.add('active');
            icon.textContent = currentSort.direction === 'desc' ? '▼' : '▲';
        }
        
        activeTh.setAttribute('aria-sort', currentSort.direction === 'desc' ? 'descending' : 'ascending');
    }
}

/**
 * Render the hall of fame table
 */
function renderTable() {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;
    
    // Clear existing rows
    tbody.innerHTML = '';
    
    if (filteredPlayers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" class="text-center">
                    Geen resultaten gevonden. Pas de filters aan.
                </td>
            </tr>
        `;
        updateResultsCount(0);
        return;
    }
    
    // Render each player
    filteredPlayers.forEach((player, index) => {
        const row = createPlayerRow(player, index + 1);
        tbody.appendChild(row);
    });
    
    updateResultsCount(filteredPlayers.length);
}

/**
 * Create a table row for a player
 */
function createPlayerRow(player, rank) {
    const row = document.createElement('tr');
    
    // Highlight top 3
    if (rank <= 3 && currentSort.column === 'total' && currentSort.direction === 'desc') {
        row.classList.add('highlight');
    }
    
    // Rank
    const rankCell = document.createElement('td');
    rankCell.textContent = rank;
    row.appendChild(rankCell);
    
    // Name
    const nameCell = document.createElement('td');
    nameCell.textContent = player.displayName;
    row.appendChild(nameCell);
    
    // Total wins
    const totalCell = document.createElement('td');
    totalCell.textContent = player.totalWins;
    row.appendChild(totalCell);
    
    // Individual categories
    Object.keys(CATEGORY_MAP).forEach(categoryKey => {
        const cell = document.createElement('td');
        const wins = player.wins[categoryKey] || 0;
        
        if (wins > 0) {
            cell.textContent = wins;
        } else {
            cell.textContent = '-';
            cell.classList.add('empty');
        }
        
        row.appendChild(cell);
    });
    
    return row;
}

/**
 * Update statistics summary
 */
function updateStats() {
    // Total players
    const totalPlayersEl = document.getElementById('totalPlayers');
    if (totalPlayersEl) {
        totalPlayersEl.textContent = filteredPlayers.length;
    }
    
    // Total wins
    const totalWinsEl = document.getElementById('totalWins');
    if (totalWinsEl && hallOfFameData) {
        const totalWins = hallOfFameData.allResults.length;
        totalWinsEl.textContent = totalWins;
    }
    
    // Top player
    const topPlayerEl = document.getElementById('topPlayer');
    if (topPlayerEl && allPlayers.length > 0) {
        const topPlayer = allPlayers[0];
        topPlayerEl.textContent = `${topPlayer.displayName} (${topPlayer.totalWins})`;
    }
    
    // Last updated
    const lastUpdatedEl = document.getElementById('lastUpdated');
    if (lastUpdatedEl && hallOfFameData) {
        const date = new Date(hallOfFameData.lastUpdated);
        lastUpdatedEl.textContent = `Laatst bijgewerkt: ${formatDate(date)}`;
    }
}

/**
 * Update results count display
 */
function updateResultsCount(count) {
    const resultsCountEl = document.getElementById('resultsCount');
    if (resultsCountEl) {
        const total = allPlayers.length;
        if (count === total) {
            resultsCountEl.textContent = `${count} speler${count !== 1 ? 's' : ''}`;
        } else {
            resultsCountEl.textContent = `${count} van ${total} speler${count !== 1 ? 's' : ''}`;
        }
    }
}

/**
 * Format date for display
 */
function formatDate(date) {
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('nl-NL', options);
}

/**
 * Show error message
 */
function showError(message) {
    const tbody = document.getElementById('tableBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" class="text-center" style="color: var(--color-warning); padding: var(--spacing-xl);">
                    ⚠️ ${message}
                </td>
            </tr>
        `;
    }
}

/**
 * Theme Management
 */
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

/**
 * Utility: Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
