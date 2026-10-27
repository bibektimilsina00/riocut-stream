'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { X, Users, Search, Copy, Check, Video, Mic, Phone } from 'lucide-react';
import { Button } from '@riocut/ui/components/ui/button';

interface WatchTogetherModalProps {
    isOpen: boolean;
    onClose: () => void;
    movieTitle: string;
    movieId: number;
    embedUrl: string;
    type: 'movie' | 'tv';
}

interface User {
    id: string;
    name: string;
    email: string;
}

export default function WatchTogetherModal({
    isOpen,
    onClose,
    movieTitle,
    movieId,
    embedUrl,
    type
}: WatchTogetherModalProps) {
    const { data: session } = useSession();
    const [mode, setMode] = useState<'create' | 'join'>('create');
    const [username, setUsername] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [searching, setSearching] = useState(false);
    const [copied, setCopied] = useState(false);
    const [generatedRoomCode, setGeneratedRoomCode] = useState('');
    const [sendingInvites, setSendingInvites] = useState(false);
    const [error, setError] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Settings
    const [enableVideo, setEnableVideo] = useState(false);
    const [enableAudio, setEnableAudio] = useState(true);

    useEffect(() => {
        if (isOpen) {
            // Generate room code when modal opens
            setGeneratedRoomCode(generateRoomCode());

            // Use session user's name if available, otherwise try localStorage
            if (session?.user?.name) {
                setUsername(session.user.name);
            } else if (session?.user?.email) {
                // Use email username if name not available
                setUsername(session.user.email.split('@')[0]);
            } else {
                const savedUsername = localStorage.getItem('watchTogether_username');
                if (savedUsername) {
                    setUsername(savedUsername);
                }
            }
        }
    }, [isOpen, session?.user?.email, session?.user?.name]);

    const generateRoomCode = () => {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(generatedRoomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCreateRoom = async () => {
        if (!username.trim()) {
            setError('Please enter your username');
            return;
        }

        setError('');
        setIsCreating(true);

        // Save username for future use
        localStorage.setItem('watchTogether_username', username);

        // Create room with settings
        const roomData = {
            roomCode: generatedRoomCode,
            hostUsername: username,
            movieTitle,
            movieId,
            embedUrl,
            type,
            enableVideo,
            enableAudio,
            invitedUsers: selectedUsers,
            timestamp: Date.now()
        };

        // Store in localStorage as backup
        localStorage.setItem(`room_${generatedRoomCode}`, JSON.stringify(roomData));

        // Save to database if user is logged in
        if (session?.user?.email) {
            try {
                console.log('🎬 Creating room in database:', generatedRoomCode);

                const roomResponse = await fetch('/api/watch-room', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        roomCode: generatedRoomCode,
                        mediaId: movieId,
                        mediaType: type,
                        mediaTitle: movieTitle,
                        embedUrl: embedUrl, // <-- FIX: pass embedUrl
                        posterPath: null, // You can pass poster path if available
                        season: null, // For TV shows
                        episode: null, // For TV shows
                    }),
                });

                if (!roomResponse.ok) {
                    const errorData = await roomResponse.json().catch(() => ({}));
                    console.error('❌ Failed to create room:', errorData);
                    throw new Error(`Failed to create room: ${roomResponse.status}`);
                }

                const roomResult = await roomResponse.json();
                console.log('✅ Room created successfully:', roomResult.room?.id);

                // Send invitations to selected users automatically
                if (selectedUsers.length > 0) {
                    console.log('📧 Sending invites to', selectedUsers.length, 'users');
                    const promises = selectedUsers.map((user) =>
                        fetch('/api/notifications/invite', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                toUserId: user.id,
                                roomCode: generatedRoomCode,
                                mediaTitle: movieTitle,
                                mediaId: movieId,
                                mediaType: type,
                                embedUrl: embedUrl,
                            }),
                        })
                    );

                    await Promise.all(promises);
                    console.log('✅ Invites sent successfully!');
                }
            } catch (error) {
                console.error('❌ Error saving room to database:', error);
                setError('Failed to create room. Please try again.');
                setIsCreating(false);
                return; // Don't navigate if room creation failed
            }
        }

        setIsCreating(false);

        // Navigate to watch party page
        window.location.href = `/watch-together?room=${generatedRoomCode}&username=${encodeURIComponent(username)}`;
    };

    const handleJoinRoom = () => {
        if (!username.trim()) {
            alert('Please enter your username');
            return;
        }

        if (!roomCode.trim()) {
            alert('Please enter a room code');
            return;
        }

        // Save username
        localStorage.setItem('watchTogether_username', username);

        // Navigate to watch party page
        window.location.href = `/watch-together?room=${roomCode.toUpperCase()}&username=${encodeURIComponent(username)}`;
    };

    const handleAddUser = (user: User) => {
        if (!selectedUsers.find(u => u.id === user.id)) {
            setSelectedUsers([...selectedUsers, user]);
        }
    };

    const handleRemoveUser = (userId: string) => {
        setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
    };

    // Search users from database
    useEffect(() => {
        const searchUsersFromDB = async () => {
            if (!searchQuery || searchQuery.trim().length < 2) {
                setSearchResults([]);
                return;
            }

            setSearching(true);
            try {
                const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
                if (response.ok) {
                    const data = await response.json();
                    setSearchResults(data.users);
                }
            } catch (error) {
                console.error('Error searching users:', error);
            } finally {
                setSearching(false);
            }
        };

        const timeoutId = setTimeout(searchUsersFromDB, 300); // Debounce search
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const sendInvitesToSelectedUsers = async () => {
        if (selectedUsers.length === 0 || !session?.user?.email) return;

        setSendingInvites(true);
        try {
            const promises = selectedUsers.map((user) =>
                fetch('/api/notifications/invite', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        toUserId: user.id,
                        roomCode: generatedRoomCode,
                        mediaTitle: movieTitle,
                        mediaId: movieId,
                        mediaType: type,
                        embedUrl: embedUrl,
                    }),
                })
            );

            console.log('Sending invites to', selectedUsers.length, 'users', embedUrl ? 'with embedUrl' : 'without embedUrl');

            await Promise.all(promises);
            alert(`Invites sent to ${selectedUsers.length} user(s)!`);
        } catch (error) {
            console.error('Error sending invites:', error);
            alert('Failed to send some invites');
        } finally {
            setSendingInvites(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-800">
                {/* Header */}
                <div className="bg-gradient-to-r from-teal-600 to-purple-600 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Users className="w-8 h-8 text-white" />
                            <div>
                                <h2 className="text-2xl font-bold text-white">Watch Together</h2>
                                <p className="text-teal-100 text-sm">{movieTitle}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Mode Selector */}
                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={() => setMode('create')}
                            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${mode === 'create'
                                ? 'bg-teal-600 text-white shadow-lg'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            Create Room
                        </button>
                        <button
                            onClick={() => setMode('join')}
                            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${mode === 'join'
                                ? 'bg-teal-600 text-white shadow-lg'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            Join Room
                        </button>
                    </div>

                    {mode === 'create' ? (
                        <div className="space-y-6">
                            {/* Username */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Your Username
                                </label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter your username"
                                    className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                                />
                            </div>

                            {/* Room Code */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Room Code
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={generatedRoomCode}
                                        readOnly
                                        className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 font-mono text-lg"
                                    />
                                    <Button
                                        onClick={handleCopyCode}
                                        variant="outline"
                                        className="px-4"
                                    >
                                        {copied ? (
                                            <Check className="w-5 h-5 text-green-500" />
                                        ) : (
                                            <Copy className="w-5 h-5" />
                                        )}
                                    </Button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Share this code with friends to invite them
                                </p>
                            </div>

                            {/* Call Settings */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-3">
                                    Call Settings
                                </label>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-750 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={enableVideo}
                                            onChange={(e) => setEnableVideo(e.target.checked)}
                                            className="w-5 h-5 text-teal-600 bg-gray-700 border-gray-600 rounded focus:ring-teal-500"
                                        />
                                        <Video className="w-5 h-5 text-gray-400" />
                                        <span className="text-gray-300">Enable Video Call</span>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-750 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={enableAudio}
                                            onChange={(e) => setEnableAudio(e.target.checked)}
                                            className="w-5 h-5 text-teal-600 bg-gray-700 border-gray-600 rounded focus:ring-teal-500"
                                        />
                                        <Mic className="w-5 h-5 text-gray-400" />
                                        <span className="text-gray-300">Enable Voice Call</span>
                                    </label>
                                </div>
                            </div>

                            {/* Invite Users */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Invite Friends (Optional)
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search username..."
                                        className="w-full pl-10 pr-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>

                                {/* Search Results */}
                                {searchQuery && (
                                    <div className="mt-2 bg-gray-800 rounded-lg border border-gray-700 max-h-40 overflow-y-auto">
                                        {searching ? (
                                            <div className="px-4 py-3 text-center text-gray-400">
                                                Searching...
                                            </div>
                                        ) : searchResults.length > 0 ? (
                                            searchResults.map(user => (
                                                <button
                                                    key={user.id}
                                                    onClick={() => handleAddUser(user)}
                                                    className="w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors flex items-center justify-between"
                                                    disabled={selectedUsers.some(u => u.id === user.id)}
                                                >
                                                    <div>
                                                        <div className="text-white font-medium">{user.name}</div>
                                                        <div className="text-xs text-gray-400">{user.email}</div>
                                                    </div>
                                                    {selectedUsers.some(u => u.id === user.id) && (
                                                        <Check className="w-4 h-4 text-green-500" />
                                                    )}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-4 py-3 text-center text-gray-400">
                                                No users found
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Selected Users */}
                                {selectedUsers.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {selectedUsers.map(user => (
                                            <div
                                                key={user.id}
                                                className="flex items-center gap-2 bg-teal-600 text-white px-3 py-1 rounded-full"
                                            >
                                                <span className="text-sm">{user.name}</span>
                                                <button
                                                    onClick={() => handleRemoveUser(user.id)}
                                                    className="hover:bg-teal-700 rounded-full p-0.5"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Create Button */}
                            <div className="space-y-2">
                                {selectedUsers.length > 0 && (
                                    <Button
                                        onClick={sendInvitesToSelectedUsers}
                                        disabled={sendingInvites}
                                        className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
                                    >
                                        {sendingInvites ? 'Sending...' : `Send Invites (${selectedUsers.length})`}
                                    </Button>
                                )}
                                <Button
                                    onClick={handleCreateRoom}
                                    disabled={isCreating}
                                    className="w-full py-3 bg-gradient-to-r from-teal-600 to-purple-600 hover:from-teal-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isCreating ? (
                                        <>
                                            <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Creating Room...
                                        </>
                                    ) : (
                                        <>
                                            <Users className="w-5 h-5 mr-2" />
                                            Create & Join Room
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Username */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Your Username
                                </label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter your username"
                                    className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                            </div>

                            {/* Room Code */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Room Code
                                </label>
                                <input
                                    type="text"
                                    value={roomCode}
                                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                    placeholder="Enter 6-digit room code"
                                    className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-lg"
                                    maxLength={6}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Ask the host for the room code
                                </p>
                            </div>

                            {/* Call Settings */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-3">
                                    Join With
                                </label>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-750 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={enableVideo}
                                            onChange={(e) => setEnableVideo(e.target.checked)}
                                            className="w-5 h-5 text-teal-600 bg-gray-700 border-gray-600 rounded focus:ring-teal-500"
                                        />
                                        <Video className="w-5 h-5 text-gray-400" />
                                        <span className="text-gray-300">Enable Video</span>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-750 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={enableAudio}
                                            onChange={(e) => setEnableAudio(e.target.checked)}
                                            className="w-5 h-5 text-teal-600 bg-gray-700 border-gray-600 rounded focus:ring-teal-500"
                                        />
                                        <Mic className="w-5 h-5 text-gray-400" />
                                        <span className="text-gray-300">Enable Audio</span>
                                    </label>
                                </div>
                            </div>

                            {/* Join Button */}
                            <Button
                                onClick={handleJoinRoom}
                                className="w-full py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold rounded-lg transition-all"
                            >
                                <Phone className="w-5 h-5 mr-2" />
                                Join Watch Party
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
