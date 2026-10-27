import { redirect } from 'next/navigation';

interface PageProps {
    searchParams: Promise<{
        page?: string;
        category?: string;
        search?: string;
        mediaType?: string;
    }>;
}

export default async function BlogRedirectPage({ searchParams }: PageProps) {
    const params = await searchParams;

    // Build query string from search params
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set('page', params.page);
    if (params.category) queryParams.set('category', params.category);
    if (params.search) queryParams.set('search', params.search);
    if (params.mediaType) queryParams.set('mediaType', params.mediaType);

    const queryString = queryParams.toString();
    const redirectUrl = queryString ? `/?${queryString}` : '/';

    redirect(redirectUrl);
}