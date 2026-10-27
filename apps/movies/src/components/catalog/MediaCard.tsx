'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, memo } from 'react';
import { Star } from 'lucide-react';

import { getImageUrl, getYear, formatVoteAverage } from '@/lib/api/tmdb';
import { Card, CardContent } from '@riocut/ui/components/ui/card';
import { Badge } from '@riocut/ui/components/ui/badge';

// Simplified interface for what MediaCard actually needs
interface SimpleMediaItem {
    id: number;
    title?: string;
    name?: string;
    poster_path: string | null;
    vote_average?: number;
    release_date?: string;
    first_air_date?: string;
}

interface MediaCardProps {
    item: SimpleMediaItem;
    type: 'movie' | 'tv';
}

/**
 * Media card component using shadcn/ui Card with hover effects
 * Displays movie/TV show poster, title, rating, and year
 * Memoized to prevent unnecessary re-renders
 */
const MediaCard = memo(function MediaCard({ item, type }: MediaCardProps) {
    const [imageError, setImageError] = useState(false);

    const title = type === 'movie' ? item.title : item.name;
    const releaseDate = type === 'movie' ? item.release_date : item.first_air_date;
    const year = releaseDate ? getYear(releaseDate) : 'N/A';
    const rating = item.vote_average ? formatVoteAverage(item.vote_average) : 'N/A';

    return (
        <Link href={`/${type}/${item.id}`} className="group block" prefetch={true}>
            <Card className="bg-gray-900/50 border-gray-800 overflow-hidden card-hover py-0 gap-0">
                <CardContent className="p-0 relative">
                    {/* Poster Image */}
                    <div className="relative aspect-[2/3] w-full h-full">
                        {!imageError && item.poster_path ? (
                            <Image
                                src={getImageUrl(item.poster_path, 'w500')}
                                alt={title || 'Media poster'}
                                fill
                                // sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                className="object-cover transition-transform duration-300 group-hover:scale-110"
                                onError={() => setImageError(true)}
                                loading="lazy"
                                quality={75}
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
                                <svg
                                    className="h-16 w-16 text-gray-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                                    />
                                </svg>
                            </div>
                        )}

                        {/* Overlay gradient */}
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                        {/* Rating badge */}
                        {item.vote_average && item.vote_average > 0 && (
                            <div className="absolute right-2 top-2">
                                <Badge
                                    variant="secondary"
                                    className="bg-black/70 text-yellow-400 border-yellow-500/30 backdrop-blur-sm"
                                >
                                    <Star className="w-3 h-3 mr-1 fill-yellow-400" />
                                    {rating}
                                </Badge>
                            </div>
                        )}
                    </div>

                    {/* Content info - always visible */}
                    <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/70 to-transparent">
                        <h3 className="text-sm font-semibold text-white line-clamp-2 mb-1">
                            {title}
                        </h3>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-300">{year}</span>
                            <Badge
                                variant="outline"
                                className="text-xs text-gray-400 border-gray-700"
                            >
                                {type === 'movie' ? 'Movie' : 'TV'}
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
});

export default MediaCard;