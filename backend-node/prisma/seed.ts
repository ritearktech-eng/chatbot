import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // 1. Clean up existing data (optional, but good for idempotent runs)
    // Be careful with this in production!
    await prisma.document.deleteMany();
    await prisma.company.deleteMany();
    await prisma.user.deleteMany();

    // 2. Create Admin User
    const hashedPassword = await bcrypt.hash('password123', 10);
    const adminUser = await prisma.user.create({
        data: {
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
                            {
                                type: 'URL',
                                content: 'https://acmecorp.com/docs',
                                metadata: { source: 'url', url: 'https://acmecorp.com/docs' }
                            }
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

    console.log(`✅ Seeded User: ${adminUser.email}`);
    console.log(`✅ Seeded Company: ${adminUser.companies[0].name}`);
    console.log(`✅ Seeded ${adminUser.companies[0].documents.length} Documents`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
