/**
 * API Route: Save User AI API Keys
 * POST /api/user/ai-settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@riocut/db';
import { invalidateTmdbKeyCache } from '@riocut/services';
import { z } from 'zod';

const aiSettingsSchema = z.object({
    geminiApiKey: z.string().optional(),
    openaiApiKey: z.string().optional(),
    anthropicApiKey: z.string().optional(),
    tmdbApiKey: z.string().optional(),
    preferredAiModel: z.string().optional(),
});

export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const validated = aiSettingsSchema.parse(body);

        // Update user's AI settings
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                geminiApiKey: validated.geminiApiKey || undefined,
                openaiApiKey: validated.openaiApiKey || undefined,
                anthropicApiKey: validated.anthropicApiKey || undefined,
                tmdbApiKey: validated.tmdbApiKey || undefined,
                preferredAiModel: validated.preferredAiModel || undefined,
            },
        });

        // Bust the shared TMDB key cache so the new key is picked up immediately.
        if (validated.tmdbApiKey !== undefined) invalidateTmdbKeyCache();

        return NextResponse.json({
            success: true,
            message: 'AI settings saved successfully',
        });
    } catch (error) {
        console.error('Error saving AI settings:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to save settings' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                geminiApiKey: true,
                openaiApiKey: true,
                anthropicApiKey: true,
                tmdbApiKey: true,
                preferredAiModel: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        // Return masked keys (show only last 4 characters for security)
        return NextResponse.json({
            success: true,
            settings: {
                geminiApiKey: user.geminiApiKey ? `****${user.geminiApiKey.slice(-4)}` : null,
                openaiApiKey: user.openaiApiKey ? `****${user.openaiApiKey.slice(-4)}` : null,
                anthropicApiKey: user.anthropicApiKey ? `****${user.anthropicApiKey.slice(-4)}` : null,
                tmdbApiKey: user.tmdbApiKey ? `****${user.tmdbApiKey.slice(-4)}` : null,
                preferredAiModel: user.preferredAiModel,
                hasGeminiKey: !!user.geminiApiKey,
                hasOpenAIKey: !!user.openaiApiKey,
                hasAnthropicKey: !!user.anthropicApiKey,
                hasTmdbKey: !!user.tmdbApiKey,
            },
        });
    } catch (error) {
        console.error('Error fetching AI settings:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch settings' },
            { status: 500 }
        );
    }
}
