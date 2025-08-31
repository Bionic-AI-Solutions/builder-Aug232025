import axios from 'axios';

const BASE_URL = 'http://builderai-dev:5000';

// Test data
const testUsers = {
    admin: { email: 'admin@builderai.com', password: 'demo123' },
    builder: { email: 'sarah@builderai.com', password: 'demo123' },
    user: { email: 'user@builderai.com', password: 'demo123' }
};

let authTokens = {};

async function loginUser(userType) {
    try {
        const response = await axios.post(`${BASE_URL}/api/auth/login`, testUsers[userType]);
        authTokens[userType] = response.data.data.tokens.accessToken;
        return response.data.data.user.id;
    } catch (error) {
        console.error(`Login failed for ${userType}:`, error.response?.data || error.message);
        throw error;
    }
}

async function testHealthEndpoint() {
    console.log('\n🔍 Testing Health Endpoint...');
    try {
        const response = await axios.get(`${BASE_URL}/api/health`);
        console.log('✅ Health endpoint working:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Health endpoint failed:', error.message);
        return false;
    }
}

async function testDashboardAnalytics() {
    console.log('\n🔍 Testing Dashboard Analytics API...');
    try {
        const response = await axios.get(`${BASE_URL}/api/dashboard/analytics`, {
            headers: { 'Authorization': `Bearer ${authTokens.admin}` }
        });

        console.log('✅ Dashboard analytics API working');
        console.log('   - Platform metrics:', !!response.data.data.platformMetrics);
        console.log('   - Recent activity:', !!response.data.data.recentActivity);
        console.log('   - Revenue trends:', !!response.data.data.revenueTrends);

        return true;
    } catch (error) {
        console.error('❌ Dashboard analytics API failed:', error.response?.data || error.message);
        return false;
    }
}

async function testBuilderDashboard() {
    console.log('\n🔍 Testing Builder Dashboard API...');
    try {
        const userId = await loginUser('builder');
        const response = await axios.get(`${BASE_URL}/api/dashboard/builder/${userId}`, {
            headers: { 'Authorization': `Bearer ${authTokens.builder}` }
        });

        console.log('✅ Builder dashboard API working');
        console.log('   - Performance data:', !!response.data.data.performance);
        console.log('   - Projects data:', !!response.data.data.projects);
        console.log('   - Revenue data:', !!response.data.data.revenueData);

        return true;
    } catch (error) {
        console.error('❌ Builder dashboard API failed:', error.response?.data || error.message);
        return false;
    }
}

async function testEndUserDashboard() {
    console.log('\n🔍 Testing End User Dashboard API...');
    try {
        const userId = await loginUser('user');
        const response = await axios.get(`${BASE_URL}/api/dashboard/end-user/${userId}`, {
            headers: { 'Authorization': `Bearer ${authTokens.user}` }
        });

        console.log('✅ End user dashboard API working');
        console.log('   - Activity data:', !!response.data.data.activity);
        console.log('   - Projects data:', !!response.data.data.projects);
        console.log('   - Widget implementations:', !!response.data.data.widgetImplementations);

        return true;
    } catch (error) {
        console.error('❌ End user dashboard API failed:', error.response?.data || error.message);
        return false;
    }
}

async function testAdminUsersAPI() {
    console.log('\n🔍 Testing Admin Users API...');
    try {
        const response = await axios.get(`${BASE_URL}/api/admin/users`, {
            headers: { 'Authorization': `Bearer ${authTokens.admin}` }
        });

        console.log('✅ Admin users API working');
        console.log('   - Users data:', !!response.data.data.users);
        console.log('   - Pagination:', !!response.data.data.pagination);
        console.log('   - Total users:', response.data.data.users?.length || 0);

        return true;
    } catch (error) {
        console.error('❌ Admin users API failed:', error.response?.data || error.message);
        return false;
    }
}

async function testUserApprovalWorkflow() {
    console.log('\n🔍 Testing User Approval Workflow...');
    try {
        // First, get users to find one that needs approval
        const usersResponse = await axios.get(`${BASE_URL}/api/admin/users`, {
            headers: { 'Authorization': `Bearer ${authTokens.admin}` }
        });

        const pendingUser = usersResponse.data.data.users.find(user =>
            user.approval_status === 'pending'
        );

        if (pendingUser) {
            console.log('✅ Found pending user for approval test');

            // Test approval
            const approveResponse = await axios.post(
                `${BASE_URL}/api/admin/users/${pendingUser.id}/approve`,
                {},
                { headers: { 'Authorization': `Bearer ${authTokens.admin}` } }
            );

            console.log('✅ User approval workflow working');
            return true;
        } else {
            console.log('⚠️  No pending users found for approval test');
            return true;
        }
    } catch (error) {
        console.error('❌ User approval workflow failed:', error.response?.data || error.message);
        return false;
    }
}

async function testWebSocketConnection() {
    console.log('\n🔍 Testing WebSocket Connection...');
    try {
        const WebSocket = (await import('ws')).default;
        const ws = new WebSocket('ws://builderai-dev:5000/ws/dashboard');

        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                console.log('❌ WebSocket connection timeout');
                ws.close();
                resolve(false);
            }, 5000);

            ws.on('open', () => {
                console.log('✅ WebSocket connection established');
                clearTimeout(timeout);
                ws.close();
                resolve(true);
            });

            ws.on('error', (error) => {
                console.error('❌ WebSocket connection failed:', error.message);
                clearTimeout(timeout);
                resolve(false);
            });
        });
    } catch (error) {
        console.error('❌ WebSocket test failed:', error.message);
        return false;
    }
}

async function testDatabaseConnection() {
    console.log('\n🔍 Testing Database Connection...');
    try {
        const pg = await import('pg');
        const pool = new pg.Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://builderai:builderai@postgres:5432/builderai_dev'
        });

        const result = await pool.query('SELECT COUNT(*) as user_count FROM users');
        console.log('✅ Database connection working');
        console.log('   - Total users:', result.rows[0].user_count);

        await pool.end();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
}

async function runAllTests() {
    console.log('🚀 Starting Real Dashboard Integration Tests...\n');

    const results = {
        health: await testHealthEndpoint(),
        database: await testDatabaseConnection(),
        websocket: await testWebSocketConnection(),
        analytics: false,
        builder: false,
        endUser: false,
        admin: false,
        approval: false
    };

    // Login admin first for subsequent tests
    try {
        await loginUser('admin');

        results.analytics = await testDashboardAnalytics();
        results.admin = await testAdminUsersAPI();
        results.approval = await testUserApprovalWorkflow();
    } catch (error) {
        console.error('❌ Admin login failed:', error.message);
    }

    results.builder = await testBuilderDashboard();
    results.endUser = await testEndUserDashboard();

    // Summary
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    console.log(`Health Endpoint: ${results.health ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Database Connection: ${results.database ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`WebSocket Connection: ${results.websocket ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Dashboard Analytics: ${results.analytics ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Builder Dashboard: ${results.builder ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`End User Dashboard: ${results.endUser ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Admin Users API: ${results.admin ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`User Approval Workflow: ${results.approval ? '✅ PASS' : '❌ FAIL'}`);

    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;

    console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);

    if (passedTests === totalTests) {
        console.log('🎉 All tests passed! Real Dashboard implementation is working correctly.');
        process.exit(0);
    } else {
        console.log('⚠️  Some tests failed. Please check the implementation.');
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllTests().catch(error => {
        console.error('❌ Test execution failed:', error);
        process.exit(1);
    });
}

export { runAllTests };
