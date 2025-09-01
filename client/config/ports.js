// =============================================================================
// CLIENT-SIDE PORT CONFIGURATION
// =============================================================================
// This file is used by the frontend to determine ports and URLs
// Change these values to modify frontend port configuration

const CLIENT_PORT_CONFIG = {
    // Frontend port (what users access in browser)
    FRONTEND_PORT: 8081,

    // Backend API base URL
    API_BASE_URL: `http://localhost:8081/api`,

    // WebSocket base URL
    WS_BASE_URL: `ws://localhost:8081`
};

// Helper functions for client-side usage
const getApiUrl = (endpoint = '') => `${CLIENT_PORT_CONFIG.API_BASE_URL}${endpoint}`;
const getWsUrl = (path = '') => `${CLIENT_PORT_CONFIG.WS_BASE_URL}${path}`;
const getFrontendUrl = () => `http://localhost:${CLIENT_PORT_CONFIG.FRONTEND_PORT}`;

// Export for use in components
export {
    CLIENT_PORT_CONFIG,
    getApiUrl,
    getWsUrl,
    getFrontendUrl
};

// Also export as default for backward compatibility
export default CLIENT_PORT_CONFIG;
