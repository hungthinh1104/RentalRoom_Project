import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
    stages: [
        { duration: '30s', target: 10 },  // Ramp up to 10 users
        { duration: '2m', target: 10 },   // Hold at 10 users
        { duration: '30s', target: 0 },   // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<2000', 'p(99)<5000'], // Invoice gen can be slower
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
    generateInvoice();
    sleep(3);
}

function generateInvoice() {
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

    // 2. Fetch active contracts
    const contractsRes = http.get(`${BASE_URL}/contracts?status=ACTIVE&limit=1`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (contractsRes.status !== 200 || JSON.parse(contractsRes.body).data.length === 0) {
        console.warn('No active contracts for invoice generation');
        return;
    }

    const contractId = JSON.parse(contractsRes.body).data[0].id;

    // 3. Generate monthly invoice (simulate cron job)
    const invoiceData = {
        contractId: contractId,
        invoiceType: 'MONTHLY_RENT',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const invoiceRes = http.post(`${BASE_URL}/invoices/generate`, JSON.stringify(invoiceData), {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    });

    const invoiceSuccess = check(invoiceRes, {
        'invoice generated (200 or 201)': (r) => r.status === 200 || r.status === 201,
        'invoice has number': (r) => {
            try {
                return JSON.parse(r.body).invoiceNumber !== undefined;
            } catch {
                return false;
            }
        },
        'invoice generation time < 2000ms': (r) => r.timings.duration < 2000,
    });

    errorRate.add(!invoiceSuccess);

    if (!invoiceSuccess) {
        console.error('Invoice generation failed:', invoiceRes.status, invoiceRes.body);
    }
}
