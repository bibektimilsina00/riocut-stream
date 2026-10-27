#!/usr/bin/env node

/**
 * Environment Variables Checker
 * Run this to verify all required environment variables are set
 * Usage: node check-env.js
 */

import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

console.log('🔍 Checking Environment Variables...\n');

const requiredVars = [
    'DATABASE_URL',
    'TMDB_API_KEY',
    'AUTH_SECRET',
    'AUTH_URL',
];

const optionalVars = [
    'GEMINI_API_KEY',
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'REDIS_HOST',
    'REDIS_PORT',
    'SENTRY_DSN',
];

let allRequired = true;

console.log('📋 Required Variables:');
requiredVars.forEach((varName) => {
    const value = process.env[varName];
    if (value) {
        console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
    } else {
        console.log(`❌ ${varName}: NOT SET`);
        allRequired = false;
    }
});

console.log('\n📋 Optional Variables:');
optionalVars.forEach((varName) => {
    const value = process.env[varName];
    if (value) {
        console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
    } else {
        console.log(`⚠️  ${varName}: Not set (optional)`);
    }
});

console.log('\n' + '='.repeat(50));

if (allRequired) {
    console.log('✅ All required environment variables are set!');
    console.log('🚀 You can now run: npm run dev or npm run worker:dev');
} else {
    console.log('❌ Some required environment variables are missing!');
    console.log('📝 Please create .env.local file with the required variables.');
    console.log('💡 See .env.example or ask your team for the values.');
    process.exit(1);
}
