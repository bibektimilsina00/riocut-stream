'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from './button';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    isLoading?: boolean;
    showFirstLast?: boolean;
    maxVisiblePages?: number;
}

export default function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    isLoading = false,
    showFirstLast = true,
    maxVisiblePages = 7
}: PaginationProps) {
    const [inputValue, setInputValue] = useState(currentPage);

    useEffect(() => {
        setInputValue(currentPage);
    }, [currentPage]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Number(e.target.value);
        if (!isNaN(val)) setInputValue(val);
    };

    const handleInputSubmit = () => {
        const val = Math.max(1, Math.min(totalPages, inputValue));
        onPageChange(val);
    };

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            const leftOffset = Math.floor((maxVisiblePages - 3) / 2);
            const rightOffset = Math.ceil((maxVisiblePages - 3) / 2);

            let start = Math.max(2, currentPage - leftOffset);
            let end = Math.min(totalPages - 1, currentPage + rightOffset);

            if (currentPage <= leftOffset + 2) {
                start = 2;
                end = maxVisiblePages - 1;
            }

            if (currentPage >= totalPages - rightOffset - 1) {
                start = totalPages - maxVisiblePages + 2;
                end = totalPages - 1;
            }

            if (start > 2) pages.push('...');
            for (let i = start; i <= end; i++) pages.push(i);
            if (end < totalPages - 1) pages.push('...');
            pages.push(totalPages);
        }

        return pages;
    };

    const pageNumbers = getPageNumbers();
    const hasPrevPage = currentPage > 1;
    const hasNextPage = currentPage < totalPages;

    return (
        // 1. Set 'w-full' to ensure it takes up the full width of its parent container.
        // 2. Set 'justify-between' to push the two main sections (buttons and input) to the far left and far right.
        <nav className="isolate flex items-center justify-center lg:justify-between w-full mt-4 flex-wrap p-2 border-t border-b border-gray-800" aria-label="Pagination">

            {/* LEFT SIDE: Button Controls Group */}
            <div className="flex items-center gap-4 flex-shrink-0">
                {/* First/Previous Buttons Group */}
                <div className="flex items-center gap-1">
                    {showFirstLast && (
                        <Button
                            onClick={() => onPageChange(1)}
                            disabled={!hasPrevPage || isLoading}
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 shrink-0 hover:bg-gray-800 border-gray-700"
                            title="First page"
                            aria-label="Go to first page"
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                    )}

                    <Button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={!hasPrevPage || isLoading}
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0 hover:bg-gray-800 border-gray-700"
                        title="Previous page"
                        aria-label="Go to previous page"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </div>

                {/* Page Buttons - Tightly grouped */}
                <div className="hidden sm:flex items-center gap-1">
                    {pageNumbers.map((page, index) => {
                        if (page === '...') {
                            return (
                                <span
                                    key={`ellipsis-${index}`}
                                    className="px-2 text-gray-400 select-none text-sm"
                                    aria-hidden="true"
                                >
                                    ...
                                </span>
                            );
                        }

                        const pageNum = page as number;
                        const isActive = pageNum === currentPage;

                        return (
                            <Button
                                key={pageNum}
                                onClick={() => onPageChange(pageNum)}
                                disabled={isLoading}
                                variant={isActive ? 'default' : 'outline'}
                                size="icon"
                                // Use 'w-auto px-3' for number buttons to handle multi-digit numbers without overflow
                                className={`h-9 w-auto px-3 shrink-0 transition-colors duration-200 ${isActive
                                    ? 'bg-teal-600 hover:bg-teal-700 text-white border-teal-600'
                                    : 'bg-transparent text-white hover:bg-gray-800 border-gray-700'
                                    }`}
                                aria-label={`Go to page ${pageNum}`}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                {/* 3. Use toLocaleString() for large numbers ($10,000+) */}
                                {pageNum.toLocaleString()}
                            </Button>
                        );
                    })}
                </div>

                {/* Next/Last Buttons Group */}
                <div className="flex items-center gap-1">
                    <Button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={!hasNextPage || isLoading}
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0 hover:bg-gray-800 border-gray-700"
                        title="Next page"
                        aria-label="Go to next page"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>

                    {showFirstLast && (
                        <Button
                            onClick={() => onPageChange(totalPages)}
                            disabled={!hasNextPage || isLoading}
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 shrink-0 hover:bg-gray-800 border-gray-700"
                            title="Last page"
                            aria-label="Go to last page"
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* RIGHT SIDE: Go To Page Input & Summary */}
            <div className="flex items-center gap-2 flex-shrink-0 mt-4 lg:mt-0">
                <span className="text-sm text-gray-400 select-none whitespace-nowrap hidden sm:inline">
                    Page
                </span>
                <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={(e) => e.key === 'Enter' && handleInputSubmit()}
                    className="w-16 h-9 text-white rounded border border-gray-700 px-2 py-1 text-sm bg-gray-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    aria-label={`Enter page number, max ${totalPages.toLocaleString()}`}
                />
                <Button size="sm" onClick={handleInputSubmit} disabled={isLoading}>
                    Go
                </Button>
                <span className="text-sm text-gray-400 select-none whitespace-nowrap">
                    of {totalPages.toLocaleString()}
                </span>
            </div>
        </nav>
    );
}