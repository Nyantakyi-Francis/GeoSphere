// js/app.js
import { initializeMap, updateMap, getCurrentPosition, geocodeSearch, reverseGeocode } from './modules/location.js';
import { fetchNews } from './modules/newsService.js';
import { fetchTriviaQuestion, getRandomFact } from './modules/factsService.js';
import {
    addFavorite,
    removeFavorite,
    getFavorites,
    isFavorite,
    saveLastSearch,
    getLastSearch,
    savePreferences,
    getPreferences,
    addToSearchHistory,
    getSearchHistory,
    saveMapState,
    getMapState
} from './modules/storage.js';
import { renderNewsCards, renderTrivia, renderFavorites, setActiveTab } from './modules/ui.js';

// --- Initialize Map ---
const map = initializeMap();
let currentLocation = null;

// --- Load User Preferences ---
const userPreferences = getPreferences();
console.log('Loaded user preferences:', userPreferences);

// --- Load Favorites ---
let favorites = getFavorites();
renderFavorites(favorites);
console.log(`Loaded ${favorites.length} favorites from localStorage`);

// --- Load Search History ---
const searchHistory = getSearchHistory();
console.log('Search history:', searchHistory);

// --- Search Form ---
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');

searchForm.addEventListener('submit', async e => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (!query) return;

    try {
        // Add to search history
        addToSearchHistory(query);

        const location = await geocodeSearch(query);
        if (!location) {
            alert('Location not found.');
            return;
        }

        currentLocation = location;

        // Save as last search
        saveLastSearch(location);

        // Update map and load content
        updateMap(map, location.lat, location.lng);
        await loadNews(location.city);
        await loadTrivia(location.city);

        // Update location label
        updateLocationLabel(location.city);

        // Clear search input
        searchInput.value = '';

    } catch (err) {
        console.error(err);
        alert('Failed to fetch location.');
    }
});

// --- Favorites Click ---
document.addEventListener('favoriteSelected', async e => {
    const fav = e.detail;
    currentLocation = fav;

    // Save as last search
    saveLastSearch(fav);

    updateMap(map, fav.lat, fav.lng);
    await loadNews(fav.city);
    await loadTrivia(fav.city);
    updateLocationLabel(fav.city);
});

// --- Tabs ---
document.getElementById('tabNews').addEventListener('click', () => {
    setActiveTab('news');
    // Save preference
    savePreferences({ lastActiveTab: 'news' });
});

document.getElementById('tabFacts').addEventListener('click', () => {
    setActiveTab('trivia');
    // Save preference
    savePreferences({ lastActiveTab: 'trivia' });
});

// --- Trivia/Fact Button ---
document.getElementById('factBtn').addEventListener('click', async () => {
    if (!currentLocation) {
        alert('Select a location first.');
        return;
    }
    await loadTrivia(currentLocation.city);
});

// --- Add Favorite Button (Event Delegation) ---
document.addEventListener('click', e => {
    if (e.target.id === 'addFavoriteBtn') {
        if (!currentLocation) {
            alert('No location selected to favorite.');
            return;
        }

        if (isFavorite(currentLocation.lat, currentLocation.lng)) {
            // Remove from favorites
            favorites = removeFavorite(currentLocation.lat, currentLocation.lng);
            alert(`Removed ${currentLocation.city} from favorites`);
            e.target.textContent = '⭐ Add to Favorites';
        } else {
            // Add to favorites
            favorites = addFavorite(currentLocation);
            alert(`Added ${currentLocation.city} to favorites!`);
            e.target.textContent = '★ Remove from Favorites';
        }

        renderFavorites(favorites);
    }
});


// Geography Trivia Button
document.getElementById('geographyTriviaBtn')?.addEventListener('click', async () => {
    if (!currentLocation) return alert('Select a location first.');

    // Import the function first
    const { fetchGeographyTrivia } = await import('./modules/factsService.js');
    const triviaData = await fetchGeographyTrivia();
    renderTrivia(triviaData);
});

// --- Save Map State on Move ---
map.on('moveend', () => {
    const center = map.getCenter();
    const zoom = map.getZoom();

    saveMapState({
        center: [center.lng, center.lat],
        zoom: zoom
    });
});

// --- Functions ---
async function loadNews(city) {
    try {
        const category = userPreferences.newsCategory || 'general';
        const articles = await fetchNews(city, category);
        renderNewsCards(articles);

        // Update favorite button if exists
        updateFavoriteButton();
    } catch (error) {
        console.error('Error loading news:', error);
    }
}

async function loadTrivia(city) {
    try {
        const triviaData = await fetchTriviaQuestion(city);
        renderTrivia(triviaData);
    } catch (error) {
        console.error('Error loading trivia:', error);
    }
}

function updateLocationLabel(cityName) {
    const locationLabel = document.getElementById('locationLabel');
    if (locationLabel) {
        locationLabel.textContent = `News for ${cityName}`;
    }
}

function updateFavoriteButton() {
    const btn = document.getElementById('addFavoriteBtn');
    if (!btn || !currentLocation) return;

    if (isFavorite(currentLocation.lat, currentLocation.lng)) {
        btn.textContent = '★ Remove from Favorites';
    } else {
        btn.textContent = '⭐ Add to Favorites';
    }
}

// --- Initial Load ---
(async () => {
    try {
        // First, check if there's a last search in localStorage
        const lastSearch = getLastSearch();

        if (lastSearch) {
            console.log('Restoring last search:', lastSearch.city);
            currentLocation = lastSearch;
            updateMap(map, lastSearch.lat, lastSearch.lng);
            await loadNews(lastSearch.city);
            await loadTrivia(lastSearch.city);
            updateLocationLabel(lastSearch.city);
            return;
        }

        // If no last search, try to get user's current position
        const pos = await getCurrentPosition();
        const { latitude, longitude } = pos.coords;

        // Reverse geocode to get city name
        const placeName = await reverseGeocode(latitude, longitude);

        currentLocation = {
            city: placeName,
            region: '',
            lat: latitude,
            lng: longitude
        };

        // Save this as initial search
        saveLastSearch(currentLocation);

        updateMap(map, latitude, longitude);
        await loadNews(currentLocation.city);
        await loadTrivia(currentLocation.city);
        updateLocationLabel(currentLocation.city);

    } catch (err) {
        console.warn('Geolocation failed, using default location:', err);

        // Fallback to New York
        currentLocation = {
            city: 'New York',
            region: 'NY',
            lat: 40.7128,
            lng: -74.0060
        };

        saveLastSearch(currentLocation);

        updateMap(map, currentLocation.lat, currentLocation.lng);
        await loadNews(currentLocation.city);
        await loadTrivia(currentLocation.city);
        updateLocationLabel(currentLocation.city);
    }

    // Restore last active tab
    const lastTab = userPreferences.lastActiveTab || 'news';
    setActiveTab(lastTab);
})();

// --- Debug: Log storage info on page load ---
console.log('=== GeoSphere Storage Info ===');
console.log('Favorites:', favorites.length);
console.log('Last Search:', getLastSearch());
console.log('Preferences:', userPreferences);
console.log('Search History:', searchHistory);
console.log('Map State:', getMapState());
console.log('==============================');