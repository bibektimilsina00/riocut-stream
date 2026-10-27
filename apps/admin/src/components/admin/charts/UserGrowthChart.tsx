'use client';

export function UserGrowthChart() {
    // Mock data - will be replaced with real data from API
    const data = [
        { month: 'Jan', users: 120 },
        { month: 'Feb', users: 180 },
        { month: 'Mar', users: 250 },
        { month: 'Apr', users: 320 },
        { month: 'May', users: 410 },
        { month: 'Jun', users: 520 },
    ];

    const maxUsers = Math.max(...data.map(d => d.users));

    return (
        <div className="space-y-4">
            <div className="flex items-end justify-between space-x-2 h-48">
                {data.map((item) => (
                    <div key={item.month} className="flex-1 flex flex-col items-center">
                        <div
                            className="w-full bg-gradient-to-t from-teal-600 to-teal-400 rounded-t-lg transition-all hover:from-teal-500 hover:to-teal-300"
                            style={{
                                height: `${(item.users / maxUsers) * 100}%`,
                                minHeight: '4px',
                            }}
                        />
                        <p className="text-xs text-gray-400 mt-2">{item.month}</p>
                    </div>
                ))}
            </div>
            <div className="text-xs text-gray-500 text-center">Growth over last 6 months</div>
        </div>
    );
}
