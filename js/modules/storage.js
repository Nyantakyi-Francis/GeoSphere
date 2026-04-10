const STORAGE_KEY = 'gs-favorites';
const LAST_SEARCH_KEY = 'gs-last-search';
const PREFERENCES_KEY = 'gs-preferences';
const SEARCH_HISTORY_KEY = 'gs-search-history';
const MAP_STATE_KEY = 'gs-map-state';

const DEFAULT_PREFERENCES = Object.freeze({
    newsCategory: 'general',
    theme: 'daybreak',
    autoRefresh: false,
    mapStyle: 'streets-v12',
    lastActiveTab: 'news'
});

function readJson(key, fallbackValue) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallbackValue;
    } catch (error) {
        console.error(`Error reading ${key}:`, error);
        return fallbackValue;
    }
}

function writeJson(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error saving ${key}:`, error);
    }
}

export function getFavorites() {
    return readJson(STORAGE_KEY, []);
}

function saveFavorites(favorites) {
    writeJson(STORAGE_KEY, favorites);
}

export function addFavorite(location) {
    const favorites = getFavorites();
    const exists = favorites.some(favorite => favorite.lat === location.lat && favorite.lng === location.lng);

    if (exists) {
        return favorites;
    }

    const nextFavorites = [{
        city: location.city,
        region: location.region,
        lat: location.lat,
        lng: location.lng,
        addedAt: new Date().toISOString()
    }, ...favorites];

    saveFavorites(nextFavorites);
    return nextFavorites;
}

export function removeFavorite(lat, lng) {
    const nextFavorites = getFavorites().filter(favorite => favorite.lat !== lat || favorite.lng !== lng);
    saveFavorites(nextFavorites);
    return nextFavorites;
}

export function isFavorite(lat, lng) {
    return getFavorites().some(favorite => favorite.lat === lat && favorite.lng === lng);
}

export function saveLastSearch(location) {
    writeJson(LAST_SEARCH_KEY, {
        city: location.city,
        region: location.region,
        lat: location.lat,
        lng: location.lng,
        searchedAt: new Date().toISOString()
    });
}

export function getLastSearch() {
    return readJson(LAST_SEARCH_KEY, null);
}

export function savePreferences(preferences) {
    const currentPreferences = getPreferences();
    writeJson(PREFERENCES_KEY, {
        ...currentPreferences,
        ...preferences
    });
}

export function getPreferences() {
    return {
        ...DEFAULT_PREFERENCES,
        ...readJson(PREFERENCES_KEY, {})
    };
}

export function saveNewsCategory(category) {
    savePreferences({ newsCategory: category });
}

export function saveTheme(theme) {
    savePreferences({ theme });
}

export function addToSearchHistory(searchTerm) {
    const cleanTerm = searchTerm.trim();
    if (!cleanTerm) {
        return;
    }

    const normalizedTerm = cleanTerm.toLowerCase();
    const updatedHistory = [
        cleanTerm,
        ...getSearchHistory().filter(entry => entry.toLowerCase() !== normalizedTerm)
    ].slice(0, 8);

    writeJson(SEARCH_HISTORY_KEY, updatedHistory);
}

export function getSearchHistory() {
    return readJson(SEARCH_HISTORY_KEY, []);
}

export function clearSearchHistory() {
    try {
        localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (error) {
        console.error('Error clearing search history:', error);
    }
}

export function saveMapState(state) {
    writeJson(MAP_STATE_KEY, {
        center: state.center,
        zoom: state.zoom,
        savedAt: new Date().toISOString()
    });
}

export function getMapState() {
    return readJson(MAP_STATE_KEY, null);
}

export function clearAllData() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(LAST_SEARCH_KEY);
        localStorage.removeItem(PREFERENCES_KEY);
        localStorage.removeItem(SEARCH_HISTORY_KEY);
        localStorage.removeItem(MAP_STATE_KEY);
    } catch (error) {
        console.error('Error clearing app data:', error);
    }
}

export function getStorageInfo() {
    return {
        favorites: getFavorites().length,
        lastSearch: getLastSearch(),
        preferences: getPreferences(),
        searchHistory: getSearchHistory().length,
        mapState: getMapState()
    };
}
