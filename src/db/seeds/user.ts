import { db } from '@/db';
import { user, session } from '@/db/schema';
import { randomUUID } from 'crypto';

async function main() {
    const userId = randomUUID();
    
    const sampleUser = {
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        emailVerified: false,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    await db.insert(user).values(sampleUser);
    
    const sessionToken = 'test-auth-token-12345';
    const sampleSession = {
        id: randomUUID(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        token: sessionToken,
        createdAt: new Date(),
        updatedAt: new Date(),
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent',
        userId: userId,
    };

    await db.insert(session).values(sampleSession);
    
    console.log('✅ User and session seeder completed successfully');
    console.log('🔑 Test session token:', sessionToken);
    console.log('👤 Test user ID:', userId);
    console.log('📧 Test user email:', sampleUser.email);
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});