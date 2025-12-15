import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3000';

async function testStaleToken() {
    // 1. Register
    const email = `stale_${Date.now()}@example.com`;
    try {
        const regRes = await axios.post(`${API_URL}/auth/register`, {
            email,
            password: 'password123'
        });
        const token = regRes.data.token;
        const userId = regRes.data.user.id;
        console.log('Registered user:', userId);

        // 2. Delete User from DB
        await prisma.user.delete({ where: { id: userId } });
        console.log('Deleted user from DB');

        // 3. Create Company with stale token
        try {
            await axios.post(`${API_URL}/company/create`, {
                name: 'Stale Inc'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('SUCCESS? Should have failed.');
        } catch (err: any) {
            console.log('Expected failure:', err.response?.status, err.response?.data);
        }

    } catch (error) {
        console.error('Setup failed:', error);
    }
}

testStaleToken();
