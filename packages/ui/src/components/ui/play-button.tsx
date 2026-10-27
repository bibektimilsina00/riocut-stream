import * as React from "react"
import { Play, Loader2 } from "lucide-react"
import { Button } from "./button"
import { cn } from "../../lib/utils"

interface PlayButtonProps extends React.ComponentPropsWithoutRef<typeof Button> {
    children?: React.ReactNode
    loading?: boolean
}

/**
 * Primary play button with consistent styling across the application
 * Based on the movie detail page design with blue gradient
 */
const PlayButton = React.forwardRef<HTMLButtonElement, PlayButtonProps>(
    ({ className, children = "Play Now", size = "lg", loading, disabled, onClick, ...props }, ref) => {
        const [isLoading, setIsLoading] = React.useState(false);

        const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
            if (loading || isLoading || disabled) return;

            setIsLoading(true);
            try {
                await onClick?.(e);
            } finally {
                // Keep loading state for a bit to show feedback
                setTimeout(() => setIsLoading(false), 500);
            }
        };

        const isButtonLoading = loading || isLoading;

        return (
            <Button
                ref={ref}
                className={cn("gap-2 bg-teal-600 hover:bg-teal-700 text-white", className)}
                size={size}
                disabled={disabled || isButtonLoading}
                onClick={handleClick}
                {...props}
            >
                {isButtonLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <Play className="w-5 h-5 fill-white" />
                )}
                {children}
            </Button>
        )
    }
)

PlayButton.displayName = "PlayButton"

export { PlayButton }
