import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // 1. Clean up existing data (optional, but good for idempotent runs)
    // Be careful with this in production!
    // 2. Create Admin User (Upsert to avoid duplicates)
    const hashedPassword = await bcrypt.hash('password123', 10);
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@primechatbot.com' },
        update: {},
        create: {
            email: 'admin@primechatbot.com',
            password: hashedPassword,
            companies: {
                create: {
                    name: 'Acme Corp',
                    vectorNamespace: 'acme-corp-ns',
                    documents: {
                        create: [
                            {
                                type: 'TEXT',
                                content: 'Acme Corp is a leading provider of chatbot solutions.',
                                metadata: { source: 'about.txt' }
                            },
                        ]
                    }
                }
            }
        },
        include: {
            companies: {
                include: {
                    documents: true
                }
            }
        }
    });

    console.log(`✅ Seeded/Verified User: ${adminUser.email}`);
    // Only log company if we have it loaded (upsert might not return it if not updated)
    if (adminUser.companies && adminUser.companies[0]) {
        console.log(`✅ Seeded/Verified Company: ${adminUser.companies[0].name}`);
    }

    // 3. Create Super Admin (Upsert)
    const superAdminPassword = await bcrypt.hash('password123', 10);
    const superAdmin = await prisma.user.upsert({
        where: { email: 'superadmin@primechatbot.com' },
        update: { role: 'SUPER_ADMIN' }, // Ensure role is set correctly even if exists
        create: {
            email: 'superadmin@primechatbot.com',
            password: superAdminPassword,
            role: 'SUPER_ADMIN'
        }
    });
    console.log(`✅ Seeded/Verified Super Admin: ${superAdmin.email}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
