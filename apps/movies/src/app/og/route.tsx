import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const title = searchParams.get('title') || 'Riocut'
    const subtitle = searchParams.get('subtitle') || 'Discover Movies & TV Shows'

    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#000000',
                    backgroundImage: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)',
                }}
            >
                <svg width="120" height="120" viewBox="0 0 64 64" style={{ marginBottom: 40 }}>
                    <defs>
                        <linearGradient id="g" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                            <stop offset="0" stopColor="#2dd4bf" />
                            <stop offset="1" stopColor="#0d9488" />
                        </linearGradient>
                    </defs>
                    <rect width="64" height="64" rx="16" fill="url(#g)" />
                    <path d="M26.7 16.75 L26.7 35.15 L41.25 25.61 Z" fill="white" />
                    <path d="M28.3 37.65 L42.85 28.11 L51.3 33.25 L28.3 47.25 Z" fill="white" />
                </svg>

                <h1
                    style={{
                        fontSize: 60,
                        fontWeight: 'bold',
                        color: 'white',
                        textAlign: 'center',
                        margin: '0 40px 20px 40px',
                        lineHeight: 1.1,
                    }}
                >
                    {title}
                </h1>

                <p
                    style={{
                        fontSize: 28,
                        color: '#9ca3af',
                        textAlign: 'center',
                        margin: '0 40px',
                        lineHeight: 1.4,
                    }}
                >
                    {subtitle}
                </p>

                <div
                    style={{
                        position: 'absolute',
                        bottom: 40,
                        right: 40,
                        fontSize: 20,
                        color: '#6b7280',
                    }}
                >
                    Riocut
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 630,
        }
    )
}