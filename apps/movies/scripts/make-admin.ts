#!/usr/bin/env ts-node

/**
 * Script to make a user admin
 * Usage: npm run make-admin <email>
 * Example: npm run make-admin user@example.com
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeAdmin(email: string) {
    try {
        console.log(`\n🔍 Looking for user with email: ${email}...`);

        // Find the user
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                isBanned: true,
            },
        });

        if (!user) {
            console.error(`❌ User with email "${email}" not found.`);
            process.exit(1);
        }

        console.log('\n📋 Current user details:');
        console.log(`   ID: ${user.id}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.isActive}`);
        console.log(`   Banned: ${user.isBanned}`);

        // Check if already admin
        if (user.role === 'admin') {
            console.log('\n✅ User is already an admin. No changes needed.');
            process.exit(0);
        }

        // Update user to admin
        const updatedUser = await prisma.user.update({
            where: { email },
            data: {
                role: 'admin',
                isActive: true, // Ensure admin is active
                isBanned: false, // Ensure admin is not banned
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
            },
        });

        console.log('\n✅ Successfully updated user to admin!');
        console.log('\n📋 Updated user details:');
        console.log(`   ID: ${updatedUser.id}`);
        console.log(`   Name: ${updatedUser.name}`);
        console.log(`   Email: ${updatedUser.email}`);
        console.log(`   Role: ${updatedUser.role}`);
        console.log('\n🎉 Done!\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error making user admin:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
    console.error('\n❌ Error: Email argument is required');
    console.log('\nUsage: npm run make-admin <email>');
    console.log('Example: npm run make-admin user@example.com\n');
    process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
    console.error(`\n❌ Error: Invalid email format: ${email}\n`);
    process.exit(1);
}

makeAdmin(email);
