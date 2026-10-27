export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

export function calculateReadingTime(content: string): number {
    // Remove HTML tags and count words
    const plainText = content.replace(/<[^>]*>/g, '');
    const words = plainText.trim().split(/\s+/).length;

    // Average reading speed is ~200 words per minute
    const wordsPerMinute = 200;
    const minutes = Math.ceil(words / wordsPerMinute);

    return Math.max(1, minutes); // Minimum 1 minute
}

export function generateSeoTitle(title: string, maxLength: number = 60): string {
    if (title.length <= maxLength) {
        return title;
    }

    return title.substring(0, maxLength - 3).trim() + '...';
}

export function generateSeoDescription(content: string, maxLength: number = 160): string {
    // Remove HTML tags and get plain text
    const plainText = content.replace(/<[^>]*>/g, '');

    if (plainText.length <= maxLength) {
        return plainText;
    }

    // Find the last complete word within the limit
    const description = plainText.substring(0, maxLength);
    const lastSpaceIndex = description.lastIndexOf(' ');

    return lastSpaceIndex > 0
        ? description.substring(0, lastSpaceIndex) + '...'
        : description + '...';
}