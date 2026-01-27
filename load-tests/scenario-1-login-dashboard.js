import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Configuration
export const options = {
    stages: [
        { duration: '1m', target: 50 },   // Ramp up to 50 users
        { duration: '3m', target: 50 },   // Stay at 50 users
        { duration: '1m', target: 100 },  // Ramp to 100 users
        { duration: '3m', target: 100 },  // Stay at 100 users
        { duration: '1m', target: 0 },    // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% < 500ms, 99% < 1s
        http_req_failed: ['rate<0.01'],                 // Error rate < 1%
        errors: ['rate<0.05'],                          // Custom error rate < 5%
    },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3001';

// Test data
const credentials = {
    email: 'landlord@test.com',
    password: 'Test123456',
};

export default function () {
    // Scenario 1: Login + Fetch Dashboard
    loginAndDashboard();
    sleep(1);
}

function loginAndDashboard() {
    // 1. Login
    const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify(credentials), {
        headers: { 'Content-Type': 'application/json' },
    });

    const loginSuccess = check(loginRes, {
        'login status is 200': (r) => r.status === 200,
        'login has access token': (r) => JSON.parse(r.body).access_token !== undefined,
    });

    errorRate.add(!loginSuccess);

    if (!loginSuccess) {
        console.error('Login failed:', loginRes.status, loginRes.body);
        return;
    }

    const accessToken = JSON.parse(loginRes.body).access_token;

    // 2. Fetch Dashboard Summary
    const dashboardRes = http.get(`${BASE_URL}/reports/landlord/summary`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });

    const dashboardSuccess = check(dashboardRes, {
        'dashboard status is 200': (r) => r.status === 200,
        'dashboard has data': (r) => JSON.parse(r.body).summary !== undefined,
        'dashboard response time < 200ms': (r) => r.timings.duration < 200,
    });

    errorRate.add(!dashboardSuccess);

    // 3. Fetch Cash Flow
    const cashFlowRes = http.get(`${BASE_URL}/dashboard/cash-flow`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });

    const cashFlowSuccess = check(cashFlowRes, {
        'cash flow status is 200': (r) => r.status === 200,
        'cash flow response time < 300ms': (r) => r.timings.duration < 300,
    });

    errorRate.add(!cashFlowSuccess);
}
