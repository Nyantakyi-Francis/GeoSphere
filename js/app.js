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
    setFavoriteButtonLabel,
    renderMapFallback,
    clearMapFallback
} from './modules/ui.js';

const elements = {
    addFavoriteBtn: document.getElementById('addFavoriteBtn'),
    activeModePill: document.getElementById('activeModePill'),
    contentSummary: document.getElementById('contentSummary'),
    currentPlaceMeta: document.getElementById('currentPlaceMeta'),
    currentPlaceName: document.getElementById('currentPlaceName'),
    currentPlaceStatus: document.getElementById('currentPlaceStatus'),
    factBtn: document.getElementById('factBtn'),
    factContainer: document.getElementById('fact'),
    factsSectionNote: document.getElementById('factsSectionNote'),
    geographyTriviaBtn: document.getElementById('geographyTriviaBtn'),
    locationLabel: document.getElementById('locationLabel'),
    mapContainer: document.getElementById('map'),
    mapSummary: document.getElementById('mapSummary'),
    newsContainer: document.getElementById('news'),
    newsSectionNote: document.getElementById('newsSectionNote'),
    saveStatePill: document.getElementById('saveStatePill'),
    searchForm: document.getElementById('searchForm'),
    searchInput: document.getElementById('searchInput'),
    searchSubmitBtn: document.getElementById('searchSubmitBtn'),
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
    let currentTab = userPreferences.lastActiveTab || 'news';
    let favorites = getFavorites();
    let mapFailureShown = false;

    renderFavorites(favorites);
    renderSearchHistory(getSearchHistory());
    renderNewsLoading();
    renderTriviaLoading('Preparing trivia for your starting location...');
    setActiveTab(currentTab);
    updateSearchAvailability();
    updateLocationUI(null);
    updateActiveModeState();
    updateContextActions();
    setFavoriteButtonLabel(false, false);
    updateFavoriteButton();
    configureMapFallback();

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
        map.on('load', () => {
            clearMapFallback();
            mapFailureShown = false;
        });

        map.on('error', () => {
            if (mapFailureShown) {
                return;
            }

            mapFailureShown = true;
            renderMapFallback({
                title: 'Map failed to load',
                message: 'The map could not be displayed right now. You can still use search, saved places, news, and trivia.',
                actionLabel: 'Retry map',
                onAction: () => window.location.reload()
            });
        });

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

        updateLocationUI(location);
        updateContextActions();
        updateFavoriteButton();

        if (map) {
            clearMapFallback();
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
            showError(
                elements.newsContainer,
                'Headlines are unavailable right now. Try another place or check back later.',
                'News unavailable'
            );
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
            showError(
                elements.factContainer,
                'Trivia is unavailable right now. Try again in a moment.',
                'Trivia unavailable'
            );
            throw error;
        }
    }

    function switchTab(tabName) {
        currentTab = tabName;
        setActiveTab(tabName);
        savePreferences({ lastActiveTab: tabName });
        updateActiveModeState();
        updateCurrentPlaceStatus();
    }

    function updateFavoriteButton() {
        const hasLocation = Boolean(currentLocation);
        const isSaved = hasLocation
            ? isFavorite(currentLocation.lat, currentLocation.lng)
            : false;

        setFavoriteButtonLabel(isSaved, hasLocation);
        updateSaveStatePill(hasLocation, isSaved);
        updateCurrentPlaceStatus();
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

    function configureMapFallback() {
        if (map) {
            clearMapFallback();
            return;
        }

        if (!hasMapboxToken()) {
            renderMapFallback({
                title: 'Map unavailable',
                message: 'Map search needs a Mapbox token in this environment. Headlines, trivia, saved places, and search history still work.'
            });
            return;
        }

        renderMapFallback({
            title: 'Map failed to load',
            message: 'The map could not be displayed right now. You can still use the rest of the app.',
            actionLabel: 'Retry map',
            onAction: () => window.location.reload()
        });
    }

    function updateSearchAvailability() {
        const searchEnabled = hasMapboxToken();
        elements.searchInput.disabled = !searchEnabled;
        elements.searchSubmitBtn.disabled = !searchEnabled;
        elements.searchInput.placeholder = searchEnabled
            ? 'Search for a city, country, or landmark'
            : 'Search unavailable until Mapbox is configured';
    }

    function updateLocationUI(location) {
        if (!location) {
            elements.currentPlaceName.textContent = 'Waiting for a location';
            elements.currentPlaceMeta.textContent = 'Search for a city, country, or landmark to begin.';
            elements.currentPlaceStatus.textContent = 'The selected place will appear here, along with its saved state and active mode.';
            elements.locationLabel.textContent = 'Waiting for a location';
            elements.mapSummary.textContent = 'Search for a place to center the map and refresh the live content below.';
            elements.contentSummary.textContent = 'Showing results for the place you select.';
            elements.newsSectionNote.textContent = 'Recent headlines related to your selected place.';
            elements.factsSectionNote.textContent = 'Switch between general and geography questions for the current place.';
            return;
        }

        elements.currentPlaceName.textContent = location.city;
        elements.currentPlaceMeta.textContent = buildLocationMeta(location);
        elements.locationLabel.textContent = `Viewing ${location.city}`;
        elements.mapSummary.textContent = `Map centered on ${location.city}. Drag or zoom to inspect the surrounding area.`;
        elements.contentSummary.textContent = `Showing results for ${location.city}.`;
        elements.newsSectionNote.textContent = `Recent headlines related to ${location.city}.`;
        elements.factsSectionNote.textContent = `Switch between general and geography questions for ${location.city}.`;
        updateCurrentPlaceStatus();
    }

    function updateActiveModeState() {
        elements.activeModePill.textContent = currentTab === 'news' ? 'News mode' : 'Trivia mode';
    }

    function updateSaveStatePill(hasLocation, isSaved) {
        if (!hasLocation) {
            elements.saveStatePill.textContent = 'No place selected';
            elements.saveStatePill.classList.add('pill-muted');
            return;
        }

        elements.saveStatePill.textContent = isSaved ? 'Saved' : 'Not saved';
        elements.saveStatePill.classList.toggle('pill-muted', !isSaved);
    }

    function updateContextActions() {
        const hasLocation = Boolean(currentLocation);
        elements.factBtn.disabled = !hasLocation;
        elements.geographyTriviaBtn.disabled = !hasLocation;
    }

    function updateCurrentPlaceStatus() {
        if (!currentLocation) {
            elements.currentPlaceStatus.textContent = 'The selected place will appear here, along with its saved state and active mode.';
            return;
        }

        const isSaved = isFavorite(currentLocation.lat, currentLocation.lng);
        if (isSaved) {
            elements.currentPlaceStatus.textContent = `Saved to Favorites. ${currentTab === 'news' ? 'Headlines' : 'Trivia'} for ${currentLocation.city} are ready below.`;
            return;
        }

        elements.currentPlaceStatus.textContent = `Currently viewing ${currentLocation.city}. Save it to Favorites or switch between news and trivia below.`;
    }

    function buildLocationMeta(location) {
        const parts = [];

        if (location.region) {
            parts.push(location.region);
        }

        const coordinates = formatCoordinates(location.lat, location.lng);
        if (coordinates) {
            parts.push(coordinates);
        }

        return parts.length > 0 ? parts.join(' | ') : 'Selected location';
    }
}

function formatCoordinates(lat, lng) {
    if (typeof lat !== 'number' || typeof lng !== 'number') {
        return '';
    }

    const latitude = `${Math.abs(lat).toFixed(2)} deg ${lat >= 0 ? 'N' : 'S'}`;
    const longitude = `${Math.abs(lng).toFixed(2)} deg ${lng >= 0 ? 'E' : 'W'}`;
    return `${latitude} | ${longitude}`;
}
