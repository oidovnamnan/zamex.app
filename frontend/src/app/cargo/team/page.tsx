'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/store';
import { api } from '@/lib/api';
import {
    Users, Shield, Plus, Trash2, Phone, Search,
    Crown, Edit2, X, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface RoleTemplate {
    id: string;
    name: string;
    permissions: string[];
    _count?: { users: number };
}

interface StaffMember {
    id: string;
    phone: string;
    firstName: string;
    lastName: string;
    role: string;
    roleTemplate?: RoleTemplate;
    isActive: boolean;
}

const AVAILABLE_PERMISSIONS = [
    { key: 'CAN_SCAN', label: 'Бараа хүлээн авах', desc: 'Эрээн агуулахад барааг сканнердаж бүртгэх', icon: '📦' },
    { key: 'CAN_MEASURE', label: 'Хэмжилт хийх', desc: 'Барааны овор хэмжээ, жинг бүртгэж баталгаажуулах', icon: '⚖️' },
    { key: 'CAN_BATCH', label: 'Batch/Ачилт', desc: 'Барааг багцлах, ачих, буулгах үйлдлүүд', icon: '🚛' },
    { key: 'CAN_INVOICE', label: 'Нэхэмжлэх', desc: 'Логистикийн төлбөрийн нэхэмжлэх үүсгэх, удирдах', icon: '💰' },
    { key: 'CAN_PICKUP', label: 'Бараа олголт', desc: 'УБ хотод барааг эзэнд нь хүлээлгэн өгөх', icon: '✅' },
    { key: 'CAN_CUSTOMERS', label: 'Харилцагчид', desc: 'Харилцагчдын мэдээлэл харах, бүртгэх', icon: '👥' },
    { key: 'CAN_STAFF', label: 'Багийн удирдлага', desc: 'Бусад ажилтны эрх, мэдээллийг өөрчлөх', icon: '👔' }
];

export default function TeamPage() {
    const { user } = useAuth();
    const companyId = user?.companyId || user?.company?.id;
    const [activeTab, setActiveTab] = useState<'members' | 'roles'>('members');
    const [members, setMembers] = useState<StaffMember[]>([]);
    const [roles, setRoles] = useState<RoleTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddMember, setShowAddMember] = useState(false);
    const [showAddRole, setShowAddRole] = useState(false);
    const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
    const [editingRole, setEditingRole] = useState<RoleTemplate | null>(null);
    const [newMember, setNewMember] = useState({ phone: '', firstName: '', lastName: '', roleTemplateId: '' });
    const [newRole, setNewRole] = useState({ name: '', permissions: [] as string[] });

    useEffect(() => {
        if (companyId) loadData();
    }, [companyId]);

    const loadData = async () => {
        try {
            const [staffRes, rolesRes] = await Promise.all([
                api.get(`/companies/${companyId}/staff`),
                api.get(`/companies/${companyId}/role-templates`)
            ]);
            setMembers(staffRes.data.data.staff);
            setRoles(rolesRes.data.data.roleTemplates);
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Алдаа гарлаа');
        }
        setLoading(false);
    };

    const handleAddMember = async () => {
        if (!newMember.phone || !newMember.firstName || !newMember.roleTemplateId) {
            toast.error('Бүх талбарыг бөглөнө үү');
            return;
        }
        try {
            await api.post(`/companies/${companyId}/staff`, newMember);
            toast.success('Ажилтан амжилттай нэмэгдлээ');
            setShowAddMember(false);
            setNewMember({ phone: '', firstName: '', lastName: '', roleTemplateId: '' });
            loadData();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Алдаа гарлаа');
        }
    };

    const handleUpdateStaff = async () => {
        if (!editingStaff) return;
        try {
            await api.patch(`/companies/${companyId}/staff/${editingStaff.id}`, {
                roleTemplateId: editingStaff.roleTemplate?.id
            });
            toast.success('Амжилттай шинэчлэгдлээ');
            setEditingStaff(null);
            loadData();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Алдаа гарлаа');
        }
    };

    const handleCreateRole = async () => {
        if (!newRole.name || newRole.permissions.length === 0) {
            toast.error('Нэр болон эрхүүдийг сонгоно уу');
            return;
        }
        try {
            await api.post(`/companies/${companyId}/role-templates`, newRole);
            toast.success('Албан тушаал үүслээ');
            setShowAddRole(false);
            setNewRole({ name: '', permissions: [] });
            loadData();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Алдаа гарлаа');
        }
    };

    const handleUpdateRole = async () => {
        if (!editingRole) return;
        try {
            await api.patch(`/companies/${companyId}/role-templates/${editingRole.id}`, {
                name: editingRole.name,
                permissions: editingRole.permissions
            });
            toast.success('Албан тушаал шинэчлэгдлээ');
            setEditingRole(null);
            loadData();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Алдаа гарлаа');
        }
    };

    const handleDeleteRole = async (id: string) => {
        if (!confirm('Устгах уу?')) return;
        try {
            await api.delete(`/companies/${companyId}/role-templates/${id}`);
            toast.success('Устгагдлаа');
            loadData();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Алдаа гарлаа');
        }
    };

    const handleEditClick = (member: StaffMember) => {
        setEditingStaff(member);
    };

    const togglePermission = (perm: string) => {
        if (editingRole) {
            setEditingRole({
                ...editingRole,
                permissions: editingRole.permissions.includes(perm)
                    ? editingRole.permissions.filter(p => p !== perm)
                    : [...editingRole.permissions, perm]
            });
        } else {
            setNewRole({
                ...newRole,
                permissions: newRole.permissions.includes(perm)
                    ? newRole.permissions.filter(p => p !== perm)
                    : [...newRole.permissions, perm]
            });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
                <div className="relative">
                    <div className="w-12 h-12 border-4 border-[#283480]/20 border-t-[#283480] rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pb-20">
            {/* Compact Header */}
            <div className="bg-gradient-to-br from-[#283480] via-[#1a235c] to-[#0f1333] px-4 pt-6 pb-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight uppercase">
                            Багийн удирдлага
                        </h1>
                        <p className="text-blue-200 text-xs font-medium mt-0.5">
                            {members.length} ажилтан • {roles.length} албан тушаал
                        </p>
                    </div>
                    <div className="w-10 h-10 bg-white/10 backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/20">
                        <Users className="w-5 h-5 text-white" />
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 bg-white/10 backdrop-blur-xl p-1 rounded-lg border border-white/20">
                    <button
                        onClick={() => setActiveTab('members')}
                        className={`flex-1 py-2 rounded-md font-black text-xs uppercase tracking-wider transition-all ${activeTab === 'members'
                                ? 'bg-white text-[#283480] shadow-lg'
                                : 'text-white/60'
                            }`}
                    >
                        Ажилтнууд
                    </button>
                    <button
                        onClick={() => setActiveTab('roles')}
                        className={`flex-1 py-2 rounded-md font-black text-xs uppercase tracking-wider transition-all ${activeTab === 'roles'
                                ? 'bg-white text-[#283480] shadow-lg'
                                : 'text-white/60'
                            }`}
                    >
                        Албан тушаал
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="px-3 pt-3">
                <AnimatePresence mode="wait">
                    {activeTab === 'members' ? (
                        <motion.div
                            key="members"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {/* Search */}
                            <div className="relative mb-3">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Хайх..."
                                    className="w-full h-10 pl-10 pr-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-[#283480]/20 transition-all"
                                />
                            </div>

                            {/* List */}
                            <div className="space-y-2">
                                {members.map((member, index) => (
                                    <motion.div
                                        key={member.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.02 }}
                                        onClick={() => handleEditClick(member)}
                                        className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm active:scale-98 transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Avatar */}
                                            <div className="relative flex-shrink-0">
                                                <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-[#283480] to-[#1a235c] flex items-center justify-center text-white font-black text-sm shadow-md">
                                                    {member.firstName?.[0]?.toUpperCase() || 'U'}
                                                </div>
                                                {member.isActive && (
                                                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                                                )}
                                                {member.roleTemplate?.name.includes('Админ') && (
                                                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-md flex items-center justify-center">
                                                        <Crown className="w-2.5 h-2.5 text-white" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <h3 className="text-sm font-black text-slate-900 truncate">
                                                        {member.firstName} {member.lastName}
                                                    </h3>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#283480]/5 rounded text-[10px] font-black text-[#283480] uppercase">
                                                        <Shield className="w-2.5 h-2.5" />
                                                        {member.roleTemplate?.name || member.role}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                                        <Phone className="w-2.5 h-2.5" />
                                                        {member.phone}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Arrow */}
                                            <Edit2 className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="roles"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-2"
                        >
                            {roles.map((role, index) => (
                                <motion.div
                                    key={role.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.02 }}
                                    className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                                                <Shield className="w-4 h-4 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black text-slate-900">{role.name}</h3>
                                                <p className="text-[10px] text-slate-500 font-medium">
                                                    {role._count?.users || 0} ажилтан
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteRole(role.id)}
                                            className="w-7 h-7 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>

                                    <div className="flex flex-wrap gap-1 mb-2">
                                        {role.permissions.slice(0, 3).map(perm => {
                                            const permData = AVAILABLE_PERMISSIONS.find(p => p.key === perm);
                                            return (
                                                <span
                                                    key={perm}
                                                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 rounded text-[9px] font-bold text-emerald-700 border border-emerald-100"
                                                >
                                                    {permData?.icon} {permData?.label}
                                                </span>
                                            );
                                        })}
                                        {role.permissions.length > 3 && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-500">
                                                +{role.permissions.length - 3}
                                            </span>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => setEditingRole(role)}
                                        className="w-full h-7 rounded-lg bg-slate-50 text-slate-600 font-black text-[9px] uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all flex items-center justify-center gap-1"
                                    >
                                        <Edit2 className="w-3 h-3" />
                                        Засах
                                    </button>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* FAB */}
            <button
                onClick={() => activeTab === 'members' ? setShowAddMember(true) : setShowAddRole(true)}
                className="fixed bottom-5 right-4 w-12 h-12 bg-gradient-to-br from-[#283480] to-[#1a235c] rounded-xl shadow-2xl shadow-blue-900/50 flex items-center justify-center text-white active:scale-95 transition-all z-50"
            >
                <Plus className="w-5 h-5" />
            </button>

            {/* Modals - Same as before */}
            <AnimatePresence>
                {showAddMember && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end"
                        onClick={() => setShowAddMember(false)}
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full bg-white rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-black text-slate-900">Ажилтан нэмэх</h2>
                                <button
                                    onClick={() => setShowAddMember(false)}
                                    className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all"
                                >
                                    <X className="w-4 h-4 text-slate-600" />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                                        Утасны дугаар
                                    </label>
                                    <input
                                        type="tel"
                                        value={newMember.phone}
                                        onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                                        placeholder="99001122"
                                        className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#283480]/20 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                                        Нэр
                                    </label>
                                    <input
                                        type="text"
                                        value={newMember.firstName}
                                        onChange={(e) => setNewMember({ ...newMember, firstName: e.target.value })}
                                        placeholder="Болд"
                                        className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#283480]/20 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                                        Овог
                                    </label>
                                    <input
                                        type="text"
                                        value={newMember.lastName}
                                        onChange={(e) => setNewMember({ ...newMember, lastName: e.target.value })}
                                        placeholder="Дорж"
                                        className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#283480]/20 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                                        Албан тушаал
                                    </label>
                                    <select
                                        value={newMember.roleTemplateId}
                                        onChange={(e) => setNewMember({ ...newMember, roleTemplateId: e.target.value })}
                                        className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#283480]/20 transition-all"
                                    >
                                        <option value="">Сонгох...</option>
                                        {roles.map(role => (
                                            <option key={role.id} value={role.id}>{role.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    onClick={handleAddMember}
                                    className="w-full h-12 rounded-xl bg-gradient-to-r from-[#283480] to-[#1a235c] text-white font-black text-sm uppercase tracking-widest hover:shadow-xl transition-all active:scale-95"
                                >
                                    Урилга илгээх
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit Staff Modal */}
            <AnimatePresence>
                {editingStaff && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end"
                        onClick={() => setEditingStaff(null)}
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full bg-white rounded-t-3xl p-6"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-black text-slate-900">Эрх засах</h2>
                                <button
                                    onClick={() => setEditingStaff(null)}
                                    className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all"
                                >
                                    <X className="w-4 h-4 text-slate-600" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#283480] to-[#1a235c] flex items-center justify-center text-white font-black text-lg">
                                        {editingStaff.firstName?.[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-slate-900">
                                            {editingStaff.firstName} {editingStaff.lastName}
                                        </h3>
                                        <p className="text-sm text-slate-500 font-medium">{editingStaff.phone}</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                                        Албан тушаал
                                    </label>
                                    <select
                                        value={editingStaff.roleTemplate?.id || ''}
                                        onChange={(e) => {
                                            const role = roles.find(r => r.id === e.target.value);
                                            setEditingStaff({ ...editingStaff, roleTemplate: role });
                                        }}
                                        className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#283480]/20 transition-all"
                                    >
                                        {roles.map(role => (
                                            <option key={role.id} value={role.id}>{role.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setEditingStaff(null)}
                                        className="flex-1 h-12 rounded-xl bg-slate-100 text-slate-600 font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all"
                                    >
                                        Болих
                                    </button>
                                    <button
                                        onClick={handleUpdateStaff}
                                        className="flex-1 h-12 rounded-xl bg-gradient-to-r from-[#283480] to-[#1a235c] text-white font-black text-sm uppercase tracking-widest hover:shadow-xl transition-all"
                                    >
                                        Хадгалах
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add/Edit Role Modal */}
            <AnimatePresence>
                {(showAddRole || editingRole) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end"
                        onClick={() => { setShowAddRole(false); setEditingRole(null); }}
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full bg-white rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-black text-slate-900">
                                    {editingRole ? 'Албан тушаал засах' : 'Шинэ албан тушаал'}
                                </h2>
                                <button
                                    onClick={() => { setShowAddRole(false); setEditingRole(null); setNewRole({ name: '', permissions: [] }); }}
                                    className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all"
                                >
                                    <X className="w-4 h-4 text-slate-600" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                                        Албан тушаалын нэр
                                    </label>
                                    <input
                                        type="text"
                                        value={editingRole?.name || newRole.name}
                                        onChange={(e) => editingRole
                                            ? setEditingRole({ ...editingRole, name: e.target.value })
                                            : setNewRole({ ...newRole, name: e.target.value })
                                        }
                                        placeholder="Жишээ: Агуулахын ажилтан"
                                        className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#283480]/20 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">
                                        Эрхүүд
                                    </label>
                                    <div className="space-y-2">
                                        {AVAILABLE_PERMISSIONS.map(perm => {
                                            const isSelected = editingRole
                                                ? editingRole.permissions.includes(perm.key)
                                                : newRole.permissions.includes(perm.key);

                                            return (
                                                <button
                                                    key={perm.key}
                                                    onClick={() => togglePermission(perm.key)}
                                                    className={`w-full p-3 rounded-xl border-2 transition-all text-left ${isSelected
                                                            ? 'border-[#283480] bg-[#283480]/5'
                                                            : 'border-slate-200 bg-white'
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-2">
                                                        <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected
                                                                ? 'border-[#283480] bg-[#283480]'
                                                                : 'border-slate-300'
                                                            }`}>
                                                            {isSelected && <Check className="w-3 h-3 text-white" />}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                                <span className="text-base">{perm.icon}</span>
                                                                <span className="font-black text-slate-900 text-sm">
                                                                    {perm.label}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-slate-500 font-medium">
                                                                {perm.desc}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => { setShowAddRole(false); setEditingRole(null); setNewRole({ name: '', permissions: [] }); }}
                                        className="flex-1 h-12 rounded-xl bg-slate-100 text-slate-600 font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all"
                                    >
                                        Болих
                                    </button>
                                    <button
                                        onClick={editingRole ? handleUpdateRole : handleCreateRole}
                                        className="flex-1 h-12 rounded-xl bg-gradient-to-r from-[#283480] to-[#1a235c] text-white font-black text-sm uppercase tracking-widest hover:shadow-xl transition-all"
                                    >
                                        {editingRole ? 'Хадгалах' : 'Үүсгэх'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
