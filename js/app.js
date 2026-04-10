import {
    initializeMap,
    updateMap,
    getCurrentPosition,
    geocodeSearch,
    reverseGeocode
} from './modules/location.js';
import { fetchNews } from './modules/newsService.js';
import { fetchTriviaQuestion, fetchGeographyTrivia } from './modules/factsService.js';
import { hasMapboxToken, loadRuntimeConfig } from './modules/runtimeConfig.js';
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
import {
    renderNewsCards,
    renderNewsLoading,
    renderTrivia,
    renderTriviaLoading,
    renderFavorites,
    renderSearchHistory,
    setActiveTab,
    showAppMessage,
    clearAppMessage,
    showError,
    setFavoriteButtonLabel
} from './modules/ui.js';

const elements = {
    addFavoriteBtn: document.getElementById('addFavoriteBtn'),
    factBtn: document.getElementById('factBtn'),
    factContainer: document.getElementById('fact'),
    geographyTriviaBtn: document.getElementById('geographyTriviaBtn'),
    locationLabel: document.getElementById('locationLabel'),
    mapContainer: document.getElementById('map'),
    newsContainer: document.getElementById('news'),
    searchForm: document.getElementById('searchForm'),
    searchInput: document.getElementById('searchInput'),
    tabFacts: document.getElementById('tabFacts'),
    tabNews: document.getElementById('tabNews')
};

const isAppPage = Object.values(elements).every(Boolean);

if (isAppPage) {
    bootstrapApp();
}

async function bootstrapApp() {
    await loadRuntimeConfig();
    startApp();
}

function startApp() {
    const userPreferences = getPreferences();
    const map = initializeMap(getMapState());

    let currentLocation = null;
    let favorites = getFavorites();

    renderFavorites(favorites);
    renderSearchHistory(getSearchHistory());
    renderNewsLoading();
    renderTriviaLoading('Loading the first question...');
    setActiveTab(userPreferences.lastActiveTab || 'news');
    setFavoriteButtonLabel(false);

    elements.searchForm.addEventListener('submit', handleSearchSubmit);
    elements.addFavoriteBtn.addEventListener('click', handleFavoriteToggle);
    elements.tabNews.addEventListener('click', () => switchTab('news'));
    elements.tabFacts.addEventListener('click', () => switchTab('trivia'));
    elements.factBtn.addEventListener('click', async () => {
        if (!currentLocation) {
            showAppMessage('Choose a location first so GeoSphere knows what to explore.', 'info');
            return;
        }

        renderTriviaLoading(`Loading a new question for ${currentLocation.city}...`);
        try {
            await loadTrivia(currentLocation.city);
        } catch {
            // The UI already renders an error state inside loadTrivia.
        }
    });

    elements.geographyTriviaBtn.addEventListener('click', async () => {
        if (!currentLocation) {
            showAppMessage('Choose a location first so the geography mode has context.', 'info');
            return;
        }

        renderTriviaLoading(`Loading a geography question for ${currentLocation.city}...`);
        try {
            await loadTrivia(currentLocation.city, 'geography');
        } catch {
            // The UI already renders an error state inside loadTrivia.
        }
    });

    document.addEventListener('favoriteSelected', async event => {
        await loadLocationExperience(event.detail, {
            persist: true,
            message: `Loaded saved place: ${event.detail.city}.`,
            variant: 'success'
        });
    });

    document.addEventListener('favoriteRemoved', event => {
        favorites = removeFavorite(event.detail.lat, event.detail.lng);
        renderFavorites(favorites);
        updateFavoriteButton();
        showAppMessage(`${event.detail.city} was removed from favorites.`, 'info');
    });

    document.addEventListener('searchHistorySelected', async event => {
        elements.searchInput.value = event.detail;
        await searchForLocation(event.detail);
    });

    if (map) {
        map.on('moveend', () => {
            const center = map.getCenter();
            saveMapState({
                center: [center.lng, center.lat],
                zoom: map.getZoom()
            });
        });
    }

    restoreInitialLocation();

    async function handleSearchSubmit(event) {
        event.preventDefault();
        await searchForLocation(elements.searchInput.value);
    }

    async function searchForLocation(query) {
        const cleanQuery = query.trim();
        if (!cleanQuery) {
            showAppMessage('Enter a city, country, or landmark to begin exploring.', 'info');
            elements.searchInput.focus();
            return;
        }

        if (!hasMapboxToken()) {
            showAppMessage('Search is unavailable until a Mapbox token is configured for this environment.', 'error');
            return;
        }

        clearAppMessage();
        showAppMessage(`Searching for ${cleanQuery}...`, 'info', { duration: 2200 });

        const location = await geocodeSearch(cleanQuery);
        if (!location) {
            showAppMessage(`GeoSphere could not find "${cleanQuery}". Try a broader location name.`, 'error');
            return;
        }

        addToSearchHistory(cleanQuery);
        renderSearchHistory(getSearchHistory());
        elements.searchInput.value = '';

        await loadLocationExperience(location, {
            persist: true,
            message: `Loaded ${location.city}.`,
            variant: 'success'
        });
    }

    function handleFavoriteToggle() {
        if (!currentLocation) {
            showAppMessage('Pick a location before saving it to favorites.', 'info');
            return;
        }

        if (isFavorite(currentLocation.lat, currentLocation.lng)) {
            favorites = removeFavorite(currentLocation.lat, currentLocation.lng);
            renderFavorites(favorites);
            updateFavoriteButton();
            showAppMessage(`${currentLocation.city} was removed from favorites.`, 'info');
            return;
        }

        favorites = addFavorite(currentLocation);
        renderFavorites(favorites);
        updateFavoriteButton();
        showAppMessage(`${currentLocation.city} was added to favorites.`, 'success');
    }

    async function loadLocationExperience(location, options = {}) {
        currentLocation = location;

        if (options.persist !== false) {
            saveLastSearch(location);
        }

        updateLocationLabel(location.city);
        updateFavoriteButton();

        if (map) {
            updateMap(map, location.lat, location.lng);
        }

        renderNewsLoading();
        renderTriviaLoading(`Gathering stories and trivia for ${location.city}...`);

        const results = await Promise.allSettled([
            loadNews(location.city),
            loadTrivia(location.city)
        ]);

        updateFavoriteButton();

        const hasFailure = results.some(result => result.status === 'rejected');
        if (hasFailure) {
            showAppMessage(`Some content could not be loaded for ${location.city}.`, 'error');
            return;
        }

        if (options.message) {
            showAppMessage(options.message, options.variant || 'success');
        }
    }

    async function loadNews(city) {
        try {
            const articles = await fetchNews(city, userPreferences.newsCategory || 'general');
            renderNewsCards(articles, city);
        } catch (error) {
            console.error('Error loading news:', error);
            showError(elements.newsContainer, 'News could not be loaded right now.');
            throw error;
        }
    }

    async function loadTrivia(city, mode = 'general') {
        try {
            const triviaData = mode === 'geography'
                ? await fetchGeographyTrivia(city)
                : await fetchTriviaQuestion(city);

            renderTrivia(triviaData);
        } catch (error) {
            console.error('Error loading trivia:', error);
            showError(elements.factContainer, 'Trivia could not be loaded right now.');
            throw error;
        }
    }

    function switchTab(tabName) {
        setActiveTab(tabName);
        savePreferences({ lastActiveTab: tabName });
    }

    function updateLocationLabel(cityName) {
        elements.locationLabel.textContent = `Exploring ${cityName}`;
    }

    function updateFavoriteButton() {
        const isSaved = currentLocation
            ? isFavorite(currentLocation.lat, currentLocation.lng)
            : false;

        setFavoriteButtonLabel(isSaved);
    }

    async function restoreInitialLocation() {
        const lastSearch = getLastSearch();
        if (lastSearch) {
            await loadLocationExperience(lastSearch, {
                persist: false,
                message: `Restored your last session in ${lastSearch.city}.`,
                variant: 'info'
            });
            return;
        }

        if (!hasMapboxToken()) {
            const fallbackLocation = {
                city: 'New York, United States',
                region: 'New York',
                lat: 40.7128,
                lng: -74.0060
            };

            await loadLocationExperience(fallbackLocation, {
                persist: true,
                message: 'Map search is not configured yet, so GeoSphere opened in New York.',
                variant: 'info'
            });
            return;
        }

        try {
            showAppMessage('Trying to start near your current location...', 'info', {
                duration: 2600
            });

            const position = await getCurrentPosition();
            const { latitude, longitude } = position.coords;
            const placeName = await reverseGeocode(latitude, longitude);

            await loadLocationExperience({
                city: placeName,
                region: '',
                lat: latitude,
                lng: longitude
            }, {
                persist: true,
                message: `Starting near ${placeName}.`,
                variant: 'success'
            });
        } catch (error) {
            const fallbackLocation = {
                city: 'New York, United States',
                region: 'New York',
                lat: 40.7128,
                lng: -74.0060
            };

            await loadLocationExperience(fallbackLocation, {
                persist: true,
                message: 'Location access was unavailable, so GeoSphere opened in New York.',
                variant: 'info'
            });
        }
    }
}
