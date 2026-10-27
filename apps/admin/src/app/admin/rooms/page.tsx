'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Users, Trash2, BarChart3 } from 'lucide-react';

interface WatchRoom {
    id: string;
    roomCode: string;
    mediaTitle: string;
    creatorName: string;
    participantCount: number;
    createdAt: string;
    isActive: boolean;
}

export default function RoomsPage() {
    const queryClient = useQueryClient();

    // Fetch active rooms
    const { data: roomsData = { rooms: [], total: 0 }, isLoading } = useQuery({
        queryKey: ['admin', 'rooms', 'active'],
        queryFn: async () => {
            const res = await axios.get('/api/admin/rooms');
            return res.data;
        },
        staleTime: 1000 * 30,
        refetchInterval: 1000 * 30, // Refetch every 30 seconds
    });

    // Close room mutation
    const closeRoomMutation = useMutation({
        mutationFn: async (roomId: string) => {
            await axios.delete(`/api/admin/rooms/${roomId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'rooms'] });
        },
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Watch Rooms</h1>
                <p className="text-gray-400 mt-2">Monitor active watch together sessions</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm font-medium">Active Rooms</p>
                            <p className="text-3xl font-bold text-white mt-2">{roomsData.total}</p>
                        </div>
                        <BarChart3 size={32} className="text-teal-400" />
                    </div>
                </div>

                <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm font-medium">Total Participants</p>
                            <p className="text-3xl font-bold text-white mt-2">
                                {roomsData.rooms.reduce((acc: number, room: WatchRoom) => acc + room.participantCount, 0)}
                            </p>
                        </div>
                        <Users size={32} className="text-green-400" />
                    </div>
                </div>

                <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm font-medium">Avg Room Size</p>
                            <p className="text-3xl font-bold text-white mt-2">
                                {roomsData.total > 0
                                    ? (
                                        roomsData.rooms.reduce((acc: number, room: WatchRoom) => acc + room.participantCount, 0) /
                                        roomsData.total
                                    ).toFixed(1)
                                    : 0}
                            </p>
                        </div>
                        <Users size={32} className="text-purple-400" />
                    </div>
                </div>
            </div>

            {/* Rooms Table */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                    </div>
                ) : roomsData.rooms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <Users size={48} className="text-gray-600 mb-4" />
                        <p className="text-gray-400 text-lg">No active watch rooms</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-800 bg-gray-800/50">
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Room Code</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Content</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Creator</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Participants</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Created</th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {roomsData.rooms.map((room: WatchRoom) => (
                                        <tr key={room.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-mono text-teal-400">{room.roomCode}</td>
                                            <td className="px-6 py-4 text-sm text-white font-medium">{room.mediaTitle}</td>
                                            <td className="px-6 py-4 text-sm text-gray-400">{room.creatorName}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-2">
                                                    <Users size={18} className="text-green-400" />
                                                    <span className="text-sm font-medium text-white">{room.participantCount}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-400">
                                                {new Date(room.createdAt).toLocaleTimeString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => closeRoomMutation.mutate(room.id)}
                                                    className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                                                    title="Close room"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
