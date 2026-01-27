import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
    stages: [
        { duration: '1m', target: 20 },   // Ramp up to 20 users
        { duration: '3m', target: 20 },   // Hold at 20 users
        { duration: '1m', target: 0 },    // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<1000', 'p(99)<2000'],
        http_req_failed: ['rate<0.02'],
        errors: ['rate<0.05'],
    },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3001';

const landlordCredentials = {
    email: 'landlord@test.com',
    password: 'Test123456',
};

export default function () {
    createContract();
    sleep(2);
}

function createContract() {
    // 1. Login as landlord
    const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify(landlordCredentials), {
        headers: { 'Content-Type': 'application/json' },
    });

    const loginSuccess = check(loginRes, {
        'login status is 200': (r) => r.status === 200,
    });

    errorRate.add(!loginSuccess);

    if (!loginSuccess) return;

    const accessToken = JSON.parse(loginRes.body).access_token;

    // 2. Fetch available rooms (prerequisite)
    const roomsRes = http.get(`${BASE_URL}/rooms?status=AVAILABLE&limit=1`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (roomsRes.status !== 200 || JSON.parse(roomsRes.body).data.length === 0) {
        console.warn('No available rooms for contract creation');
        return;
    }

    const roomId = JSON.parse(roomsRes.body).data[0].id;

    // 3. Create contract
    const contractData = {
        tenantId: __ENV.TEST_TENANT_ID || 'test-tenant-id', // Replace with actual tenant ID
        landlordId: __ENV.TEST_LANDLORD_ID || 'test-landlord-id',
        roomId: roomId,
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
        monthlyRent: 5000000,
        deposit: 10000000,
        paymentDay: 5,
        applicationId: __ENV.TEST_APPLICATION_ID || 'test-app-id',
    };

    const contractRes = http.post(`${BASE_URL}/contracts`, JSON.stringify(contractData), {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    });

    const contractSuccess = check(contractRes, {
        'contract created (200 or 201)': (r) => r.status === 200 || r.status === 201,
        'contract has ID': (r) => {
            try {
                return JSON.parse(r.body).id !== undefined;
            } catch {
                return false;
            }
        },
        'contract creation time < 1000ms': (r) => r.timings.duration < 1000,
    });

    errorRate.add(!contractSuccess);

    if (!contractSuccess) {
        console.error('Contract creation failed:', contractRes.status, contractRes.body);
    }
}
