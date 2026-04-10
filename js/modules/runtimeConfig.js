const runtimeConfig = {
    mapboxToken: ''
};

let didLoadConfig = false;

export async function loadRuntimeConfig() {
    if (didLoadConfig) {
        return runtimeConfig;
    }

    const [remoteConfig, localConfig] = await Promise.all([
        loadRemoteConfig(),
        loadLocalConfig()
    ]);

    Object.assign(runtimeConfig, remoteConfig, localConfig);
    didLoadConfig = true;

    return runtimeConfig;
}

export function getMapboxToken() {
    return runtimeConfig.mapboxToken;
}

export function hasMapboxToken() {
    return Boolean(getMapboxToken());
}

async function loadRemoteConfig() {
    try {
        const response = await fetch('/api/config', {
            headers: {
                Accept: 'application/json'
            }
        });

        if (!response.ok) {
            return {};
        }

        const data = await response.json();
        return sanitizeConfig(data);
    } catch {
        return {};
    }
}

async function loadLocalConfig() {
    try {
        const module = await import('../config.js');
        return sanitizeConfig(module.default);
    } catch {
        return {};
    }
}

function sanitizeConfig(config) {
    const source = config && typeof config === 'object' ? config : {};

    return {
        mapboxToken: typeof source.mapboxToken === 'string'
            ? source.mapboxToken.trim()
            : ''
    };
}
