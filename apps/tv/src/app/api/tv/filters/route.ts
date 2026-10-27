import { NextResponse } from 'next/server';
import { getCountries, getCategories, getLanguages } from '@riocut/services';

export const revalidate = 86400;

export async function GET() {
    const [countries, categories, languages] = await Promise.all([
        getCountries(),
        getCategories(),
        getLanguages(),
    ]);
    return NextResponse.json({ countries, categories, languages });
}
