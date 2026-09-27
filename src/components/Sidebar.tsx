import React, { useState } from 'react';
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
  LogOut,
  FileSpreadsheet,
  Users,
  Database,
  UserCheck,
  Package,
  TrendingUp,
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
  const { version } = useAppVersion();
  const [isVersionModalOpen, setIsVersionModalOpen] = useState<boolean>(false);
  const effectiveRole: UserRole = currentUser?.role || currentRole;
  const isAdmin = effectiveRole === 'Admin';

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const getItemClass = (isActive: boolean) => {
    if (isActive) {
      return 'bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-sm shadow-orange-500/25';
    }
    return 'text-slate-700 hover:text-orange-950 hover:bg-orange-50/80 font-medium transition-colors';
  };

  const getIconClass = (isActive: boolean) => {
    if (isActive) {
      return 'text-white';
    }
    return 'text-slate-400 group-hover:text-orange-600 transition-colors';
  };

  return (
    <>
      {/* Mobile Backdrop (only visible on mobile/tablet when open) */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Responsive Glassmorphism Sidebar (Putih Clean Bersih + Orange Kulit Jeruk) */}
      <aside
        id="sidebar"
        className={`fixed lg:sticky top-0 inset-y-0 left-0 z-50 lg:z-30 h-screen bg-white/85 backdrop-blur-xl text-slate-800 flex flex-col select-none border-r border-orange-200/70 shadow-xl shadow-orange-950/5 transition-all duration-200 ease-in-out ${
          isOpen
            ? 'w-64 translate-x-0 opacity-100 shrink-0'
            : 'w-0 -translate-x-full lg:w-0 lg:translate-x-0 opacity-0 pointer-events-none lg:overflow-hidden lg:border-0'
        }`}
      >
        {/* ========================================================================= */}
        {/* ZONE 1: PINNED TOP HEADER (Never scrolls away) */}
        {/* ========================================================================= */}
        <div className="shrink-0 p-3.5 pb-3 border-b border-orange-100/90 bg-white/75 backdrop-blur-md space-y-2.5">
          {/* Brand Logo & Store Name */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-white p-0.5 shrink-0 flex items-center justify-center overflow-hidden border border-orange-200 shadow-xs shadow-orange-500/10">
                <img
                  src={profile.logoUrl || '/logo.png'}
                  alt="Logo"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-xs sm:text-sm text-slate-900 tracking-tight leading-tight truncate">
                  {profile.storeName || 'MINI ATM POS'}
                </h1>
                <p className="text-[10px] text-orange-600 font-mono font-medium truncate">
                  ID: {profile.idAgent || 'AG-88921'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-orange-50 transition-colors cursor-pointer shrink-0"
              aria-label="Tutup navigasi"
              title="Tutup Menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Role Indicator Card */}
          <div className="px-2.5 py-1.5 rounded-xl bg-orange-50/80 border border-orange-200/70 backdrop-blur-xs flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              {isAdmin ? (
                <ShieldCheck className="w-3.5 h-3.5 text-orange-600 shrink-0" />
              ) : (
                <UserCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              )}
              <span className="font-semibold text-slate-800 text-[11px] truncate">
                {isAdmin ? 'Administrator (Owner)' : 'Kasir Shift'}
              </span>
            </div>
            <span className="text-[9.5px] font-mono font-medium text-orange-700 bg-orange-100/70 px-1.5 py-0.5 rounded-md shrink-0">
              {isAdmin ? 'Akses Penuh' : 'Shift'}
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ZONE 2: SCROLLABLE MIDDLE NAVIGATION (Only this container scrolls) */}
        {/* ========================================================================= */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2.5 space-y-3 [scrollbar-width:thin] [scrollbar-color:#fed7aa_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-orange-200/80 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-orange-300">
          <nav className="space-y-3 text-xs">
            {/* Dashboard (Admin Only) */}
            {isAdmin && (
              <div>
                <button
                  onClick={() => handleSelectTab('dashboard')}
                  id="nav-dashboard"
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left cursor-pointer group ${getItemClass(
                    activeTab === 'dashboard'
                  )}`}
                >
                  <LayoutDashboard className={`w-4 h-4 shrink-0 ${getIconClass(activeTab === 'dashboard')}`} />
                  <span className="flex-1 truncate">Dashboard Ringkasan</span>
                </button>
              </div>
            )}

            {/* SEKSI 1: TRANSAKSI & KASIR */}
            <div className="space-y-0.5">
              <div className="text-[10px] font-bold text-orange-950/70 uppercase tracking-wider px-2.5 pt-1 pb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                <span>Transaksi & Kasir</span>
              </div>

              <button
                onClick={() => handleSelectTab('transaksi')}
                id="nav-transaksi"
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left cursor-pointer group ${getItemClass(
                  activeTab === 'transaksi'
                )}`}
              >
                <ListOrdered className={`w-4 h-4 shrink-0 ${getIconClass(activeTab === 'transaksi')}`} />
                <span className="flex-1 truncate">Transaksi Mini ATM</span>
                {trxCount > 0 && (
                  <span
                    className={`text-[11px] font-mono px-1.5 py-0.5 rounded-md font-bold ${
                      activeTab === 'transaksi'
                        ? 'text-white bg-white/20'
                        : 'text-slate-500 group-hover:text-orange-700 bg-orange-100/60'
                    }`}
                  >
                    {trxCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleSelectTab('riwayat-transaksi-agen')}
                id="nav-riwayat-transaksi-agen"
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left cursor-pointer group ${getItemClass(
                  activeTab === 'riwayat-transaksi-agen'
                )}`}
              >
                <History className={`w-4 h-4 shrink-0 ${getIconClass(activeTab === 'riwayat-transaksi-agen')}`} />
                <span className="flex-1 truncate">Riwayat Transaksi Agen</span>
              </button>

              <button
                onClick={() => handleSelectTab('kasir-fisik')}
                id="nav-kasir-fisik"
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left cursor-pointer group ${getItemClass(
                  activeTab === 'kasir-fisik'
                )}`}
              >
                <ShoppingCart className={`w-4 h-4 shrink-0 ${getIconClass(activeTab === 'kasir-fisik')}`} />
                <span className="flex-1 truncate">Kasir POS (Jual Barang)</span>
              </button>

              <button
                onClick={() => handleSelectTab('riwayat-transaksi-pos')}
                id="nav-riwayat-transaksi-pos"
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left cursor-pointer group ${getItemClass(
                  activeTab === 'riwayat-transaksi-pos'
                )}`}
              >
                <Receipt className={`w-4 h-4 shrink-0 ${getIconClass(activeTab === 'riwayat-transaksi-pos')}`} />
                <span className="flex-1 truncate">Riwayat Transaksi POS</span>
                {posSalesCount > 0 && (
                  <span
                    className={`text-[11px] font-mono px-1.5 py-0.5 rounded-md font-bold ${
                      activeTab === 'riwayat-transaksi-pos'
                        ? 'text-white bg-white/20'
                        : 'text-slate-500 group-hover:text-orange-700 bg-orange-100/60'
                    }`}
                  >
                    {posSalesCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleSelectTab('member-pelanggan')}
                id="nav-member-pelanggan"
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left cursor-pointer group ${getItemClass(
                  activeTab === 'member-pelanggan'
                )}`}
              >
                <UserCheck className={`w-4 h-4 shrink-0 ${getIconClass(activeTab === 'member-pelanggan')}`} />
                <span className="flex-1 truncate">Member Pelanggan</span>
                {memberCount > 0 && (
                  <span
                    className={`text-[11px] font-mono px-1.5 py-0.5 rounded-md font-bold ${
                      activeTab === 'member-pelanggan'
                        ? 'text-white bg-white/20'
                        : 'text-slate-500 group-hover:text-orange-700 bg-orange-100/60'
                    }`}
                  >
                    {memberCount}
                  </span>
                )}
              </button>
            </div>

            {/* SEKSI 2: LOGISTIK & LAPORAN */}
            <div className="space-y-0.5">
              <div className="text-[10px] font-bold text-orange-950/70 uppercase tracking-wider px-2.5 pt-2 pb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span>Logistik & Laporan</span>
              </div>

              <button
                onClick={() => handleSelectTab('stok-barang')}
                id="nav-stok-barang"
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left cursor-pointer group ${getItemClass(
                  activeTab === 'stok-barang'
                )}`}
              >
                <Package className={`w-4 h-4 shrink-0 ${getIconClass(activeTab === 'stok-barang')}`} />
                <span className="flex-1 truncate">Stok Barang Fisik</span>
              </button>

              <button
                onClick={() => handleSelectTab('laporan-penjualan-fisik')}
                id="nav-laporan-penjualan-fisik"
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left cursor-pointer group ${getItemClass(
                  activeTab === 'laporan-penjualan-fisik'
                )}`}
              >
                <TrendingUp className={`w-4 h-4 shrink-0 ${getIconClass(activeTab === 'laporan-penjualan-fisik')}`} />
                <span className="flex-1 truncate">Laporan Penjualan POS</span>
              </button>

              <button
                onClick={() => handleSelectTab('laporan-detail')}
                id="nav-laporan-detail"
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left cursor-pointer group ${getItemClass(
                  activeTab === 'laporan-detail'
                )}`}
              >
                <FileBarChart className={`w-4 h-4 shrink-0 ${getIconClass(activeTab === 'laporan-detail')}`} />
                <span className="flex-1 truncate">
                  {isAdmin ? 'Laporan Detail & Rekap' : 'Laporan Transaksi Kasir'}
                </span>
              </button>
            </div>

            {/* SEKSI 3: KEUANGAN & PENGATURAN */}
            <div className="space-y-0.5">
              <div className="text-[10px] font-bold text-orange-950/70 uppercase tracking-wider px-2.5 pt-2 pb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-600 shrink-0" />
                <span>Keuangan & Pengaturan</span>
              </div>

              <button
                onClick={() => handleSelectTab('setting-printer')}
                id="nav-setting-printer"
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left cursor-pointer group ${getItemClass(
                  activeTab === 'setting-printer'
                )}`}
              >
                <Printer className={`w-4 h-4 shrink-0 ${getIconClass(activeTab === 'setting-printer')}`} />
                <span className="flex-1 truncate">Setting Printer Thermal</span>
              </button>

              {isAdmin && (
                <>
                  <button
                    onClick={() => handleSelectTab('arus-kas')}
                    id="nav-arus-kas"
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left cursor-pointer group ${getItemClass(
                      activeTab === 'arus-kas'
                    )}`}
                  >
                    <ArrowLeftRight className={`w-4 h-4 shrink-0 ${getIconClass(activeTab === 'arus-kas')}`} />
                    <span className="flex-1 truncate">Arus Kas & Mutasi</span>
                  </button>

                  <button
                    onClick={() => handleSelectTab('akun-kas')}
                    id="nav-akun-kas"
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left cursor-pointer group ${getItemClass(
                      activeTab === 'akun-kas'
                    )}`}
                  >
                    <Wallet className={`w-4 h-4 shrink-0 ${getIconClass(activeTab === 'akun-kas')}`} />
                    <span className="flex-1 truncate">Akun Kas / Rekening</span>
                  </button>

                  <button
                    onClick={() => handleSelectTab('hak-akses')}
                    id="nav-hak-akses"
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left cursor-pointer group ${getItemClass(
                      activeTab === 'hak-akses'
                    )}`}
                  >
                    <Users className={`w-4 h-4 shrink-0 ${getIconClass(activeTab === 'hak-akses')}`} />
                    <span className="flex-1 truncate">Akun Admin & Kasir</span>
                    {userCount > 0 && (
                      <span
                        className={`text-[11px] font-mono px-1.5 py-0.5 rounded-md font-bold ${
                          activeTab === 'hak-akses'
                            ? 'text-white bg-white/20'
                            : 'text-slate-500 group-hover:text-orange-700 bg-orange-100/60'
                        }`}
                      >
                        {userCount}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => handleSelectTab('profil-agen')}
                    id="nav-profil-agen"
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left cursor-pointer group ${getItemClass(
                      activeTab === 'profil-agen'
                    )}`}
                  >
                    <Store className={`w-4 h-4 shrink-0 ${getIconClass(activeTab === 'profil-agen')}`} />
                    <span className="flex-1 truncate">Setting Profil Agen</span>
                  </button>

                  <button
                    onClick={() => handleSelectTab('database-spreadsheet')}
                    id="nav-database-spreadsheet"
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left cursor-pointer group ${getItemClass(
                      activeTab === 'database-spreadsheet'
                    )}`}
                  >
                    <FileSpreadsheet className={`w-4 h-4 shrink-0 ${getIconClass(activeTab === 'database-spreadsheet')}`} />
                    <span className="flex-1 truncate">Database Spreadsheet</span>
                  </button>

                  <button
                    onClick={() => handleSelectTab('backup-reset')}
                    id="nav-backup-reset"
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left cursor-pointer group ${getItemClass(
                      activeTab === 'backup-reset'
                    )}`}
                  >
                    <Database className={`w-4 h-4 shrink-0 ${getIconClass(activeTab === 'backup-reset')}`} />
                    <span className="flex-1 truncate">Backup & Reset Data</span>
                  </button>
                </>
              )}

              <button
                onClick={() => handleSelectTab('tentang-sistem')}
                id="nav-tentang-sistem"
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left cursor-pointer group ${getItemClass(
                  activeTab === 'tentang-sistem'
                )}`}
              >
                <Info className={`w-4 h-4 shrink-0 ${getIconClass(activeTab === 'tentang-sistem')}`} />
                <span className="flex-1 truncate">Tentang & Panduan</span>
              </button>
            </div>
          </nav>
        </div>

        {/* ========================================================================= */}
        {/* ZONE 3: PINNED BOTTOM FOOTER (Never scrolls away) */}
        {/* ========================================================================= */}
        <div className="shrink-0 p-3 border-t border-orange-100/90 bg-white/80 backdrop-blur-md space-y-2">
          {currentUser && (
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/90 border border-orange-200/70 shadow-2xs backdrop-blur-xs text-xs">
              <div className="min-w-0 pr-1.5">
                <div className="font-bold text-slate-800 truncate text-[11px] leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-orange-800/80 font-mono truncate">
                  {currentUser.role} · @{currentUser.username}
                </div>
              </div>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  title="Keluar dari akun (Logout)"
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* PWA Install Button */}
          <PWAInstallButton variant="sidebar" />

          {/* Version Info */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
            <span>Terminal POS</span>
            <button
              type="button"
              onClick={() => setIsVersionModalOpen(true)}
              className="text-orange-600 hover:text-orange-700 font-mono font-medium transition-colors cursor-pointer hover:underline"
            >
              v{version}
            </button>
          </div>
        </div>
      </aside>

      {/* Modal Informasi Versi */}
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
