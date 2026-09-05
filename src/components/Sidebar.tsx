import React, { useState, useEffect } from 'react';
import {
  X,
  LayoutDashboard,
  ListOrdered,
  FileBarChart,
  ArrowLeftRight,
  Wallet,
  ShoppingCart,
  ShieldCheck,
  Store,
  Printer,
  ChevronDown,
  LogOut,
  FileSpreadsheet,
  Users,
  Database,
  Lock,
  UserCheck,
  Package,
  TrendingUp,
  Sparkles,
  Info,
  History,
  Receipt,
} from 'lucide-react';
import { ActiveTab, AgentProfile, UserRole } from '../types';
import { AuthUser } from './views/LoginView';
import { useAppVersion } from '../utils/versionManager';
import { ModalVersionInfo } from './modals/ModalVersionInfo';
import { PWAInstallButton } from './common/PWAInstallButton';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  onClose: () => void;
  profile: AgentProfile;
  trxCount: number;
  posSalesCount?: number;
  userCount?: number;
  memberCount?: number;
  currentUser?: AuthUser | null;
  currentRole?: UserRole;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  onClose,
  profile,
  trxCount,
  posSalesCount = 0,
  userCount = 0,
  memberCount = 0,
  currentUser,
  currentRole = 'Admin',
  onLogout,
}) => {
  const { version, enterpriseVersion } = useAppVersion();
  const [isVersionModalOpen, setIsVersionModalOpen] = useState<boolean>(false);
  const effectiveRole: UserRole = currentUser?.role || currentRole;
  const isAdmin = effectiveRole === 'Admin';

  // State untuk 3 Kelompok Dropdown Accordion
  const [openGroups, setOpenGroups] = useState<{ [key: string]: boolean }>({
    transaksi: true,
    logistik: true,
    keuangan: true,
  });

  // Otomatis buka kelompok jika tab aktif berada di dalam kelompok tersebut
  useEffect(() => {
    const transaksiTabs: ActiveTab[] = [
      'transaksi',
      'riwayat-transaksi-agen',
      'kasir-fisik',
      'riwayat-transaksi-pos',
      'member-pelanggan',
    ];
    const logistikTabs: ActiveTab[] = [
      'stok-barang',
      'laporan-penjualan-fisik',
      'laporan-detail',
    ];
    const keuanganTabs: ActiveTab[] = [
      'setting-printer',
      'arus-kas',
      'akun-kas',
      'hak-akses',
      'profil-agen',
      'database-spreadsheet',
      'backup-reset',
      'tentang-sistem',
    ];

    if (transaksiTabs.includes(activeTab)) {
      setOpenGroups((prev) => (prev.transaksi ? prev : { ...prev, transaksi: true }));
    } else if (logistikTabs.includes(activeTab)) {
      setOpenGroups((prev) => (prev.logistik ? prev : { ...prev, logistik: true }));
    } else if (keuanganTabs.includes(activeTab)) {
      setOpenGroups((prev) => (prev.keuangan ? prev : { ...prev, keuangan: true }));
    }
  }, [activeTab]);

  const toggleGroup = (groupKey: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  // Helper untuk styling item menu aktif vs non-aktif
  const getItemClass = (isActive: boolean) => {
    if (isActive) {
      return 'bg-white/20 text-white font-bold shadow-sm backdrop-blur-xs border border-white/25';
    }
    return 'text-blue-100/85 hover:text-white hover:bg-white/10 font-medium border border-transparent';
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-30 lg:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        id="sidebar"
        className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-gradient-to-b from-[#00264d] via-[#003366] to-[#001f3f] text-white transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-200 ease-in-out flex flex-col justify-between shadow-2xl lg:shadow-none select-none border-r border-blue-900/60`}
      >
        <div className="p-5 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {/* Header Atas: Brand Identity & Logo */}
          <div className="flex items-center justify-between pb-4 border-b border-blue-800/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white p-1 shadow-md shrink-0 flex items-center justify-center overflow-hidden border border-white/20 ring-2 ring-blue-400/20">
                <img
                  src={profile.logoUrl || '/logo.png'}
                  alt="Mini ATM Logo"
                  className="w-full h-full object-contain rounded-lg"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="overflow-hidden">
                <h1 className="font-extrabold text-sm leading-tight text-white tracking-tight truncate">
                  {profile.storeName || 'MINI ATM LINK BERSAMA'}
                </h1>
                <p className="text-[10px] text-blue-200 font-medium truncate mt-0.5">
                  Agen Link Bersama & Mini ATM
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden text-blue-200 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Role Badge Banner */}
          <div
            className={`p-3 rounded-2xl border flex items-center justify-between shadow-xs ${
              isAdmin
                ? 'bg-blue-900/60 border-blue-700/50 text-blue-100'
                : 'bg-amber-950/60 border-amber-800/50 text-amber-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`p-1.5 rounded-xl ${
                  isAdmin ? 'bg-blue-800 text-blue-200' : 'bg-amber-900 text-amber-300'
                }`}
              >
                {isAdmin ? (
                  <ShieldCheck className="w-4 h-4 text-blue-300 shrink-0" />
                ) : (
                  <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
                )}
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-widest block font-bold text-blue-300/80">
                  Peran Akun
                </span>
                <span className="font-extrabold text-xs tracking-tight text-white">
                  {isAdmin ? 'ADMINISTRATOR (Owner)' : 'KASIR OPERATOR'}
                </span>
              </div>
            </div>
            <span
              className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow-2xs border ${
                isAdmin
                  ? 'bg-blue-600/90 text-white border-blue-400/40'
                  : 'bg-amber-600/90 text-white border-amber-400/40'
              }`}
            >
              {isAdmin ? 'Full' : 'Shift'}
            </span>
          </div>

          {/* Navigation Links Area */}
          <nav className="space-y-4 text-xs">
            {/* 1. Menu Mandiri: Dashboard Insights (Paling atas sebelum dropdown) */}
            {isAdmin && (
              <div className="pb-1">
                <button
                  onClick={() => handleSelectTab('dashboard')}
                  id="nav-dashboard"
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-left cursor-pointer group ${getItemClass(
                    activeTab === 'dashboard'
                  )}`}
                >
                  <div
                    className={`p-1 rounded-lg ${
                      activeTab === 'dashboard' ? 'bg-sky-400/20 text-sky-300' : 'text-blue-300 group-hover:text-white'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                  </div>
                  <span className="flex-1 tracking-tight">Dashboard Insights</span>
                  {activeTab === 'dashboard' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                  )}
                </button>
              </div>
            )}

            {/* ========================================================================= */}
            {/* KELOMPOK 1: TRANSAKSI & POS */}
            {/* ========================================================================= */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => toggleGroup('transaksi')}
                id="group-header-transaksi"
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-blue-200/90 hover:text-white hover:bg-white/5 transition-all text-left cursor-pointer group"
              >
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-200 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                  <span>{isAdmin ? 'TRANSAKSI & POS' : 'MENU KASIR'}</span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-blue-300 transition-transform duration-300 ease-in-out ${
                    openGroups.transaksi ? 'rotate-180 text-white' : 'rotate-0'
                  }`}
                />
              </button>

              {/* Accordion Content dengan smooth CSS Grid sliding */}
              <div
                className={`grid transition-all duration-300 ease-in-out overflow-hidden ${
                  openGroups.transaksi
                    ? 'grid-rows-[1fr] opacity-100 mt-1.5'
                    : 'grid-rows-[0fr] opacity-0 mt-0 pointer-events-none'
                }`}
              >
                <div className="min-h-0 space-y-1.5 pl-1.5 overflow-hidden">
                  {/* Daftar Transaksi Agen */}
                  <button
                    onClick={() => handleSelectTab('transaksi')}
                    id="nav-transaksi"
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left cursor-pointer group ${getItemClass(
                      activeTab === 'transaksi'
                    )}`}
                  >
                    <ListOrdered
                      className={`w-4 h-4 shrink-0 ${
                        activeTab === 'transaksi' ? 'text-sky-300' : 'text-blue-300 group-hover:text-white'
                      }`}
                    />
                    <span className="flex-1 truncate">Daftar Transaksi Agen</span>
                    <span className="rounded-md text-[10px] font-bold px-2 py-0.5 border bg-blue-950/80 text-blue-200 border-blue-700/60 font-mono shadow-2xs">
                      {trxCount}
                    </span>
                  </button>

                  {/* Riwayat Transaksi Agen */}
                  <button
                    onClick={() => handleSelectTab('riwayat-transaksi-agen')}
                    id="nav-riwayat-transaksi-agen"
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left cursor-pointer group ${getItemClass(
                      activeTab === 'riwayat-transaksi-agen'
                    )}`}
                  >
                    <History
                      className={`w-4 h-4 shrink-0 ${
                        activeTab === 'riwayat-transaksi-agen' ? 'text-cyan-300' : 'text-cyan-400 group-hover:text-white'
                      }`}
                    />
                    <span className="flex-1 truncate">Riwayat Transaksi Agen</span>
                    <span className="rounded-md text-[10px] font-bold px-2 py-0.5 border bg-cyan-950/80 text-cyan-300 border-cyan-700/60 font-mono shadow-2xs">
                      {trxCount}
                    </span>
                  </button>

                  {/* Kasir POS (Jual Barang) */}
                  <button
                    onClick={() => handleSelectTab('kasir-fisik')}
                    id="nav-kasir-fisik"
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left cursor-pointer group ${getItemClass(
                      activeTab === 'kasir-fisik'
                    )}`}
                  >
                    <ShoppingCart
                      className={`w-4 h-4 shrink-0 ${
                        activeTab === 'kasir-fisik' ? 'text-sky-300' : 'text-blue-300 group-hover:text-white'
                      }`}
                    />
                    <span className="flex-1 truncate">Kasir POS (Jual Barang)</span>
                  </button>

                  {/* Riwayat Transaksi Kasir POS */}
                  <button
                    onClick={() => handleSelectTab('riwayat-transaksi-pos')}
                    id="nav-riwayat-transaksi-pos"
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left cursor-pointer group ${getItemClass(
                      activeTab === 'riwayat-transaksi-pos'
                    )}`}
                  >
                    <Receipt
                      className={`w-4 h-4 shrink-0 ${
                        activeTab === 'riwayat-transaksi-pos' ? 'text-emerald-300' : 'text-emerald-400 group-hover:text-white'
                      }`}
                    />
                    <span className="flex-1 truncate">Riwayat Transaksi Kasir POS</span>
                    <span className="rounded-md text-[10px] font-bold px-2 py-0.5 border bg-emerald-950/80 text-emerald-300 border-emerald-700/60 font-mono shadow-2xs">
                      {posSalesCount}
                    </span>
                  </button>

                  {/* Member & Kartu VIP (+1 Poin) */}
                  <button
                    onClick={() => handleSelectTab('member-pelanggan')}
                    id="nav-member-pelanggan"
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left cursor-pointer group ${getItemClass(
                      activeTab === 'member-pelanggan'
                    )}`}
                  >
                    <UserCheck
                      className={`w-4 h-4 shrink-0 ${
                        activeTab === 'member-pelanggan' ? 'text-amber-300' : 'text-amber-400 group-hover:text-amber-300'
                      }`}
                    />
                    <span className="flex-1 truncate">Member & Kartu VIP</span>
                    <span className="rounded-md text-[10px] font-black px-2 py-0.5 border bg-amber-400/25 text-amber-300 border-amber-400/40 shadow-2xs">
                      +1 Poin
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* KELOMPOK 2: LOGISTIK & LAPORAN */}
            {/* ========================================================================= */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => toggleGroup('logistik')}
                id="group-header-logistik"
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-blue-200/90 hover:text-white hover:bg-white/5 transition-all text-left cursor-pointer group"
              >
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-200 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>LOGISTIK & LAPORAN</span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-blue-300 transition-transform duration-300 ease-in-out ${
                    openGroups.logistik ? 'rotate-180 text-white' : 'rotate-0'
                  }`}
                />
              </button>

              {/* Accordion Content dengan smooth CSS Grid sliding */}
              <div
                className={`grid transition-all duration-300 ease-in-out overflow-hidden ${
                  openGroups.logistik
                    ? 'grid-rows-[1fr] opacity-100 mt-1.5'
                    : 'grid-rows-[0fr] opacity-0 mt-0 pointer-events-none'
                }`}
              >
                <div className="min-h-0 space-y-1.5 pl-1.5 overflow-hidden">
                  {/* Stok Barang Fisik (Inventory) */}
                  <button
                    onClick={() => handleSelectTab('stok-barang')}
                    id="nav-stok-barang"
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left cursor-pointer group ${getItemClass(
                      activeTab === 'stok-barang'
                    )}`}
                  >
                    <Package
                      className={`w-4 h-4 shrink-0 ${
                        activeTab === 'stok-barang' ? 'text-amber-300' : 'text-amber-400 group-hover:text-white'
                      }`}
                    />
                    <span className="flex-1 truncate">Stok Barang Fisik</span>
                    <span className="rounded-md text-[10px] font-bold px-2 py-0.5 border bg-emerald-500/25 text-emerald-300 border-emerald-400/40 shadow-2xs">
                      Inventory
                    </span>
                  </button>

                  {/* Laporan Penjualan & Laba (POS) */}
                  <button
                    onClick={() => handleSelectTab('laporan-penjualan-fisik')}
                    id="nav-laporan-penjualan-fisik"
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left cursor-pointer group ${getItemClass(
                      activeTab === 'laporan-penjualan-fisik'
                    )}`}
                  >
                    <TrendingUp
                      className={`w-4 h-4 shrink-0 ${
                        activeTab === 'laporan-penjualan-fisik' ? 'text-emerald-300' : 'text-emerald-400 group-hover:text-white'
                      }`}
                    />
                    <span className="flex-1 truncate">Laporan Penjualan & Laba</span>
                    <span className="rounded-md text-[10px] font-bold px-2 py-0.5 border bg-purple-500/25 text-purple-200 border-purple-400/40 shadow-2xs">
                      POS
                    </span>
                  </button>

                  {/* Laporan Detail & Grafik */}
                  <button
                    onClick={() => handleSelectTab('laporan-detail')}
                    id="nav-laporan-detail"
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left cursor-pointer group ${getItemClass(
                      activeTab === 'laporan-detail'
                    )}`}
                  >
                    <FileBarChart
                      className={`w-4 h-4 shrink-0 ${
                        activeTab === 'laporan-detail' ? 'text-sky-300' : 'text-blue-300 group-hover:text-white'
                      }`}
                    />
                    <span className="flex-1 truncate">
                      {isAdmin ? 'Laporan Detail & Grafik' : 'Laporan Transaksi Kasir'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* KELOMPOK 3: KEUANGAN & PENGATURAN */}
            {/* ========================================================================= */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => toggleGroup('keuangan')}
                id="group-header-keuangan"
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-blue-200/90 hover:text-white hover:bg-white/5 transition-all text-left cursor-pointer group"
              >
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-200 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>KEUANGAN & PENGATURAN</span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-blue-300 transition-transform duration-300 ease-in-out ${
                    openGroups.keuangan ? 'rotate-180 text-white' : 'rotate-0'
                  }`}
                />
              </button>

              {/* Accordion Content dengan smooth CSS Grid sliding */}
              <div
                className={`grid transition-all duration-300 ease-in-out overflow-hidden ${
                  openGroups.keuangan
                    ? 'grid-rows-[1fr] opacity-100 mt-1.5'
                    : 'grid-rows-[0fr] opacity-0 mt-0 pointer-events-none'
                }`}
              >
                <div className="min-h-0 space-y-1.5 pl-1.5 overflow-hidden">
                  {/* Setting Printer Thermal (Cepat) */}
                  <button
                    onClick={() => handleSelectTab('setting-printer')}
                    id="nav-setting-printer"
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left cursor-pointer group ${getItemClass(
                      activeTab === 'setting-printer'
                    )}`}
                  >
                    <Printer
                      className={`w-4 h-4 shrink-0 ${
                        activeTab === 'setting-printer' ? 'text-cyan-300' : 'text-cyan-400 group-hover:text-white'
                      }`}
                    />
                    <span className="flex-1 truncate">Setting Printer Thermal</span>
                    <span className="rounded-md text-[10px] font-bold px-2 py-0.5 border bg-cyan-500/25 text-cyan-200 border-cyan-400/40 shadow-2xs">
                      Cepat
                    </span>
                  </button>

                  {/* Arus Kas & Mutasi (ADMIN) */}
                  {isAdmin && (
                    <button
                      onClick={() => handleSelectTab('arus-kas')}
                      id="nav-arus-kas"
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left cursor-pointer group ${getItemClass(
                        activeTab === 'arus-kas'
                      )}`}
                    >
                      <ArrowLeftRight
                        className={`w-4 h-4 shrink-0 ${
                          activeTab === 'arus-kas' ? 'text-rose-300' : 'text-blue-300 group-hover:text-white'
                        }`}
                      />
                      <span className="flex-1 truncate">Arus Kas & Mutasi</span>
                      <span className="rounded-md text-[9px] font-extrabold px-1.5 py-0.5 border bg-rose-500/25 text-rose-200 border-rose-400/40 uppercase tracking-wider shadow-2xs">
                        ADMIN
                      </span>
                    </button>
                  )}

                  {/* Akun Kas / Rekening */}
                  {isAdmin && (
                    <button
                      onClick={() => handleSelectTab('akun-kas')}
                      id="nav-akun-kas"
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left cursor-pointer group ${getItemClass(
                        activeTab === 'akun-kas'
                      )}`}
                    >
                      <Wallet
                        className={`w-4 h-4 shrink-0 ${
                          activeTab === 'akun-kas' ? 'text-sky-300' : 'text-blue-300 group-hover:text-white'
                        }`}
                      />
                      <span className="flex-1 truncate">Akun Kas / Rekening</span>
                    </button>
                  )}

                  {/* Akun Admin & Kasir */}
                  {isAdmin && (
                    <button
                      onClick={() => handleSelectTab('hak-akses')}
                      id="nav-hak-akses"
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left cursor-pointer group ${getItemClass(
                        activeTab === 'hak-akses'
                      )}`}
                    >
                      <Users
                        className={`w-4 h-4 shrink-0 ${
                          activeTab === 'hak-akses' ? 'text-sky-300' : 'text-blue-300 group-hover:text-white'
                        }`}
                      />
                      <span className="flex-1 truncate">Akun Admin & Kasir</span>
                      {userCount > 0 && (
                        <span className="rounded-md text-[10px] font-bold px-2 py-0.5 border bg-blue-950/80 text-blue-200 border-blue-700/60 font-mono shadow-2xs">
                          {userCount}
                        </span>
                      )}
                    </button>
                  )}

                  {/* Setting Profil Agen */}
                  {isAdmin && (
                    <button
                      onClick={() => handleSelectTab('profil-agen')}
                      id="nav-profil-agen"
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left cursor-pointer group ${getItemClass(
                        activeTab === 'profil-agen'
                      )}`}
                    >
                      <Store
                        className={`w-4 h-4 shrink-0 ${
                          activeTab === 'profil-agen' ? 'text-sky-300' : 'text-blue-300 group-hover:text-white'
                        }`}
                      />
                      <span className="flex-1 truncate">Setting Profil Agen</span>
                    </button>
                  )}

                  {/* Database Spreadsheet */}
                  {isAdmin && (
                    <button
                      onClick={() => handleSelectTab('database-spreadsheet')}
                      id="nav-database-spreadsheet"
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left cursor-pointer group ${getItemClass(
                        activeTab === 'database-spreadsheet'
                      )}`}
                    >
                      <FileSpreadsheet
                        className={`w-4 h-4 shrink-0 ${
                          activeTab === 'database-spreadsheet' ? 'text-emerald-300' : 'text-emerald-400 group-hover:text-white'
                        }`}
                      />
                      <span className="flex-1 truncate">Database Spreadsheet</span>
                      <span className="rounded-md text-[9px] font-bold px-1.5 py-0.5 border bg-emerald-950/80 text-emerald-300 border-emerald-600/50 shadow-2xs">
                        GAS
                      </span>
                    </button>
                  )}

                  {/* Backup & Reset Data */}
                  {isAdmin && (
                    <button
                      onClick={() => handleSelectTab('backup-reset')}
                      id="nav-backup-reset"
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left cursor-pointer group ${getItemClass(
                        activeTab === 'backup-reset'
                      )}`}
                    >
                      <Database
                        className={`w-4 h-4 shrink-0 ${
                          activeTab === 'backup-reset' ? 'text-amber-300' : 'text-amber-400 group-hover:text-white'
                        }`}
                      />
                      <span className="flex-1 truncate">Backup & Reset Data</span>
                    </button>
                  )}

                  {/* Tentang & Panduan Sistem */}
                  <button
                    onClick={() => handleSelectTab('tentang-sistem')}
                    id="nav-tentang-sistem"
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left cursor-pointer group ${getItemClass(
                      activeTab === 'tentang-sistem'
                    )}`}
                  >
                    <Info
                      className={`w-4 h-4 shrink-0 ${
                        activeTab === 'tentang-sistem' ? 'text-sky-300' : 'text-sky-400 group-hover:text-white'
                      }`}
                    />
                    <span className="flex-1 truncate">Tentang & Panduan Sistem</span>
                    <span className="rounded-md text-[9px] font-bold px-1.5 py-0.5 border bg-sky-500/20 text-sky-300 border-sky-400/30 shadow-2xs">
                      microdata2r
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* FOR KASIR: Information notice regarding Admin features */}
            {!isAdmin && (
              <div className="pt-2">
                <div className="bg-blue-950/70 border border-blue-800/40 rounded-2xl p-3.5 space-y-2 text-[11px] text-blue-200/80 shadow-xs">
                  <div className="flex items-center gap-2 font-bold text-blue-200">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Fitur Terkunci</span>
                  </div>
                  <p className="text-[10px] leading-relaxed text-slate-300">
                    Menu Dashboard analitik, Rekening, Arus Kas, Manajemen Akun, dan Database dikelola oleh <strong>Admin/Owner</strong>.
                  </p>
                </div>
              </div>
            )}
          </nav>
        </div>

        {/* Footer Sidebar: Status & Active User with Logout */}
        <div className="p-4 border-t border-blue-900/80 bg-[#001c38]/90 space-y-3">
          {currentUser && (
            <div className="flex items-center justify-between bg-blue-950/70 p-2.5 rounded-xl border border-blue-800/40 shadow-xs">
              <div className="overflow-hidden pr-2">
                <span className="text-[11px] font-bold text-white block truncate leading-tight">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-blue-300 font-medium">
                  Role: {currentUser.role}
                </span>
              </div>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  title="Keluar dari sesi"
                  className="p-1.5 text-rose-300 hover:text-rose-100 hover:bg-rose-900/40 rounded-lg transition-colors shrink-0 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* PWA Install Button (Desktop, Tablet, Mobile) */}
          <div className="pt-0.5">
            <PWAInstallButton variant="sidebar" />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-500/50"></span>
              <span className="text-[11px] text-blue-200 font-medium">Sistem Online</span>
            </div>
            <button
              type="button"
              onClick={() => setIsVersionModalOpen(true)}
              title={`${enterpriseVersion} - Klik untuk melihat info & log pembaruan`}
              className="text-[10px] text-blue-300 hover:text-white font-mono bg-blue-950/80 hover:bg-blue-900/80 px-2 py-0.5 rounded-md border border-blue-800/60 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-2.5 h-2.5 text-sky-400" />
              <span>{version}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Modal Informasi Versi & Auto-Increment Log */}
      <ModalVersionInfo
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        onNavigateToAbout={() => {
          setIsVersionModalOpen(false);
          handleSelectTab('tentang-sistem');
        }}
      />
    </>
  );
};
