'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star, Play } from 'lucide-react';
import { MediaItem, getImageUrl, formatVoteAverage } from '@/lib/api/tmdb';
import { generateImageAlt } from '@/lib/seo';
import { useState } from 'react';

interface MediaCardProps {
    media: MediaItem;
    mediaType?: 'movie' | 'tv';
}

export function MediaCard({ media, mediaType }: MediaCardProps) {
    const [imageError, setImageError] = useState(false);

    const title = 'title' in media ? media.title : media.name;
    const releaseDate = 'release_date' in media ? media.release_date : media.first_air_date;
    const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
    const rating = media.vote_average;
    const type = media.media_type || mediaType || 'movie';

    const detailUrl = `/${type}/${media.id}`;

    return (
        <Link
            href={detailUrl}
            className="group relative block overflow-hidden rounded-lg bg-gray-900 transition-transform hover:scale-105 hover:z-10"
        >
            <div className="aspect-[2/3] relative overflow-hidden">
                {!imageError && media.poster_path ? (
                    <Image
                        src={getImageUrl(media.poster_path, 'w500')}
                        alt={generateImageAlt(type, title, 'poster')}
                        fill
                        className="object-cover transition-opacity group-hover:opacity-75"
                        onError={() => setImageError(true)}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-500">
                        No Image
                    </div>
                )}

                {/* Overlay on hover */}
                <div className="pointer-events-none absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                        <div className="bg-teal-600 rounded-full p-3">
                            <Play className="w-6 h-6 text-white fill-white" />
                        </div>
                        <span className="text-white text-sm font-medium">Watch Now</span>
                    </div>
                </div>

                {/* Rating badge */}
                {rating > 0 && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/80 px-2 py-1 rounded-md backdrop-blur-sm">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-white text-xs font-semibold">
                            {formatVoteAverage(rating)}
                        </span>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="p-3">
                <h3 className="text-white font-medium text-sm line-clamp-2 mb-1">
                    {title}
                </h3>
                <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{year}</span>
                    <span className="uppercase text-teal-400">{type}</span>
                </div>
            </div>
        </Link>
    );
}
