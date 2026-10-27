import Image from 'next/image';
import { StandingRow } from '@/lib/sportsrc';

export default function StandingsTable({ rows }: { rows: StandingRow[] }) {
    if (!rows || rows.length === 0) {
        return <p className="text-sm text-gray-400">No standings available.</p>;
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900">
            <table className="w-full text-sm">
                <thead className="bg-gray-800/50">
                    <tr className="text-left text-gray-400">
                        <th className="px-3 py-2 w-12">#</th>
                        <th className="px-3 py-2">Team</th>
                        <th className="px-3 py-2 w-12 text-right">P</th>
                        <th className="px-3 py-2 w-12 text-right">W</th>
                        <th className="px-3 py-2 w-12 text-right">D</th>
                        <th className="px-3 py-2 w-12 text-right">L</th>
                        <th className="px-3 py-2 w-14 text-right">GF</th>
                        <th className="px-3 py-2 w-14 text-right">GA</th>
                        <th className="px-3 py-2 w-14 text-right">GD</th>
                        <th className="px-3 py-2 w-14 text-right font-semibold">Pts</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => {
                        const pos = row.position;
                        const gd = row.goalDifference ?? ((row.goalsFor ?? 0) - (row.goalsAgainst ?? 0));
                        const zone =
                            pos <= 4 ? 'border-l-2 border-emerald-500' :
                                pos >= rows.length - 2 ? 'border-l-2 border-red-500' :
                                    'border-l-2 border-transparent';
                        return (
                            <tr key={row.team.id ?? `${pos}-${row.team.name}`} className={`border-t border-gray-800 text-gray-200 hover:bg-gray-800/40 ${zone}`}>
                                <td className="px-3 py-2 font-medium">{pos}</td>
                                <td className="px-3 py-2 text-white">
                                    <div className="flex items-center gap-2">
                                        {row.team.crest ? (
                                            <Image
                                                src={row.team.crest}
                                                alt={row.team.shortName ?? row.team.name}
                                                width={20}
                                                height={20}
                                                className="h-5 w-5 object-contain shrink-0"
                                                unoptimized
                                            />
                                        ) : null}
                                        <span className="truncate">{row.team.shortName ?? row.team.name}</span>
                                    </div>
                                </td>
                                <td className="px-3 py-2 text-right">{row.playedGames}</td>
                                <td className="px-3 py-2 text-right">{row.won}</td>
                                <td className="px-3 py-2 text-right">{row.draw}</td>
                                <td className="px-3 py-2 text-right">{row.lost}</td>
                                <td className="px-3 py-2 text-right">{row.goalsFor}</td>
                                <td className="px-3 py-2 text-right">{row.goalsAgainst}</td>
                                <td className="px-3 py-2 text-right">{gd > 0 ? `+${gd}` : gd}</td>
                                <td className="px-3 py-2 text-right font-semibold text-white">{row.points}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
