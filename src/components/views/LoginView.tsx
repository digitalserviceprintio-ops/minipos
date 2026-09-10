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
  Building2,
  Receipt,
  KeyRound,
  Fingerprint,
  Store,
  CheckCircle2,
  Phone,
  Sparkles,
  Database,
  RefreshCw,
  Layers,
  ArrowRight,
  Shield,
  HelpCircle,
  ExternalLink,
  Mail,
  Send,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { AgentProfile, AppUser, UserRole } from '../../types';
import { useAppVersion } from '../../utils/versionManager';
import { ModalVersionInfo } from '../modals/ModalVersionInfo';
import { TransactionVectorIllustration } from '../illustrations/TransactionVectorIllustration';
import { PWAInstallButton } from '../common/PWAInstallButton';
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
  // Card Flip State: false = Front (LOGIN), true = Back (REGISTER)
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
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
  const [regRole, setRegRole] = useState<UserRole>('Admin');
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
        setErrorMessage('Akun ini berstatus Non-Aktif. Hubungi Admin untuk mengaktifkannya kembali.');
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
      setErrorMessage('Username/Email atau kata sandi salah. Silakan periksa kembali.');
    }
  };

  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [popupBlocked, setPopupBlocked] = useState<boolean>(false);

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setPopupBlocked(false);
    setUnregisteredGoogleInfo(null);
    setIsGoogleLoading(true);
    try {
      const user = await loginWithGoogle();
      const googleEmail = (user.email || '').toLowerCase().trim();

      // CEK APAKAH EMAIL GOOGLE SUDAH TERDAFTAR DI SISTEM
      const isOwnerAdmin = googleEmail === 'digitalserviceprint.io@gmail.com';
      const registeredAccount = safeUsers.find(
        (u) => u.email && u.email.toLowerCase().trim() === googleEmail
      );

      if (!registeredAccount && !isOwnerAdmin) {
        // EMAIL BELUM TERDAFTAR: JANGAN IJINKAN LOGIN!
        await logoutFirebase();
        setUnregisteredGoogleInfo({
          email: googleEmail,
          name: user.displayName || '',
        });
        setErrorMessage(
          `Akses Ditolak: Email Google "${googleEmail}" belum terdaftar di sistem. Anda wajib mendaftar akun terlebih dahulu.`
        );
        return;
      }

      // AKUN TERDAFTAR: IJINKAN MASUK
      const displayName = registeredAccount?.name || user.displayName || googleEmail.split('@')[0];
      const accUsername = registeredAccount?.username || googleEmail.split('@')[0];
      const role: UserRole = registeredAccount?.role || 'Admin';
      const initials = (displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()) || (role === 'Admin' ? 'AD' : 'KS');

      setSuccessMessage(`Login Google Berhasil! Selamat datang, ${displayName} (${role})`);
      setTimeout(() => {
        executeLogin({
          id: registeredAccount?.id || user.uid,
          username: accUsername,
          name: displayName,
          role,
          avatarInitials: initials,
        });
      }, 500);
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
        console.warn('Firebase Google sign-in popup was blocked by browser or iframe container.');
        setPopupBlocked(true);
        setErrorMessage(
          'Jendela popup Google Sign-In diblokir oleh browser atau mode pratinjau iframe. Buka di Tab Baru atau gunakan Masuk Cepat.'
        );
      } else if (isCancelled) {
        console.info('Google Sign-in popup closed by user.');
      } else {
        console.warn('Firebase Google sign-in encounter:', err);
        setErrorMessage('Gagal masuk via Google / Firebase. Pastikan koneksi internet stabil & popup diizinkan.');
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
      setErrorMessage('Format email tidak valid. Masukkan alamat email yang benar (contoh: nama@gmail.com).');
      return;
    }

    if (safeUsers.some((u) => u.email && u.email.toLowerCase() === cleanEmail)) {
      setErrorMessage(`Email "${cleanEmail}" sudah terdaftar pada akun lain. Silakan gunakan email lain atau masuk.`);
      return;
    }

    if (!cleanUser || cleanUser.length < 3) {
      setErrorMessage('Username wajib diisi minimal 3 karakter (huruf, angka, titik, atau garis bawah).');
      return;
    }

    if (safeUsers.some((u) => u.username.toLowerCase() === cleanUser)) {
      setErrorMessage(`Username "${cleanUser}" sudah terdaftar. Silakan pilih username lain.`);
      return;
    }

    if (!cleanPass || cleanPass.length < 6) {
      setErrorMessage('Kata sandi minimal 6 karakter demi keamanan akun.');
      return;
    }

    if (cleanPass !== cleanConfirm) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok dengan kata sandi yang dimasukkan.');
      return;
    }

    setIsRegistering(true);

    try {
      // 1. Registrasi di Firebase Auth dan kirim email konfirmasi/validasi
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
          notes: regNotes.trim() || 'Pendaftaran akun Admin baru via email',
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
          ? `Pendaftaran berhasil! Link konfirmasi/validasi email telah dikirimkan ke ${cleanEmail}.`
          : `Pendaftaran berhasil! Validasi email dikirimkan ke ${cleanEmail}.`;

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
          }, 700);
        } else {
          setUsername(cleanUser);
          setPassword(cleanPass);
          // Flip back to login card
          setIsFlipped(false);
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
        setErrorMessage('Fitur registrasi belum terhubung.');
      }
    } catch (err) {
      setIsRegistering(false);
      setErrorMessage(err instanceof Error ? err.message : 'Gagal menyelesaikan pendaftaran.');
    }
  };

  const handleResendValidationEmail = async () => {
    if (!emailValidationSentTo) return;
    setIsSendingVerification(true);
    try {
      const res = await resendVerificationEmail();
      if (res.success) {
        setSuccessMessage(`Link validasi email berhasil dikirim ulang ke ${emailValidationSentTo}. Periksa Inbox atau folder Spam.`);
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col justify-center items-center p-3 sm:p-6 md:p-8 relative overflow-hidden font-sans selection:bg-blue-600 selection:text-white">
      {/* Clean Light Subtle Ambient Lighting & Grid */}
      <div className="absolute top-0 left-1/3 w-[600px] h-[350px] bg-gradient-to-br from-blue-100/60 via-indigo-50/40 to-transparent blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[350px] bg-gradient-to-tr from-emerald-100/50 via-sky-50/40 to-transparent blur-[130px] rounded-full pointer-events-none" />

      {/* Subtle Micro-Dot Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.35] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #cbd5e1 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Main Container */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 items-stretch">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: Clean White Enterprise Brand Showcase & Vector Illustration */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 flex flex-col justify-between shadow-xl shadow-slate-200/50 relative overflow-hidden">
          {/* Subtle Top Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600" />

          <div className="space-y-5">
            {/* Header / Brand Identity */}
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 p-0.5 shadow-md shadow-blue-500/20 shrink-0">
                <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center overflow-hidden">
                  <img
                    src={profile.logoUrl || '/logo.png'}
                    alt="Logo Mini ATM"
                    className="w-full h-full object-contain p-0.5"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-extrabold tracking-widest text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                    Sistem Kasir Agen
                  </span>
                </div>
                <h1 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight leading-snug mt-0.5">
                  {profile.storeName || 'MINI ATM & BRILINK'}
                </h1>
              </div>
            </div>

            {/* Outlet Information Banner */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <Store className="w-3.5 h-3.5 text-blue-600" />
                  <span>Terminal Outlet:</span>
                </span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                  {profile.idAgent || 'AG-88921'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/70">
                <span className="text-slate-500 font-medium">Pemilik / Owner:</span>
                <span className="font-semibold text-slate-800">{profile.ownerName || 'Bpk. Rahmat Santoso'}</span>
              </div>
            </div>

            {/* Vector Illustration of Person Transacting */}
            <div className="bg-gradient-to-b from-blue-50/50 via-slate-50/80 to-white rounded-2xl border border-blue-100/80 p-3 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
              <div className="w-full max-w-[340px] my-1">
                <TransactionVectorIllustration className="w-full h-auto drop-shadow-sm" />
              </div>
              <div className="text-center mt-1">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Transaksi Kasir & Mini ATM Terintegrasi</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                  Layanan perbankan cepat, kasir POS ritel, cetak struk bluetooth, dan database aman.
                </p>
              </div>
            </div>

            {/* Core Capability Pills */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-700">
                <Database className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="font-semibold truncate">Data Per-Akun Mandiri</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-700">
                <Receipt className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-semibold truncate">Struk Thermal 58/80</span>
              </div>
            </div>

            {/* PWA Install Button for Mobile, Tablet, and Desktop */}
            <div className="pt-2">
              <PWAInstallButton variant="sidebar" />
            </div>
          </div>

          {/* Bottom Footer Status */}
          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-slate-600">Sistem Siap Operasi</span>
            </span>
            <button
              type="button"
              onClick={() => setIsVersionModalOpen(true)}
              title={`${enterpriseVersion} (${version}) - Klik untuk riwayat versi`}
              className="font-mono text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition-colors text-[10px] font-bold cursor-pointer"
            >
              {enterpriseVersion}
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: 3D Flip Card Container (Front = Login, Back = Register) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 [perspective:1400px] flex flex-col">
          {/* Card 3D Rotating Flipper */}
          <div
            className="w-full grid grid-cols-1 grid-rows-1 transition-transform duration-700 ease-in-out flex-1"
            style={{
              transformStyle: 'preserve-3d',
              WebkitTransformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* ===================================================================== */}
            {/* CARD FRONT FACE: FORM LOGIN */}
            {/* ===================================================================== */}
            <div
              className={`col-start-1 row-start-1 w-full h-full bg-white text-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 border border-slate-200/90 flex flex-col justify-between ${
                isFlipped ? 'pointer-events-none' : 'pointer-events-auto'
              }`}
              aria-hidden={isFlipped}
              inert={isFlipped ? true : undefined}
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(0deg) translateZ(1px)',
                WebkitTransform: 'rotateY(0deg) translateZ(1px)',
              }}
            >
              <div>
                {/* Header Switcher & Flip Action Indicator */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold uppercase mb-1">
                      <KeyRound className="w-3 h-3" />
                      <span>Autentikasi Pengguna</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                      Masuk ke Sistem Kasir
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Gunakan username dan kata sandi akun Anda untuk mengakses terminal.
                    </p>
                  </div>

                  {/* Interactive 3D Flip Trigger Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsFlipped(true);
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    id="btn-flip-to-register"
                    className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-800 border border-blue-200 rounded-2xl text-xs font-bold transition-all shadow-2xs cursor-pointer group"
                    title="Klik untuk membalik kartu ke formulir pendaftaran akun baru"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-blue-600 transition-transform group-hover:rotate-180 duration-500" />
                    <span className="hidden sm:inline">Daftar Akun Baru</span>
                    <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-extrabold uppercase">
                      Flip ⟳
                    </span>
                  </button>
                </div>

                {/* Feedback Alerts */}
                {errorMessage && !unregisteredGoogleInfo && (
                  <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span className="font-medium">{errorMessage}</span>
                  </div>
                )}

                {successMessage && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span className="font-medium">{successMessage}</span>
                  </div>
                )}

                {/* Email Validation Status Alert */}
                {emailValidationSentTo && (
                  <div className="mb-4 p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-blue-900 text-xs animate-in fade-in duration-200">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 bg-blue-100 rounded-lg text-blue-700 shrink-0 mt-0.5">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="font-extrabold text-[12px] text-blue-950 flex items-center gap-1.5">
                          <span>Link Validasi Email Terkirim</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </p>
                        <p className="text-[11px] text-blue-800 leading-relaxed">
                          Link validasi pendaftaran telah dikirimkan ke <strong className="underline">{emailValidationSentTo}</strong>. Buka email Anda dan klik tautan untuk mengonfirmasi akun.
                        </p>
                        <div className="pt-1.5 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={handleResendValidationEmail}
                            disabled={isSendingVerification}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded-lg transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-60"
                          >
                            {isSendingVerification ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Send className="w-3 h-3" />
                            )}
                            <span>Kirim Ulang Validasi</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEmailValidationSentTo(null)}
                            className="text-[10px] text-slate-500 hover:text-slate-800 font-medium px-1 cursor-pointer"
                          >
                            Tutup
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Unregistered Google Rejection Notice */}
                {unregisteredGoogleInfo && (
                  <div className="mb-4 p-3.5 bg-rose-50 border-2 border-rose-300 rounded-2xl text-rose-950 text-xs shadow-xs animate-in fade-in duration-200">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 bg-rose-100 rounded-xl text-rose-700 shrink-0 mt-0.5">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <p className="font-extrabold text-[12px] text-rose-900">
                          Akses Login Ditolak: Akun Google Belum Terdaftar
                        </p>
                        <p className="text-[11px] text-rose-800 leading-relaxed">
                          Email Google <strong className="underline text-rose-950">{unregisteredGoogleInfo.email}</strong> belum terdaftar di sistem. Kebijakan keamanan melarang login Google sebelum akun resmi terdaftar.
                        </p>
                        <div className="pt-1.5 flex flex-wrap items-center gap-2">
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
                              setIsFlipped(true);
                              setUnregisteredGoogleInfo(null);
                              setErrorMessage(null);
                            }}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-[11px] rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Daftar dengan Email Ini Sekarang (Flip ⟳)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setUnregisteredGoogleInfo(null)}
                            className="text-[10px] text-slate-500 hover:text-slate-700 font-medium px-2 py-1 cursor-pointer"
                          >
                            Abaikan
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleManualLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Username atau Email Terdaftar
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
                        placeholder="Contoh: admin atau nama@domain.com"
                        className="w-full text-xs pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-hidden text-slate-900 font-medium transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        Kata Sandi (Password)
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
                        placeholder="Masukkan kata sandi akun"
                        className="w-full text-xs pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-hidden text-slate-900 font-medium transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 border-slate-300 w-4 h-4"
                      />
                      <span>Simpan sesi login</span>
                    </label>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-blue-600" />
                      <span>Aman Terisolasi</span>
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    id="btn-submit-login"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-3"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Mengautentikasi Sesi...</span>
                      </span>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>Masuk ke Dashboard</span>
                      </>
                    )}
                  </button>

                  <div className="relative my-3.5">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-[11px]">
                      <span className="bg-white px-2.5 text-slate-500 font-semibold">atau masuk via cloud</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading || isGoogleLoading}
                    id="btn-google-login"
                    className="w-full py-2.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
                  >
                    {isGoogleLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-slate-700 font-semibold">Menghubungkan Firebase...</span>
                      </span>
                    ) : (
                      <>
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                        <span>Masuk dengan Google (Firebase Auth)</span>
                      </>
                    )}
                  </button>

                  {/* Registered Google requirement notice */}
                  <div className="mt-2 text-center">
                    <p className="text-[10.5px] text-slate-500 font-medium inline-flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Khusus email yang telah terdaftar. Akun baru wajib mendaftar akun terlebih dahulu.</span>
                    </p>
                  </div>

                  {/* Popup Blocked Assistance Card */}
                  {popupBlocked && (
                    <div className="mt-2.5 p-3 bg-amber-50/90 border border-amber-300/80 rounded-xl text-amber-950 text-xs animate-in fade-in duration-200">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-2 flex-1">
                          <div>
                            <p className="font-bold text-[11px] text-amber-900">
                              Popup Google dibatasi oleh browser / mode iframe
                            </p>
                            <p className="text-[10px] text-amber-800 mt-0.5 leading-relaxed">
                              Pilih salah satu solusi instan di bawah ini:
                            </p>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-1.5 pt-0.5">
                            <button
                              type="button"
                              onClick={() => window.open(window.location.href, '_blank')}
                              className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-[10px] rounded-lg shadow-2xs flex items-center justify-center gap-1 cursor-pointer transition-all"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Buka di Tab Baru</span>
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
                              className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-amber-300 text-amber-900 font-bold text-[10px] rounded-lg shadow-2xs flex items-center justify-center gap-1 cursor-pointer transition-all"
                            >
                              <ShieldCheck className="w-3 h-3 text-blue-600" />
                              <span>Masuk Cepat: Admin</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick Preset Login Chips */}
                  <div className="pt-2 flex items-center justify-center gap-2 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 font-medium">Akses Cepat:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setUsername('admin');
                        setPassword('password123');
                      }}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 text-[10px] font-semibold rounded-md transition-colors cursor-pointer"
                      title="Isi kredensial Admin"
                    >
                      Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUsername('kasir');
                        setPassword('password123');
                      }}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 text-[10px] font-semibold rounded-md transition-colors cursor-pointer"
                      title="Isi kredensial Kasir"
                    >
                      Kasir
                    </button>
                  </div>
                </form>
              </div>

              {/* Bottom Card Flip Switcher */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <div>
                  <p className="text-xs font-bold text-slate-700">
                    Pemilik Usaha / Admin Baru?
                  </p>
                  <p className="text-[10.5px] text-slate-500">
                    Akun Kasir dibuat & diatur langsung oleh Admin di dalam Dashboard
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsFlipped(true);
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="font-bold text-blue-700 hover:text-blue-800 text-xs inline-flex items-center gap-1.5 hover:underline cursor-pointer bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 transition-colors shrink-0"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Daftar Akun Admin</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* ===================================================================== */}
            {/* CARD BACK FACE: FORM REGISTER (3D FLIPPED 180 DEG) */}
            {/* ===================================================================== */}
            <div
              className={`col-start-1 row-start-1 w-full h-full bg-white text-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl shadow-slate-200/60 border border-slate-200/90 flex flex-col justify-between ${
                !isFlipped ? 'pointer-events-none' : 'pointer-events-auto'
              }`}
              aria-hidden={!isFlipped}
              inert={!isFlipped ? true : undefined}
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg) translateZ(1px)',
                WebkitTransform: 'rotateY(180deg) translateZ(1px)',
              }}
            >
              <div>
                {/* Header Back & Flip Button */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold uppercase mb-1">
                      <ShieldCheck className="w-3 h-3 text-blue-600" />
                      <span>Registrasi Khusus Admin</span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                      Daftar Akun Admin Baru
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Pendaftaran Pemilik Outlet. Akun kasir dikelola via Dashboard.
                    </p>
                  </div>

                  {/* Flip Back Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsFlipped(false);
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    id="btn-flip-to-login"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-2xl text-xs font-bold transition-all cursor-pointer group"
                    title="Kembali ke formulir login (Flip balik)"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-600 transition-transform group-hover:-rotate-180 duration-500" />
                    <span>Kembali Masuk</span>
                    <span className="text-[9px] bg-slate-800 text-white px-1.5 py-0.5 rounded-full font-extrabold uppercase">
                      Flip ⟳
                    </span>
                  </button>
                </div>

                {/* Feedback Alerts on Register Card */}
                {errorMessage && (
                  <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span className="font-medium">{errorMessage}</span>
                  </div>
                )}

                {/* Email Validation Notice on Register Card */}
                {emailValidationSentTo && (
                  <div className="mb-3.5 p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-950 text-xs animate-in fade-in">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1 bg-emerald-100 rounded-lg text-emerald-700 shrink-0 mt-0.5">
                        <Mail className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="font-extrabold text-[11.5px] text-emerald-950">
                          Email Validasi Telah Terkirim!
                        </p>
                        <p className="text-[10.5px] text-emerald-800 leading-relaxed">
                          Link konfirmasi dikirim ke <strong>{emailValidationSentTo}</strong>. Periksa inbox/spam Anda untuk validasi.
                        </p>
                        <button
                          type="button"
                          onClick={handleResendValidationEmail}
                          disabled={isSendingVerification}
                          className="mt-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                        >
                          {isSendingVerification ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Send className="w-3 h-3" />
                          )}
                          <span>Kirim Ulang Validasi</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Registration Form */}
                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Nama Lengkap */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Nama Lengkap <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Contoh: Siti Rahmawati"
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-hidden text-slate-900 font-medium"
                      />
                    </div>

                    {/* Email Aktif (Wajib untuk validasi) */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-blue-600" />
                          <span>Alamat Email Aktif</span>
                          <span className="text-rose-500">*</span>
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          Wajib Validasi
                        </span>
                      </label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="nama@gmail.com"
                        className={`w-full text-xs px-3 py-2 bg-slate-50 border rounded-xl focus:ring-2 focus:bg-white focus:outline-hidden text-slate-900 font-medium ${
                          isDuplicateEmail
                            ? 'border-rose-400 focus:ring-rose-500'
                            : 'border-slate-200 focus:ring-blue-600'
                        }`}
                      />
                      {isDuplicateEmail ? (
                        <p className="text-[10px] text-rose-600 font-medium mt-0.5">
                          Email ini sudah terdaftar di sistem.
                        </p>
                      ) : (
                        <p className="text-[9.5px] text-slate-400 font-normal mt-0.5">
                          Link validasi/konfirmasi akan dikirim ke email ini.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Username */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Username Login <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={regUsername}
                        onChange={(e) =>
                          setRegUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))
                        }
                        placeholder="Contoh: siti_kasir"
                        className={`w-full text-xs px-3 py-2 bg-slate-50 border rounded-xl focus:ring-2 focus:bg-white focus:outline-hidden text-slate-900 font-medium ${
                          isDuplicateUsername
                            ? 'border-rose-400 focus:ring-rose-500'
                            : 'border-slate-200 focus:ring-blue-600'
                        }`}
                      />
                      {isDuplicateUsername && (
                        <p className="text-[10px] text-rose-600 font-medium mt-0.5">
                          Username sudah terdaftar.
                        </p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        No. HP / WA <span className="text-slate-400 font-normal">(Opsional)</span>
                      </label>
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="Contoh: 081234567890"
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-hidden text-slate-900 font-medium"
                      />
                    </div>
                  </div>

                  {/* Role Display: Strictly Admin (Kasir diatur di Dashboard) */}
                  <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-[#003366] text-white rounded-lg shrink-0">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-extrabold text-xs text-blue-950 block">
                            Peran Akun: Admin (Pemilik Outlet)
                          </span>
                          <span className="text-[10px] text-blue-800">
                            Akses penuh terminal, rekening kas, & laporan usaha
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Admin Only
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-blue-200/60 flex items-start gap-1.5 text-[10.5px] text-blue-900 leading-snug">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                      <span>
                        <strong>Catatan Akun Kasir:</strong> Akun Operator Kasir tidak mendaftar di sini, melainkan dibuatkan dan diatur langsung oleh Admin di dalam <strong>Dashboard Admin</strong> pada menu <em>Hak Akses & Kasir</em>.
                      </span>
                    </div>
                  </div>

                  {/* Shift Notes */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Shift / Catatan Akses <span className="text-slate-400 font-normal">(Opsional)</span>
                    </label>
                    <input
                      type="text"
                      value={regNotes}
                      onChange={(e) => setRegNotes(e.target.value)}
                      placeholder="Contoh: Shift Pagi / Kasir Cabang Utama"
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-hidden text-slate-900 font-medium"
                    />
                  </div>

                  {/* Password & Confirm */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Kata Sandi <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Min. 6 karakter"
                          className="w-full text-xs pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-hidden text-slate-900 font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        >
                          {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Konfirmasi Kata Sandi <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showRegConfirmPassword ? 'text' : 'password'}
                          required
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="Ulangi kata sandi"
                          className="w-full text-xs pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-hidden text-slate-900 font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        >
                          {showRegConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Auto-login checkbox */}
                  <div className="pt-0.5 flex items-center justify-between text-xs">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                      <input
                        type="checkbox"
                        checked={autoLoginAfterRegister}
                        onChange={(e) => setAutoLoginAfterRegister(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 w-4 h-4"
                      />
                      <span className="text-[11px]">Langsung masuk setelah pendaftaran berhasil</span>
                    </label>
                  </div>

                  {/* Register Submit Button */}
                  <button
                    type="submit"
                    disabled={isRegistering || isDuplicateUsername || isDuplicateEmail || !regEmail || !regUsername || !regPassword || !regName}
                    id="btn-submit-register"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isRegistering ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Mendaftarkan Akun & Mengirim Email Validasi...</span>
                      </span>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Daftarkan Akun Admin & Kirim Validasi Email</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Bottom Back to Login */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Sudah punya akun terdaftar?</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsFlipped(false);
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="font-bold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Masuk ke Sistem (Flip ⟳)</span>
                </button>
              </div>
            </div>
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
