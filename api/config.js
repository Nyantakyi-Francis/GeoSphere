module.exports = function handler(_request, response) {
    response.setHeader('Cache-Control', 'no-store');
    response.status(200).json({
        mapboxToken: process.env.MAPBOX_PUBLIC_TOKEN || ''
    });
};
