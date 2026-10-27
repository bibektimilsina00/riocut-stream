'use client';

import { useState } from 'react';
import { Trash2, Ban, CheckCircle, Edit, UserPlus, Shield, User as UserIcon, X } from 'lucide-react';
import { useUsers, useDeleteUser, useUpdateUserBanStatus, type User } from '@/lib/hooks/useAdmin';

type EditingUser = {
    id: string;
    name: string;
    email: string;
    role: string;
} | null;

export default function UsersPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingUser, setEditingUser] = useState<EditingUser>(null);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user' });

    // Fetch users using React Query hook
    const { data: usersData = { users: [], total: 0 }, isLoading } = useUsers(
        undefined,
        searchTerm || undefined
    );

    // Mutations using React Query hooks
    const deleteUserMutation = useDeleteUser();
    const banUserMutation = useUpdateUserBanStatus();

    // Filter users by role
    const filteredUsers = filterRole === 'all'
        ? usersData.users
        : usersData.users.filter((u: User) => u.role === filterRole);

    const handleCreateUser = async () => {
        try {
            const response = await fetch('/api/admin/users/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser),
            });
            if (response.ok) {
                setShowCreateModal(false);
                setNewUser({ name: '', email: '', password: '', role: 'user' });
                window.location.reload();
            }
        } catch (error) {
            console.error('Error creating user:', error);
        }
    };

    const handleUpdateRole = async (userId: string, newRole: string) => {
        try {
            const response = await fetch('/api/admin/users/update-role', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, role: newRole }),
            });
            if (response.ok) {
                window.location.reload();
            }
        } catch (error) {
            console.error('Error updating role:', error);
        }
    };

    const handleUpdateUser = async () => {
        if (!editingUser) return;
        try {
            const response = await fetch('/api/admin/users/update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingUser),
            });
            if (response.ok) {
                setEditingUser(null);
                window.location.reload();
            }
        } catch (error) {
            console.error('Error updating user:', error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">User Management</h1>
                    <p className="text-gray-400 mt-2">Manage platform users and permissions</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
                >
                    <UserPlus size={20} />
                    Create User
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-4 flex-wrap">
                <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 min-w-64 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                    <option value="all">All Roles</option>
                    <option value="user">User</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                </select>
            </div>

            {/* Users Table */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-800 bg-gray-800/50">
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Name</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Email</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Role</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Joined</th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((user: User) => (
                                        <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-white font-medium">{user.name}</td>
                                            <td className="px-6 py-4 text-sm text-gray-400">{user.email}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <select
                                                    value={user.role || 'user'}
                                                    onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                                                    className={`px-3 py-1 rounded-full text-xs font-semibold border-none focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer ${user.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                                                            user.role === 'moderator' ? 'bg-yellow-500/20 text-yellow-400' :
                                                                'bg-gray-700 text-gray-300'
                                                        }`}
                                                >
                                                    <option value="user">User</option>
                                                    <option value="moderator">Moderator</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                {user.isBanned ? (
                                                    <span className="text-red-400 font-medium">Banned</span>
                                                ) : user.isActive !== false ? (
                                                    <span className="text-green-400 font-medium flex items-center gap-1">
                                                        <CheckCircle size={16} />
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">Inactive</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-400">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => setEditingUser({
                                                            id: user.id,
                                                            name: user.name || '',
                                                            email: user.email,
                                                            role: user.role || 'user'
                                                        })}
                                                        className="p-2 rounded-lg bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 transition-colors"
                                                        title="Edit user"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => banUserMutation.mutate({ userId: user.id, isBanned: !user.isBanned })}
                                                        className={`p-2 rounded-lg transition-colors ${user.isBanned
                                                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                                            : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                                                            }`}
                                                        title={user.isBanned ? 'Unban user' : 'Ban user'}
                                                    >
                                                        <Ban size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm(`Are you sure you want to delete ${user.name || user.email}?`)) {
                                                                deleteUserMutation.mutate(user.id);
                                                            }
                                                        }}
                                                        className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                                                        title="Delete user"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer with total */}
                        <div className="px-6 py-4 bg-gray-800/50 border-t border-gray-800">
                            <p className="text-sm text-gray-400">
                                Showing <span className="text-white font-semibold">{filteredUsers.length}</span> of <span className="text-white font-semibold">{usersData.total}</span> users
                            </p>
                        </div>
                    </>
                )}
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white">Create New User</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                                <input
                                    type="text"
                                    value={newUser.name}
                                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    placeholder="user@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                                <input
                                    type="password"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                                <select
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                                >
                                    <option value="user">User</option>
                                    <option value="moderator">Moderator</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={handleCreateUser}
                                    className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
                                >
                                    Create User
                                </button>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white">Edit User</h2>
                            <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                                <input
                                    type="text"
                                    value={editingUser.name}
                                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={editingUser.email}
                                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                                <select
                                    value={editingUser.role}
                                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                                >
                                    <option value="user">User</option>
                                    <option value="moderator">Moderator</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={handleUpdateUser}
                                    className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
                                >
                                    Save Changes
                                </button>
                                <button
                                    onClick={() => setEditingUser(null)}
                                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
