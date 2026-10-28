import type { Config } from 'tailwindcss'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const preset = require('@riocut/config/tailwind/preset')

const config: Config = {
    presets: [preset],
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
        './src/lib/sports.ts',
        '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
        '../../packages/auth/src/**/*.{js,ts,jsx,tsx,mdx}',
        '../../packages/realtime/src/**/*.{js,ts,jsx,tsx,mdx}',
    ],
}

export default config
