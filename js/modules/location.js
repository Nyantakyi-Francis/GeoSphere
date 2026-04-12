import { getMapboxToken, hasMapboxToken } from './runtimeConfig.js';

const DEFAULT_MAP_STATE = {
    center: [0, 18],
    zoom: 1.7
};

let currentMarker = null;

export function initializeMap(savedMapState) {
    if (typeof mapboxgl === 'undefined' || !document.getElementById('map') || !hasMapboxToken()) {
        return null;
    }

    try {
        mapboxgl.accessToken = getMapboxToken();

        const initialState = {
            ...DEFAULT_MAP_STATE,
            ...savedMapState
        };

        const map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v12',
            center: initialState.center,
            zoom: initialState.zoom
        });

        map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        return map;
    } catch (error) {
        console.error('Map initialization failed:', error);
        return null;
    }
}

export function updateMap(map, lat, lng, zoom = 10) {
    if (!map) {
        return;
    }

    map.flyTo({
        center: [lng, lat],
        zoom,
        essential: true
    });

    if (currentMarker) {
        currentMarker.remove();
    }

    currentMarker = new mapboxgl.Marker({ color: '#0f766e' })
        .setLngLat([lng, lat])
        .addTo(map);
}

export function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by this browser.'));
            return;
        }

        navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
        });
    });
}

export async function geocodeSearch(query) {
    if (!hasMapboxToken()) {
        return null;
    }

    try {
        const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`);
        url.searchParams.set('access_token', getMapboxToken());
        url.searchParams.set('limit', '1');
        url.searchParams.set('language', 'en');

        const response = await fetch(
            url
        );

        if (!response.ok) {
            throw new Error(`Geocoding failed with status ${response.status}`);
        }

        const data = await response.json();
        if (!Array.isArray(data.features) || data.features.length === 0) {
            return null;
        }

        const feature = data.features[0];
        const [lng, lat] = feature.center;

        return {
            city: formatLocationName(feature.place_name || feature.text || query),
            region: feature.context?.find(item => item.id.includes('region'))?.text || '',
            lat,
            lng
        };
    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
}

export async function reverseGeocode(lat, lng) {
    if (!hasMapboxToken()) {
        return 'Unknown location';
    }

    try {
        const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`);
        url.searchParams.set('access_token', getMapboxToken());
        url.searchParams.set('limit', '1');
        url.searchParams.set('language', 'en');

        const response = await fetch(
            url
        );

        if (!response.ok) {
            throw new Error(`Reverse geocoding failed with status ${response.status}`);
        }

        const data = await response.json();
        if (!Array.isArray(data.features) || data.features.length === 0) {
            return 'Unknown location';
        }

        return formatLocationName(data.features[0].place_name);
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return 'Unknown location';
    }
}

export function formatLocationName(placeName) {
    if (!placeName) {
        return 'Unknown location';
    }

    return placeName
        .split(',')
        .map(part => part.trim())
        .filter(Boolean)
        .slice(0, 3)
        .join(', ');
}
