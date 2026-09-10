import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  ChevronRight,
  FileSpreadsheet,
  PlusCircle,
  ShieldCheck,
  UserCheck,
  LogOut,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Database,
  MoreVertical,
  X,
  Download,
  Clock,
  Calendar,
} from 'lucide-react';
import { AgentProfile, UserRole } from '../types';
import { AuthUser } from './views/LoginView';
import { subscribeSyncState, SyncState } from '../utils/googleSheetsService';
import { DigitalClock } from './common/DigitalClock';
import { PWAInstallButton } from './common/PWAInstallButton';
import { ModalPWAInstall } from './modals/ModalPWAInstall';

interface HeaderProps {
  profile: AgentProfile;
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
  toggleSidebar: () => void;
  onOpenNewTrx: () => void;
  onExportCSV: () => void;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  onNavigateToSpreadsheet?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  currentRole,
  setRole,
  toggleSidebar,
  onOpenNewTrx,
  onExportCSV,
  currentUser,
  onLogout,
  onNavigateToSpreadsheet,
}) => {
  const [syncState, setSyncState] = useState<SyncState>({
    status: 'unconfigured',
    lastSyncedAt: null,
    spreadsheetName: null,
    spreadsheetUrl: null,
    errorMessage: null,
    pendingCount: 0,
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isPwaModalOpen, setIsPwaModalOpen] = useState<boolean>(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeSyncState((state) => {
      setSyncState(state);
    });
    return unsubscribe;
  }, []);

  // Close mobile menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  const isUserAdmin = (currentUser?.role || currentRole) === 'Admin';

  const todayStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-2.5 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between shadow-xs">
        {/* Left Section: Mobile Menu Trigger + Brand & Identity */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            id="mobileMenuBtn"
            onClick={toggleSidebar}
            className="lg:hidden p-1.5 sm:p-2 text-slate-700 hover:bg-slate-100 active:bg-slate-200 rounded-lg transition-colors cursor-pointer shrink-0"
            aria-label="Buka Menu Navigasi"
            title="Buka Menu Navigasi"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs overflow-hidden border shadow-xs shrink-0 ${
                isUserAdmin
                  ? 'bg-blue-700 text-white border-blue-600'
                  : 'bg-amber-600 text-white border-amber-500'
              }`}
            >
              {profile.logoUrl ? (
                <img
                  src={profile.logoUrl}
                  className="w-full h-full object-cover"
                  alt="Profile"
                />
              ) : (
                <img
                  src="/logo.png"
                  className="w-full h-full object-contain p-0.5 bg-white"
                  alt="Mini ATM"
                />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-slate-800 text-xs leading-tight truncate max-w-[100px] xs:max-w-[140px] sm:max-w-[180px] md:max-w-none">
                {profile.storeName || 'Mini ATM'}
              </span>
              <span className="text-[10px] text-slate-500 truncate max-w-[100px] xs:max-w-[140px] sm:max-w-[180px] md:max-w-none">
                {currentUser?.name || profile.ownerName}
              </span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 hidden md:inline shrink-0" />
          </div>
        </div>

        {/* Right Section: Action Controls & Indicators */}
        <div
          className="flex items-center gap-1.5 sm:gap-2 md:gap-2.5 shrink-0 relative"
          ref={mobileMenuRef}
        >
          {/* Role Mode: Desktop Full Segmented Switcher vs Mobile Compact Toggle */}
          {currentUser?.role === 'Kasir' ? (
            /* Kasir Badge (No unauthorized toggle) */
            <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold shadow-xs shrink-0">
              <UserCheck className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Kasir Shift</span>
              <span className="sm:hidden text-[11px]">Kasir</span>
            </div>
          ) : (
            <>
              {/* Desktop Segmented Mode Switcher (md and above) */}
              <div className="hidden md:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
                <span className="text-[11px] font-semibold px-2 text-slate-500">
                  Mode:
                </span>
                <button
                  onClick={() => setRole('Admin')}
                  id="btnRoleAdmin"
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                    currentRole === 'Admin'
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin (Owner)</span>
                </button>
                <button
                  onClick={() => setRole('Kasir')}
                  id="btnRoleKasir"
                  title="Uji tampilan antarmuka kasir"
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                    currentRole === 'Kasir'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Pratinjau Kasir</span>
                </button>
              </div>

              {/* Mobile Compact 1-Tap Switcher (below md) */}
              <button
                type="button"
                id="btnRoleMobileToggle"
                onClick={() => setRole(currentRole === 'Admin' ? 'Kasir' : 'Admin')}
                title={`Mode aktif: ${currentRole}. Ketuk untuk beralih mode.`}
                className={`md:hidden flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-bold transition-all shrink-0 cursor-pointer shadow-2xs ${
                  currentRole === 'Admin'
                    ? 'bg-blue-50 border-blue-200 text-blue-700 active:bg-blue-100'
                    : 'bg-amber-50 border-amber-200 text-amber-800 active:bg-amber-100'
                }`}
              >
                {currentRole === 'Admin' ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                )}
                <span>{currentRole}</span>
              </button>
            </>
          )}

          {/* Google Sheets Backend Sync Indicator */}
          <button
            onClick={isUserAdmin ? onNavigateToSpreadsheet : undefined}
            id="btnHeaderGasSync"
            title={
              !isUserAdmin
                ? `Status Spreadsheet: ${
                    syncState.status === 'synced'
                      ? 'Tersambung Aktif'
                      : 'Operasional Standalone'
                  }`
                : syncState.status === 'synced'
                ? `Tersambung ke Google Sheet: ${
                    syncState.spreadsheetName || 'Aktif'
                  } (Terakhir sync: ${syncState.lastSyncedAt || 'baru saja'})`
                : syncState.status === 'syncing'
                ? 'Sedang menyinkronkan data ke Google Spreadsheet...'
                : syncState.status === 'error'
                ? `Koneksi Google Apps Script terganggu: ${
                    syncState.errorMessage || ''
                  }`
                : 'Klik untuk menghubungkan Google Apps Script (Spreadsheet Backend)'
            }
            className={`text-xs p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition-all shrink-0 ${
              isUserAdmin ? 'cursor-pointer' : 'cursor-default'
            } ${
              syncState.status === 'synced'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                : syncState.status === 'syncing'
                ? 'bg-amber-50 border-amber-300 text-amber-800 animate-pulse'
                : syncState.status === 'error'
                ? 'bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100'
                : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {syncState.status === 'synced' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : syncState.status === 'syncing' ? (
              <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin shrink-0" />
            ) : syncState.status === 'error' ? (
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            ) : (
              <Database className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            )}
            <span className="hidden sm:inline font-semibold">
              {syncState.status === 'synced'
                ? 'Sheets Aktif'
                : syncState.status === 'syncing'
                ? 'Syncing...'
                : syncState.status === 'error'
                ? 'Sync Error'
                : 'Hubungkan Sheets'}
            </span>
          </button>

          {/* PWA Install Action (Desktop / Large Tablet) */}
          <div className="hidden lg:block shrink-0">
            <PWAInstallButton variant="header" />
          </div>

          {/* Quick New Trx Action (Primary Button) */}
          <button
            onClick={onOpenNewTrx}
            id="btnHeaderNewTrx"
            title="Buat Transaksi Baru (F1)"
            className="bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white text-xs font-semibold p-1.5 sm:px-3 sm:py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs transition-all shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Transaksi Baru</span>
          </button>

          {/* Export Excel / CSV (Admin Only - Tablet sm: and above) */}
          {isUserAdmin && (
            <button
              onClick={onExportCSV}
              title="Download file spreadsheet Excel (.CSV)"
              className="hidden sm:flex bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold p-1.5 md:px-3 md:py-1.5 rounded-lg items-center gap-1.5 shadow-xs transition-all shrink-0 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">Export Excel</span>
            </button>
          )}

          {/* Live Real-time Digital Clock (Desktop XL screens) */}
          <DigitalClock variant="header" className="hidden xl:flex shrink-0" />

          {/* Logout Button (Desktop md: and above) */}
          {onLogout && (
            <button
              onClick={onLogout}
              title="Keluar dari akun (Logout)"
              className="hidden md:flex text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 px-2.5 py-1.5 rounded-lg font-semibold items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden 2xl:inline">Logout</span>
            </button>
          )}

          {/* Mobile Quick Action Overflow Menu Button (md:hidden) */}
          <button
            id="btnMobileHeaderMenu"
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className={`md:hidden p-1.5 sm:p-2 rounded-lg border transition-colors cursor-pointer shrink-0 ${
              isMobileMenuOpen
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'text-slate-600 hover:bg-slate-100 active:bg-slate-200 border-slate-200'
            }`}
            aria-label="Menu Opsi Tambahan"
            title="Menu Opsi Tambahan"
          >
            {isMobileMenuOpen ? (
              <X className="w-4 h-4" />
            ) : (
              <MoreVertical className="w-4 h-4" />
            )}
          </button>

          {/* Mobile Dropdown Popover Card: Clean, Unclipped, High Contrast */}
          {isMobileMenuOpen && (
            <div
              id="mobileHeaderDropdown"
              className="absolute top-full right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-xs bg-white rounded-2xl shadow-xl border border-slate-200 z-50 p-3 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-150"
            >
              {/* Profile & Date Header in Mobile Menu */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 truncate">
                    {currentUser?.name || profile.ownerName}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {profile.storeName || 'Mini ATM'}
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isUserAdmin
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  {currentRole}
                </span>
              </div>

              {/* Role Simulator Switcher for Admins inside Mobile Menu */}
              {isUserAdmin && (
                <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 mb-1 px-1">
                    Beralih Tampilan Mode:
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setRole('Admin');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`px-2 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        currentRole === 'Admin'
                          ? 'bg-blue-700 text-white shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Admin</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRole('Kasir');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`px-2 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        currentRole === 'Kasir'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Kasir</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons List */}
              <div className="space-y-1.5">
                {/* Transaksi Baru Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenNewTrx();
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs transition-colors cursor-pointer border border-blue-100"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-700 text-white flex items-center justify-center">
                      <PlusCircle className="w-3.5 h-3.5" />
                    </div>
                    <span>Transaksi Baru</span>
                  </div>
                  <span className="text-[10px] bg-blue-200/60 text-blue-800 font-mono px-1.5 py-0.5 rounded">
                    F1
                  </span>
                </button>

                {/* Export Excel / CSV Button */}
                {isUserAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onExportCSV();
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs transition-colors cursor-pointer border border-emerald-100"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                      </div>
                      <span>Export Data (.CSV)</span>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-bold">
                      Unduh
                    </span>
                  </button>
                )}

                {/* Google Sheets Sync Quick Link */}
                {isUserAdmin && onNavigateToSpreadsheet && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onNavigateToSpreadsheet();
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors cursor-pointer border border-slate-200"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center">
                        <Database className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <span>Sinkronisasi Sheets</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        syncState.status === 'synced'
                          ? 'bg-emerald-100 text-emerald-700'
                          : syncState.status === 'syncing'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {syncState.status === 'synced'
                        ? 'Aktif'
                        : syncState.status === 'syncing'
                        ? 'Sync'
                        : 'Atur'}
                    </span>
                  </button>
                )}

                {/* Install PWA Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsPwaModalOpen(true);
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors cursor-pointer border border-slate-200"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                      <Download className="w-3.5 h-3.5" />
                    </div>
                    <span>Install Aplikasi (PWA)</span>
                  </div>
                  <span className="text-[10px] text-blue-600 font-bold">
                    Petunjuk
                  </span>
                </button>
              </div>

              {/* Real-time Clock Info in Mobile Dropdown */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 px-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>{todayStr}</span>
                </div>
                <div className="flex items-center gap-1 font-mono font-bold text-slate-800">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <DigitalClock variant="header" showPeriodIcon={false} className="border-0 shadow-none p-0 bg-transparent text-xs" />
                </div>
              </div>

              {/* Logout Button in Mobile Menu */}
              {onLogout && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center justify-center gap-2 p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors cursor-pointer border border-rose-200"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Keluar dari Akun (Logout)</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Backdrop for Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-2xs z-10 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* PWA Install Modal Triggered from Mobile Header Menu */}
      <ModalPWAInstall
        isOpen={isPwaModalOpen}
        onClose={() => setIsPwaModalOpen(false)}
      />
    </>
  );
};


