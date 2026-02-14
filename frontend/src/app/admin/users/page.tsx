'use client';

import { useEffect, useState } from 'react';
import {
    Users, Search, Filter, Shield, ShieldCheck,
    UserCircle, Phone, Calendar, MoreVertical,
    CheckCircle2, XCircle, Activity, Mail,
    SearchX, Loader2
} from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const roles = [
        { value: 'ALL', label: 'Бүх хэрэглэгчид' },
        { value: 'CUSTOMER', label: 'Хэрэглэгч' },
        { value: 'CARGO_ADMIN', label: 'Карго Админ' },
        { value: 'SUPER_ADMIN', label: 'Супер Админ' },
        { value: 'STAFF_CHINA', label: 'Хятад Ажилтан' },
        { value: 'STAFF_MONGOLIA', label: 'Монгол Ажилтан' },
    ];

    useEffect(() => { loadUsers(); }, [roleFilter, page]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/users', {
                params: {
                    role: roleFilter !== 'ALL' ? roleFilter : undefined,
                    search: search || undefined,
                    page,
                    limit: 15
                }
            });
            setUsers(data.data.users);
            setTotal(data.data.total);
        } catch (err) {
            toast.error('Хэрэглэгчийн мэдээлэл авахад алдаа гарлаа');
        } finally { setLoading(false); }
    };

    const toggleStatus = async (user: any) => {
        try {
            await api.patch(`/users/${user.id}`, { isActive: !user.isActive });
            toast.success('Төлөв солигдлоо');
            loadUsers();
        } catch (err) {
            toast.error('Алдаа гарлаа');
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8 space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-200">
                                <Users className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Хэрэглэгчийн удирдлага</h1>
                                <p className="text-slate-500 font-medium">Системийн бүх бүртгэлтэй хэрэглэгчид</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <div className="lg:col-span-8">
                        <div className="bg-white p-2 rounded-[24px] border border-slate-200/60 shadow-sm flex flex-col md:flex-row gap-2">
                            <div className="flex-1 relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && loadUsers()}
                                    placeholder="Утас, нэрээр хайх..."
                                    className="w-full pl-11 pr-4 py-3.5 bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-900 placeholder:text-slate-400"
                                />
                                <button
                                    onClick={loadUsers}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-600 transition-all"
                                >
                                    Хайх
                                </button>
                            </div>
                            <div className="h-10 w-px bg-slate-100 hidden md:block self-center" />
                            <div className="flex bg-slate-50 p-1 rounded-xl overflow-x-auto no-scrollbar">
                                {roles.slice(0, 4).map((role) => (
                                    <button
                                        key={role.value}
                                        onClick={() => { setRoleFilter(role.value); setPage(1); }}
                                        className={`px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap
                                            ${roleFilter === role.value ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {role.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-4">
                        <div className="bg-white p-4 rounded-[24px] border border-slate-200/60 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <Activity className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Нийт</div>
                                    <div className="text-xl font-black text-slate-900">{total}</div>
                                </div>
                            </div>
                            <div className="flex -space-x-2">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center">
                                        <UserCircle className="w-5 h-5 text-slate-300" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-[32px] border border-slate-200/60 shadow-xl shadow-slate-200/50 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Хэрэглэгч</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Холбоо барих</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Эрх</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Төлөв</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Бүртгүүлсэн</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Үйлдэл</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={6} className="px-8 py-10 outline-none">
                                                <div className="h-8 bg-slate-50 rounded-xl w-full" />
                                            </td>
                                        </tr>
                                    ))
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center opacity-30">
                                                <SearchX className="w-16 h-16 mb-4" />
                                                <p className="font-bold">Хэрэглэгч олдсонгүй</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : users.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                                    <UserCircle className="w-7 h-7" />
                                                </div>
                                                <div>
                                                    <div className="font-black text-slate-900 leading-tight">
                                                        {user.firstName} {user.lastName}
                                                    </div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">ID: {user.id.slice(0, 8)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                                    <Phone className="w-3.5 h-3.5 text-slate-300" />
                                                    {user.phone}
                                                </div>
                                                {user.email && (
                                                    <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
                                                        <Mail className="w-3 h-3 text-slate-200" />
                                                        {user.email}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <RoleBadge role={user.role} />
                                        </td>
                                        <td className="px-8 py-5">
                                            <button
                                                onClick={() => toggleStatus(user)}
                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all
                                                    ${user.isActive
                                                        ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                                        : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                                            >
                                                <div className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">
                                                    {user.isActive ? 'Идэвхтэй' : 'Идэвхгүй'}
                                                </span>
                                            </button>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                                                <Calendar className="w-3.5 h-3.5 text-slate-300" />
                                                {new Date(user.createdAt).toLocaleDateString('mn-MN')}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-200 transition-all">
                                                <MoreVertical className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-[11px] font-bold text-slate-400">
                            Нийт {total} хэрэглэгчээс {(page - 1) * 15 + 1} - {Math.min(page * 15, total)} харуулж байна
                        </p>
                        <div className="flex gap-2">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm"
                            >
                                Өмнөх
                            </button>
                            <button
                                disabled={page * 15 >= total}
                                onClick={() => setPage(p => p + 1)}
                                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-indigo-600 disabled:opacity-50 transition-all shadow-lg shadow-slate-200"
                            >
                                Дараах
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function RoleBadge({ role }: { role: string }) {
    const config: any = {
        SUPER_ADMIN: { label: 'Супер Админ', bg: 'bg-rose-100 text-rose-700 border-rose-200', icon: ShieldCheck },
        CARGO_ADMIN: { label: 'Карго Админ', bg: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: Shield },
        STAFF_CHINA: { label: 'Хятад Ажилтан', bg: 'bg-amber-100 text-amber-700 border-amber-200', icon: UserCircle },
        STAFF_MONGOLIA: { label: 'Монгол Ажилтан', bg: 'bg-blue-100 text-blue-700 border-blue-200', icon: UserCircle },
        CUSTOMER: { label: 'Хэрэглэгч', bg: 'bg-slate-100 text-slate-600 border-slate-200', icon: UserCircle },
    };
    const c = config[role] || config.CUSTOMER;
    const Icon = c.icon;

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest ${c.bg}`}>
            <Icon className="w-3.5 h-3.5" />
            {c.label}
        </div>
    );
}
