// =============================================================================
// CENTRALIZED PORT CONFIGURATION
// =============================================================================
// Change these values to modify ports across the entire application
// After changing, restart the Docker containers and clear browser cache

const PORT_CONFIG = {
    // Frontend port (what users access in browser)
    FRONTEND_PORT: 8081,

    // Backend port (internal server port)
    BACKEND_PORT: 5000,

    // Database port
    DATABASE_PORT: 5432,

    // Redis port
    REDIS_PORT: 6379,

    // MinIO port
    MINIO_PORT: 9000,

    // MinIO console port
    MINIO_CONSOLE_PORT: 9001
};

// Helper functions
const getFrontendUrl = () => `http://localhost:${PORT_CONFIG.FRONTEND_PORT}`;
const getBackendUrl = () => `http://localhost:${PORT_CONFIG.FRONTEND_PORT}/api`;
const getDatabaseUrl = () => `postgresql://builderai:builderai123@localhost:${PORT_CONFIG.DATABASE_PORT}/builderai_dev`;
const getRedisUrl = () => `redis://localhost:${PORT_CONFIG.REDIS_PORT}`;
const getMinioUrl = () => `http://localhost:${PORT_CONFIG.MINIO_PORT}`;

module.exports = {
    PORT_CONFIG,
    getFrontendUrl,
    getBackendUrl,
    getDatabaseUrl,
    getRedisUrl,
    getMinioUrl
};
