export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
    const sizes = {
        sm: 'h-6 w-6',
        md: 'h-12 w-12',
        lg: 'h-16 w-16'
    };

    return (
        <div className="flex items-center justify-center py-20">
            <div className="relative">
                <div className={`${sizes[size]} border-t-2 border-b-2 border-teal-500 rounded-full animate-spin`}></div>
                <div className={`absolute inset-0 ${sizes[size]} border-t-2 border-b-2 border-teal-400 rounded-full animate-spin opacity-30`} style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
            </div>
        </div>
    );
}
