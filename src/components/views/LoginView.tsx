import React, { useState } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Phone,
  Database,
  Receipt,
  ArrowRight,
  Shield,
  Mail,
  Send,
  ShieldAlert,
  ExternalLink,
  RefreshCw,
  CreditCard,
  Building2,
  Check,
} from 'lucide-react';
import { AgentProfile, AppUser, UserRole } from '../../types';
import { useAppVersion } from '../../utils/versionManager';
import { ModalVersionInfo } from '../modals/ModalVersionInfo';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { MiniPosPersonIllustration } from '../illustrations/MiniPosPersonIllustration';
import {
  loginWithGoogle,
  registerWithFirebaseEmail,
  resendVerificationEmail,
  logoutFirebase,
} from '../../firebase';

export interface AuthUser {
  id?: string;
  username: string;
  name: string;
  role: UserRole;
  avatarInitials: string;
}

export interface RegisterResult {
  success: boolean;
  message: string;
  user?: AppUser;
}

interface LoginViewProps {
  profile: AgentProfile;
  users?: AppUser[];
  onLoginSuccess: (user: AuthUser) => void;
  onRegisterUser?: (userData: Partial<AppUser>) => RegisterResult;
}

export const LoginView: React.FC<LoginViewProps> = ({
  profile,
  users = [],
  onLoginSuccess,
  onRegisterUser,
}) => {
  const { enterpriseVersion, version } = useAppVersion();

  // Active Tab: 'login' | 'register'
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [isVersionModalOpen, setIsVersionModalOpen] = useState<boolean>(false);

  // Login Form States
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Registration Form States (Daftar Akun khusus Admin, akun Kasir dibuat di Dashboard Admin)
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regUsername, setRegUsername] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [regNotes, setRegNotes] = useState<string>('');
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState<boolean>(false);
  const [autoLoginAfterRegister, setAutoLoginAfterRegister] = useState<boolean>(false);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  // Email validation and Unregistered Google state
  const [emailValidationSentTo, setEmailValidationSentTo] = useState<string | null>(null);
  const [unregisteredGoogleInfo, setUnregisteredGoogleInfo] = useState<{ email: string; name: string } | null>(null);
  const [isSendingVerification, setIsSendingVerification] = useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [popupBlocked, setPopupBlocked] = useState<boolean>(false);

  const safeUsers = Array.isArray(users) ? users : [];

  const executeLogin = (user: AuthUser) => {
    onLoginSuccess(user);
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedInput = username.trim().toLowerCase();
    const matchedAccount = safeUsers.find(
      (acc) =>
        (acc.username.toLowerCase() === trimmedInput ||
          (acc.email && acc.email.toLowerCase() === trimmedInput)) &&
        acc.password === password
    );

    if (matchedAccount) {
      if (matchedAccount.status === 'INACTIVE') {
        setErrorMessage('Akun ini berstatus Non-Aktif. Hubungi Administrator untuk mengaktifkannya kembali.');
        return;
      }

      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        const initials = matchedAccount.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .substring(0, 2)
          .toUpperCase();

        executeLogin({
          id: matchedAccount.id,
          username: matchedAccount.username,
          name: matchedAccount.name,
          role: matchedAccount.role,
          avatarInitials: initials || (matchedAccount.role === 'Admin' ? 'AD' : 'KS'),
        });
      }, 350);
    } else {
      setErrorMessage('Username/Email atau kata sandi tidak cocok. Silakan periksa kembali.');
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setPopupBlocked(false);
    setUnregisteredGoogleInfo(null);
    setIsGoogleLoading(true);

    try {
      const user = await loginWithGoogle();
      const googleEmail = (user.email || '').toLowerCase().trim();

      // Cek apakah email Google sudah terdaftar di sistem
      const isOwnerAdmin = googleEmail === 'digitalserviceprint.io@gmail.com';
      const registeredAccount = safeUsers.find(
        (u) => u.email && u.email.toLowerCase().trim() === googleEmail
      );

      if (!registeredAccount && !isOwnerAdmin) {
        // Email belum terdaftar: larang login langsung demi keamanan
        await logoutFirebase();
        setUnregisteredGoogleInfo({
          email: googleEmail,
          name: user.displayName || '',
        });
        setErrorMessage(
          `Email Google "${googleEmail}" belum terdaftar. Daftarkan akun Admin terlebih dahulu.`
        );
        return;
      }

      // Akun terdaftar: izinkan masuk
      const displayName = registeredAccount?.name || user.displayName || googleEmail.split('@')[0];
      const accUsername = registeredAccount?.username || googleEmail.split('@')[0];
      const role: UserRole = registeredAccount?.role || 'Admin';
      const initials = (displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()) || (role === 'Admin' ? 'AD' : 'KS');

      setSuccessMessage(`Login Google berhasil. Membuka terminal sebagai ${displayName}...`);
      setTimeout(() => {
        executeLogin({
          id: registeredAccount?.id || user.uid,
          username: accUsername,
          name: displayName,
          role,
          avatarInitials: initials,
        });
      }, 400);
    } catch (err: unknown) {
      const errorStr = String(err);
      const isBlocked =
        (err as { code?: string })?.code === 'auth/popup-blocked' ||
        errorStr.includes('popup-blocked');
      const isCancelled =
        (err as { code?: string })?.code === 'auth/popup-closed-by-user' ||
        errorStr.includes('popup-closed-by-user') ||
        (err as { code?: string })?.code === 'auth/cancelled-popup-request' ||
        errorStr.includes('cancelled-popup-request');

      if (isBlocked) {
        setPopupBlocked(true);
        setErrorMessage(
          'Jendela popup Google Sign-In diblokir browser atau iframe. Buka di Tab Baru atau gunakan login manual.'
        );
      } else if (isCancelled) {
        // User closed popup
      } else {
        console.warn('Firebase Google sign-in note:', err);
        setErrorMessage('Gagal masuk via Google. Pastikan koneksi internet stabil & popup diizinkan.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanName = regName.trim();
    const cleanEmail = regEmail.trim().toLowerCase();
    const cleanUser = regUsername.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '');
    const cleanPass = regPassword.trim();
    const cleanConfirm = regConfirmPassword.trim();

    if (!cleanName) {
      setErrorMessage('Nama lengkap wajib diisi.');
      return;
    }

    if (!cleanEmail) {
      setErrorMessage('Alamat email aktif wajib diisi.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage('Format email tidak valid. Masukkan alamat email yang benar.');
      return;
    }

    if (safeUsers.some((u) => u.email && u.email.toLowerCase() === cleanEmail)) {
      setErrorMessage(`Email "${cleanEmail}" sudah terdaftar. Silakan gunakan tab Masuk.`);
      return;
    }

    if (!cleanUser || cleanUser.length < 3) {
      setErrorMessage('Username wajib diisi minimal 3 karakter (huruf, angka, titik, atau garis bawah).');
      return;
    }

    if (safeUsers.some((u) => u.username.toLowerCase() === cleanUser)) {
      setErrorMessage(`Username "${cleanUser}" sudah digunakan. Silakan pilih username lain.`);
      return;
    }

    if (!cleanPass || cleanPass.length < 6) {
      setErrorMessage('Kata sandi minimal 6 karakter demi keamanan akun.');
      return;
    }

    if (cleanPass !== cleanConfirm) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setIsRegistering(true);

    try {
      // 1. Registrasi di Firebase Auth dan kirim email validasi
      let verificationSent = false;
      try {
        const fbResult = await registerWithFirebaseEmail(cleanEmail, cleanPass, cleanName);
        if (fbResult.verificationSent) {
          verificationSent = true;
        }
      } catch (fbErr) {
        console.warn('Catatan pendaftaran Firebase Auth:', fbErr);
      }

      // 2. Simpan pengguna ke database aplikasi (Pendaftaran mandiri khusus Admin)
      if (onRegisterUser) {
        const result = onRegisterUser({
          name: cleanName,
          email: cleanEmail,
          emailVerified: false,
          username: cleanUser,
          password: cleanPass,
          role: 'Admin',
          phone: regPhone.trim(),
          notes: regNotes.trim() || 'Pendaftaran akun Admin baru',
          status: 'ACTIVE',
        });

        setIsRegistering(false);

        if (!result.success) {
          setErrorMessage(result.message);
          return;
        }

        const registeredUser = result.user;
        setEmailValidationSentTo(cleanEmail);

        const successNotice = verificationSent
          ? `Pendaftaran Admin berhasil. Tautan verifikasi email telah dikirimkan ke ${cleanEmail}.`
          : `Pendaftaran Admin berhasil untuk ${cleanEmail}.`;

        setSuccessMessage(successNotice);

        if (autoLoginAfterRegister && registeredUser) {
          const initials = cleanName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();

          setTimeout(() => {
            executeLogin({
              id: registeredUser.id,
              username: registeredUser.username,
              name: registeredUser.name,
              role: registeredUser.role,
              avatarInitials: initials || (registeredUser.role === 'Admin' ? 'AD' : 'KS'),
            });
          }, 600);
        } else {
          setUsername(cleanUser);
          setPassword(cleanPass);
          setActiveTab('login');
          setRegName('');
          setRegEmail('');
          setRegUsername('');
          setRegPassword('');
          setRegConfirmPassword('');
          setRegPhone('');
          setRegNotes('');
        }
      } else {
        setIsRegistering(false);
        setErrorMessage('Layanan registrasi tidak tersedia.');
      }
    } catch (err) {
      setIsRegistering(false);
      setErrorMessage(err instanceof Error ? err.message : 'Gagal menyelesaikan pendaftaran akun.');
    }
  };

  const handleResendValidationEmail = async () => {
    if (!emailValidationSentTo) return;
    setIsSendingVerification(true);
    try {
      const res = await resendVerificationEmail();
      if (res.success) {
        setSuccessMessage(`Tautan validasi berhasil dikirim ulang ke ${emailValidationSentTo}. Periksa Inbox atau Spam.`);
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage('Gagal mengirim ulang email validasi.');
    } finally {
      setIsSendingVerification(false);
    }
  };

  const isDuplicateUsername =
    regUsername.trim().length >= 3 &&
    safeUsers.some((u) => u.username.toLowerCase() === regUsername.trim().toLowerCase());

  const isDuplicateEmail =
    regEmail.trim().length >= 5 &&
    safeUsers.some((u) => u.email && u.email.toLowerCase() === regEmail.trim().toLowerCase());

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-800 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-blue-700 selection:text-white">
      {/* Main Structural Frame */}
      <div className="w-full max-w-5xl bg-white border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-200/60 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: Clean Animated Presentation - MiniPos Kasir & Agen Mini ATM */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 bg-gradient-to-br from-orange-50/90 via-amber-50/40 to-white text-slate-800 p-6 sm:p-7 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-orange-100/90 relative overflow-hidden">
          {/* Subtle Decorative Ambient Background Blobs */}
          <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full bg-orange-200/30 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full bg-amber-200/30 blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            {/* Header Brand */}
            <div className="flex items-center justify-between pb-3 border-b border-orange-200/60">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white p-1 shrink-0 shadow-xs border border-orange-200 flex items-center justify-center overflow-hidden">
                  <img
                    src={profile.logoUrl || '/logo.png'}
                    alt={profile.storeName || 'Logo Mini ATM'}
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-orange-600 tracking-wider uppercase">
                    Aplikasi Kasir Agen
                  </div>
                  <h1 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight leading-tight truncate">
                    {profile.storeName || 'MINI ATM POS'}
                  </h1>
                </div>
              </div>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-orange-100/80 text-orange-800 border border-orange-200/70 shrink-0">
                {profile.idAgent || 'AG-88921'}
              </span>
            </div>

            {/* Animated Character Illustration: Person introducing MiniPos */}
            <div className="py-1">
              <MiniPosPersonIllustration className="w-full max-w-[340px] mx-auto" />
            </div>

            {/* Value Proposition & Application Description */}
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100/70 text-orange-800 text-[11px] font-bold border border-orange-200/80 shadow-2xs">
                <span>✨ Aplikasi Kasir Modern</span>
                <span className="font-extrabold text-orange-600">"MiniPos"</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug">
                Pencatatan Transaksi Agen Mini ATM &amp; POS
              </h2>
              <p className="text-[11px] text-slate-600 leading-relaxed max-w-xs mx-auto">
                Solusi praktis dan otomatis untuk transfer, tarik tunai, pembayaran tagihan, serta penjualan ritel toko dengan cetak struk instan.
              </p>
            </div>

            {/* Clean Feature Highlights Cards */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-2 rounded-xl bg-white/85 border border-orange-200/70 shadow-2xs backdrop-blur-xs flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                <span className="text-[10.5px] font-semibold">Mini ATM &amp; Ritel POS</span>
              </div>
              <div className="p-2 rounded-xl bg-white/85 border border-orange-200/70 shadow-2xs backdrop-blur-xs flex items-center gap-2 text-slate-700">
                <Receipt className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-[10.5px] font-semibold">Struk Thermal 58/80mm</span>
              </div>
              <div className="p-2 rounded-xl bg-white/85 border border-orange-200/70 shadow-2xs backdrop-blur-xs flex items-center gap-2 text-slate-700">
                <Database className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="text-[10.5px] font-semibold">Cloud &amp; Google Sheets</span>
              </div>
              <div className="p-2 rounded-xl bg-white/85 border border-orange-200/70 shadow-2xs backdrop-blur-xs flex items-center gap-2 text-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="text-[10.5px] font-semibold">Laporan Laba Real-Time</span>
              </div>
            </div>

            {/* PWA Install Button */}
            <div className="pt-1">
              <PWAInstallButton variant="sidebar" />
            </div>
          </div>

          {/* Bottom Footer Info */}
          <div className="relative z-10 pt-4 mt-4 border-t border-orange-200/60 flex items-center justify-between text-xs text-slate-500">
            <span className="text-[11px] font-medium">Terminal Kasir MiniPos</span>
            <button
              type="button"
              onClick={() => setIsVersionModalOpen(true)}
              className="text-orange-600 hover:text-orange-700 transition-colors cursor-pointer text-[11px] font-mono font-semibold hover:underline"
            >
              {enterpriseVersion}
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: Authentication Portal (Login & Register Admin) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
          <div>
            {/* Functional Segmented Navigation Tabs */}
            <div className="flex border-b border-slate-200 mb-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`pb-3 text-sm font-semibold transition-colors relative cursor-pointer mr-6 ${
                  activeTab === 'login'
                    ? 'text-slate-900 border-b-2 border-blue-600'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Masuk Terminal
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`pb-3 text-sm font-semibold transition-colors relative cursor-pointer ${
                  activeTab === 'register'
                    ? 'text-slate-900 border-b-2 border-blue-600'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Daftar Admin Baru
              </button>
            </div>

            {/* Feedback Notifications */}
            {errorMessage && !unregisteredGoogleInfo && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <div className="flex-1 font-medium leading-relaxed">{successMessage}</div>
              </div>
            )}

            {/* Email Validation Status Alert */}
            {emailValidationSentTo && (
              <div className="mb-4 p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-950 text-xs">
                <div className="flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <p className="font-semibold text-blue-900">
                      Tautan Validasi Email Terkirim
                    </p>
                    <p className="text-[11px] text-blue-800 leading-relaxed">
                      Tautan verifikasi telah dikirimkan ke <strong className="font-medium underline">{emailValidationSentTo}</strong>. Buka email Anda untuk mengonfirmasi akun.
                    </p>
                    <div className="pt-1 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleResendValidationEmail}
                        disabled={isSendingVerification}
                        className="text-blue-700 hover:text-blue-900 font-semibold text-[11px] hover:underline cursor-pointer flex items-center gap-1 disabled:opacity-60"
                      >
                        {isSendingVerification ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                        <span>Kirim ulang validasi</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEmailValidationSentTo(null)}
                        className="text-slate-500 hover:text-slate-800 text-[11px] cursor-pointer"
                      >
                        Tutup
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Unregistered Google Rejection Notice with Quick Transfer to Register */}
            {unregisteredGoogleInfo && (
              <div className="mb-4 p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-950 text-xs">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1.5">
                    <p className="font-semibold text-amber-900">
                      Email Google Belum Terdaftar
                    </p>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Email <strong className="font-semibold">{unregisteredGoogleInfo.email}</strong> belum terdaftar dalam sistem. Demi keamanan otorisasi kasir, silakan daftarkan akun Admin terlebih dahulu.
                    </p>
                    <div className="pt-1 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRegEmail(unregisteredGoogleInfo.email);
                          setRegName(unregisteredGoogleInfo.name || unregisteredGoogleInfo.email.split('@')[0]);
                          setRegUsername(
                            unregisteredGoogleInfo.email
                              .split('@')[0]
                              .toLowerCase()
                              .replace(/[^a-z0-9_.]/g, '')
                          );
                          setActiveTab('register');
                          setUnregisteredGoogleInfo(null);
                          setErrorMessage(null);
                        }}
                        className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Daftarkan Email Ini sebagai Admin</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setUnregisteredGoogleInfo(null)}
                        className="text-slate-600 hover:text-slate-900 text-xs px-2 py-1 cursor-pointer"
                      >
                        Abaikan
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===================================================================== */}
            {/* VIEW 1: LOGIN FORM */}
            {/* ===================================================================== */}
            {activeTab === 'login' && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    Masuk ke Sistem Kasir
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Gunakan kredensial akun kasir atau administrator untuk mengakses terminal.
                  </p>
                </div>

                <form onSubmit={handleManualLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Username atau Alamat Email
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Masukkan username atau email"
                        autoComplete="username"
                        className="w-full text-xs pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-hidden text-slate-900 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        Kata Sandi
                      </label>
                    </div>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Masukkan kata sandi"
                        autoComplete="current-password"
                        className="w-full text-xs pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-hidden text-slate-900 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span>Simpan sesi masuk</span>
                    </label>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-slate-400" />
                      <span>Sesi Terenkripsi</span>
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    id="btn-submit-login"
                    className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Memverifikasi akun...</span>
                      </span>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>Masuk ke Dashboard</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-[11px]">
                    <span className="bg-white px-2.5 text-slate-400">atau</span>
                  </div>
                </div>

                {/* Google Sign-In */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading || isGoogleLoading}
                  id="btn-google-login"
                  className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-xl border border-slate-300 shadow-2xs transition-colors flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
                >
                  {isGoogleLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>Menghubungkan akun Google...</span>
                    </span>
                  ) : (
                    <>
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Lanjutkan dengan Google</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                  Khusus akun email yang sudah terdaftar. Pengguna baru dapat mendaftar melalui menu pendaftaran Admin.
                </p>

                {/* Popup Blocked Fallback */}
                {popupBlocked && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-950 text-xs">
                    <div className="space-y-2">
                      <p className="font-semibold text-amber-900">
                        Popup Google diblokir oleh browser / kontainer iframe
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => window.open(window.location.href, '_blank')}
                          className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white font-medium text-[11px] rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Buka Tab Baru</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            executeLogin({
                              username: 'admin',
                              name: 'Administrator Toko',
                              role: 'Admin',
                              avatarInitials: 'AD',
                            });
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-amber-300 text-amber-900 font-medium text-[11px] rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <ShieldCheck className="w-3 h-3 text-blue-600" />
                          <span>Masuk sebagai Admin</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Clean Unboxed Preset Shortcuts for Testing */}
                <div className="pt-2 flex items-center justify-center gap-2 text-xs text-slate-500">
                  <span>Isi otomatis:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setUsername('admin');
                      setPassword('password123');
                    }}
                    className="text-blue-700 hover:text-blue-900 font-medium hover:underline cursor-pointer"
                  >
                    Admin
                  </button>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <button
                    type="button"
                    onClick={() => {
                      setUsername('kasir');
                      setPassword('password123');
                    }}
                    className="text-blue-700 hover:text-blue-900 font-medium hover:underline cursor-pointer"
                  >
                    Kasir
                  </button>
                </div>
              </div>
            )}

            {/* ===================================================================== */}
            {/* VIEW 2: REGISTER ADMIN FORM */}
            {/* ===================================================================== */}
            {activeTab === 'register' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    Pendaftaran Akun Admin
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Pendaftaran ini khusus untuk Pemilik atau Administrator Toko.
                  </p>
                </div>

                {/* Clear Cashier Account Information Note */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed space-y-1">
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>Ketentuan Pembuatan Akun Kasir</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Akun staf kasir tidak dapat mendaftar mandiri di sini. Pengaturan akun, penetapan shift, dan password kasir dibuat langsung oleh Admin di menu <strong>Hak Akses & Kasir</strong> setelah masuk.
                  </p>
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nama Lengkap <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Contoh: Bpk. Rahmat Santoso"
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-hidden text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Alamat Email Aktif <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="nama@gmail.com"
                        className={`w-full text-xs px-3 py-2 bg-slate-50 border rounded-xl focus:ring-2 focus:bg-white focus:outline-hidden text-slate-900 ${
                          isDuplicateEmail
                            ? 'border-rose-400 focus:ring-rose-500'
                            : 'border-slate-300 focus:ring-blue-600'
                        }`}
                      />
                      {isDuplicateEmail && (
                        <p className="text-[10px] text-rose-600 mt-1">Email sudah terdaftar.</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Username Login <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={regUsername}
                        onChange={(e) =>
                          setRegUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))
                        }
                        placeholder="Contoh: rahmat_owner"
                        className={`w-full text-xs px-3 py-2 bg-slate-50 border rounded-xl focus:ring-2 focus:bg-white focus:outline-hidden text-slate-900 ${
                          isDuplicateUsername
                            ? 'border-rose-400 focus:ring-rose-500'
                            : 'border-slate-300 focus:ring-blue-600'
                        }`}
                      />
                      {isDuplicateUsername && (
                        <p className="text-[10px] text-rose-600 mt-1">Username sudah terdaftar.</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        No. HP / WhatsApp <span className="text-slate-400 font-normal">(Opsional)</span>
                      </label>
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="081234567890"
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-hidden text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Catatan Outlet / Alamat <span className="text-slate-400 font-normal">(Opsional)</span>
                    </label>
                    <input
                      type="text"
                      value={regNotes}
                      onChange={(e) => setRegNotes(e.target.value)}
                      placeholder="Contoh: Outlet Cabang Pasar Minggu"
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-hidden text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Kata Sandi <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Minimal 6 karakter"
                          className="w-full text-xs pl-3 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-hidden text-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        >
                          {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Konfirmasi Kata Sandi <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showRegConfirmPassword ? 'text' : 'password'}
                          required
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="Ulangi kata sandi"
                          className="w-full text-xs pl-3 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-hidden text-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        >
                          {showRegConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between text-xs">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                      <input
                        type="checkbox"
                        checked={autoLoginAfterRegister}
                        onChange={(e) => setAutoLoginAfterRegister(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span>Langsung masuk ke dashboard setelah mendaftar</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={
                      isRegistering ||
                      isDuplicateUsername ||
                      isDuplicateEmail ||
                      !regEmail ||
                      !regUsername ||
                      !regPassword ||
                      !regName
                    }
                    id="btn-submit-register"
                    className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isRegistering ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Mendaftarkan akun Admin...</span>
                      </span>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Daftarkan Akun Admin Toko</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Bottom Switcher Helper */}
          <div className="pt-6 mt-6 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
            {activeTab === 'login' ? (
              <>
                <span>Belum memiliki akun Admin?</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="text-blue-700 hover:text-blue-900 font-semibold hover:underline cursor-pointer"
                >
                  Daftar sebagai Admin
                </button>
              </>
            ) : (
              <>
                <span>Sudah memiliki akun terdaftar?</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="text-blue-700 hover:text-blue-900 font-semibold hover:underline cursor-pointer"
                >
                  Masuk ke Terminal
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal Version Info */}
      <ModalVersionInfo
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
      />
    </div>
  );
};
