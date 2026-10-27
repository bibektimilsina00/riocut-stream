import { LucideIcon } from 'lucide-react';

export default function EmptyState({
    Icon,
    title,
    description,
}: {
    Icon: LucideIcon;
    title: string;
    description?: string;
}) {
    return (
        <div className="rounded-xl border border-dashed border-gray-800 bg-gray-900/40 px-6 py-10 flex flex-col items-center text-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-800/60 text-gray-500">
                <Icon className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-gray-300">{title}</p>
            {description ? <p className="text-xs text-gray-500 max-w-sm">{description}</p> : null}
        </div>
    );
}
