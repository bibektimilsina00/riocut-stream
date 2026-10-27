'use client';

export function ActiveRoomsChart() {
    // Mock data - will be replaced with real data from API
    const data = [
        { hour: '00:00', rooms: 2 },
        { hour: '04:00', rooms: 1 },
        { hour: '08:00', rooms: 5 },
        { hour: '12:00', rooms: 12 },
        { hour: '16:00', rooms: 18 },
        { hour: '20:00', rooms: 24 },
        { hour: '23:00', rooms: 8 },
    ];

    const maxRooms = Math.max(...data.map(d => d.rooms));

    return (
        <div className="space-y-4">
            <div className="flex items-end justify-between space-x-2 h-48">
                {data.map((item) => (
                    <div key={item.hour} className="flex-1 flex flex-col items-center">
                        <div
                            className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg transition-all hover:from-green-500 hover:to-green-300"
                            style={{
                                height: `${(item.rooms / maxRooms) * 100}%`,
                                minHeight: '4px',
                            }}
                        />
                        <p className="text-xs text-gray-400 mt-2">{item.hour}</p>
                    </div>
                ))}
            </div>
            <div className="text-xs text-gray-500 text-center">Peak hours today</div>
        </div>
    );
}
