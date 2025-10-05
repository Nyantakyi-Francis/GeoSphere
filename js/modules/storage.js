// js/modules/storage.js

// Storage keys
const STORAGE_KEY = 'gs-favorites';
const LAST_SEARCH_KEY = 'gs-last-search';
const PREFERENCES_KEY = 'gs-preferences';
const SEARCH_HISTORY_KEY = 'gs-search-history';
const MAP_STATE_KEY = 'gs-map-state';

// ============================================
// FAVORITES MANAGEMENT
// ============================================

// Get favorites
export function getFavorites() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error("Error reading favorites:", e);
        return [];
    }
}

// Save favorites internally
function _saveFavorites(favorites) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
        console.log(`Saved ${favorites.length} favorites to localStorage`);
    } catch (e) {
        console.error("Error saving favorites:", e);
    }
}

// Add a favorite
export function addFavorite(location) {
    const favorites = getFavorites();
    const exists = favorites.some(fav => fav.lat === location.lat && fav.lng === location.lng);

    if (!exists) {
        const newFavorite = {
            city: location.city,
            region: location.region,
            lat: location.lat,
            lng: location.lng,
            addedAt: new Date().toISOString()
        };
        favorites.push(newFavorite);
        _saveFavorites(favorites);
        console.log('Added favorite:', newFavorite.city);
    }

    return favorites;
}

// Remove a favorite
export function removeFavorite(lat, lng) {
    let favorites = getFavorites();
    const originalLength = favorites.length;
    favorites = favorites.filter(fav => fav.lat !== lat || fav.lng !== lng);

    if (favorites.length < originalLength) {
        _saveFavorites(favorites);
        console.log('Removed favorite');
    }

    return favorites;
}

// Check if location is favorite
export function isFavorite(lat, lng) {
    return getFavorites().some(fav => fav.lat === lat && fav.lng === lng);
}

// ============================================
// LAST SEARCH MANAGEMENT
// ============================================

// Save last searched location
export function saveLastSearch(location) {
    try {
        const searchData = {
            city: location.city,
            region: location.region,
            lat: location.lat,
            lng: location.lng,
            searchedAt: new Date().toISOString()
        };
        localStorage.setItem(LAST_SEARCH_KEY, JSON.stringify(searchData));
        console.log('Saved last search:', location.city);
    } catch (e) {
        console.error('Error saving last search:', e);
    }
}

// Get last searched location
export function getLastSearch() {
    try {
        const data = localStorage.getItem(LAST_SEARCH_KEY);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error('Error getting last search:', e);
        return null;
    }
}

// ============================================
// USER PREFERENCES MANAGEMENT
// ============================================

// Save user preferences
export function savePreferences(prefs) {
    try {
        const currentPrefs = getPreferences();
        const updatedPrefs = { ...currentPrefs, ...prefs };
        localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updatedPrefs));
        console.log('Saved preferences:', updatedPrefs);
    } catch (e) {
        console.error('Error saving preferences:', e);
    }
}

// Get user preferences
export function getPreferences() {
    try {
        const data = localStorage.getItem(PREFERENCES_KEY);
        return data ? JSON.parse(data) : {
            newsCategory: 'general',
            theme: 'light',
            autoRefresh: false,
            mapStyle: 'streets-v12'
        };
    } catch (e) {
        console.error('Error getting preferences:', e);
        return {
            newsCategory: 'general',
            theme: 'light',
            autoRefresh: false,
            mapStyle: 'streets-v12'
        };
    }
}

// Save specific preference
export function saveNewsCategory(category) {
    savePreferences({ newsCategory: category });
}

export function saveTheme(theme) {
    savePreferences({ theme: theme });
}

// ============================================
// SEARCH HISTORY MANAGEMENT
// ============================================

// Add to search history
export function addToSearchHistory(searchTerm) {
    try {
        const history = getSearchHistory();

        // Don't add duplicates
        if (!history.includes(searchTerm)) {
            history.unshift(searchTerm);

            // Keep only last 10 searches
            const trimmedHistory = history.slice(0, 10);

            localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(trimmedHistory));
            console.log('Added to search history:', searchTerm);
        }
    } catch (e) {
        console.error('Error saving search history:', e);
    }
}

// Get search history
export function getSearchHistory() {
    try {
        const data = localStorage.getItem(SEARCH_HISTORY_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('Error getting search history:', e);
        return [];
    }
}

// Clear search history
export function clearSearchHistory() {
    try {
        localStorage.removeItem(SEARCH_HISTORY_KEY);
        console.log('Cleared search history');
    } catch (e) {
        console.error('Error clearing search history:', e);
    }
}

// ============================================
// MAP STATE MANAGEMENT
// ============================================

// Save map state (zoom level and center)
export function saveMapState(state) {
    try {
        const mapState = {
            center: state.center,
            zoom: state.zoom,
            savedAt: new Date().toISOString()
        };
        localStorage.setItem(MAP_STATE_KEY, JSON.stringify(mapState));
    } catch (e) {
        console.error('Error saving map state:', e);
    }
}

// Get map state
export function getMapState() {
    try {
        const data = localStorage.getItem(MAP_STATE_KEY);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error('Error getting map state:', e);
        return null;
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Clear all app data
export function clearAllData() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(LAST_SEARCH_KEY);
        localStorage.removeItem(PREFERENCES_KEY);
        localStorage.removeItem(SEARCH_HISTORY_KEY);
        localStorage.removeItem(MAP_STATE_KEY);
        console.log('Cleared all localStorage data');
    } catch (e) {
        console.error('Error clearing data:', e);
    }
}

// Get all storage info (for debugging)
export function getStorageInfo() {
    return {
        favorites: getFavorites().length,
        lastSearch: getLastSearch(),
        preferences: getPreferences(),
        searchHistory: getSearchHistory().length,
        mapState: getMapState()
    };
}