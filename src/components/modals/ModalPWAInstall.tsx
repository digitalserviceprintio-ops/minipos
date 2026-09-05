import React from 'react';
import {
  Download,
  X,
  Smartphone,
  Monitor,
  Tablet,
  CheckCircle2,
  Share2,
  PlusSquare,
  Sparkles,
  WifiOff,
  Zap,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface ModalPWAInstallProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModalPWAInstall: React.FC<ModalPWAInstallProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isStandalone, install } = usePWAInstall();

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-linear-to-r from-blue-700 via-blue-600 to-indigo-700 p-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-white p-1 shadow-lg shrink-0 flex items-center justify-center overflow-hidden border border-white/20">
              <img
                src="/logo.png"
                alt="Mini ATM App Logo"
                className="w-full h-full object-contain rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full text-blue-100">
                  Progressive Web App (PWA)
                </span>
              </div>
              <h2 className="text-xl font-bold mt-1">Install Aplikasi Mini ATM</h2>
              <p className="text-xs text-blue-100 mt-0.5">
                Dapat diinstall di Desktop PC/Laptop, Tablet, dan Smartphone
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-slate-700 text-sm">
          {/* Status banner */}
          {isStandalone || isInstalled ? (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs">
                <span className="font-bold block text-sm">Aplikasi Sudah Terinstall!</span>
                Anda saat ini menjalankan Mini ATM dalam mode Standalone App.
              </div>
            </div>
          ) : (
            <>
              {/* Feature Highlights */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-1">
                  <div className="w-7 h-7 mx-auto rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Monitor className="w-4 h-4" />
                  </div>
                  <div className="text-[11px] font-bold text-slate-800">Desktop & Laptop</div>
                  <div className="text-[10px] text-slate-500">Windows, Mac, Linux</div>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-1">
                  <div className="w-7 h-7 mx-auto rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <Tablet className="w-4 h-4" />
                  </div>
                  <div className="text-[11px] font-bold text-slate-800">Tablet & iPad</div>
                  <div className="text-[10px] text-slate-500">Layar sentuh kasir</div>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-1">
                  <div className="w-7 h-7 mx-auto rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div className="text-[11px] font-bold text-slate-800">Smartphone</div>
                  <div className="text-[10px] text-slate-500">Android & iPhone</div>
                </div>
              </div>

              {/* Install Action for Supported Browsers (Chrome / Edge / Android) */}
              {isInstallable && (
                <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-700" />
                      <span className="font-bold text-xs text-blue-900">
                        Browser Siap Pasang Langsung
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">
                      1-Klik
                    </span>
                  </div>
                  <p className="text-xs text-blue-800">
                    Klik tombol di bawah untuk memasang Mini ATM langsung ke desktop atau beranda perangkat Anda.
                  </p>
                  <button
                    onClick={handleInstallClick}
                    className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Pasang / Install Sekarang</span>
                  </button>
                </div>
              )}

              {/* Step by step guides */}
              <div className="space-y-3 border-t border-slate-100 pt-3">
                <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Petunjuk Pemasangan Sesuai Perangkat:</span>
                </div>

                {/* Desktop Guide */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="font-semibold text-xs text-slate-800 flex items-center gap-2">
                    <Monitor className="w-3.5 h-3.5 text-blue-600" />
                    <span>Di Komputer / Laptop (Google Chrome / Microsoft Edge):</span>
                  </div>
                  <ol className="text-xs text-slate-600 list-decimal list-inside space-y-1 pl-1">
                    <li>
                      Perhatikan ikon <strong>Install Aplikasi</strong> (simbol komputer/panah unduh) di bilah alamat browser (URL bar sebelah kanan).
                    </li>
                    <li>
                      Klik ikon tersebut lalu pilih <strong>Install</strong>.
                    </li>
                    <li>
                      Ikon <strong>Mini ATM</strong> akan otomatis muncul di Desktop dan Start Menu Anda.
                    </li>
                  </ol>
                </div>

                {/* Mobile / Tablet Guide */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="font-semibold text-xs text-slate-800 flex items-center gap-2">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Di Smartphone Android & Tablet:</span>
                  </div>
                  <ol className="text-xs text-slate-600 list-decimal list-inside space-y-1 pl-1">
                    <li>Buka menu browser Chrome (titik tiga ⋮ di pojok kanan atas).</li>
                    <li>
                      Pilih menu <strong>"Tambahkan ke Layar Utama"</strong> atau <strong>"Install Aplikasi"</strong>.
                    </li>
                    <li>Konfirmasi nama aplikasi, dan ikon Mini ATM siap digunakan seperti aplikasi native.</li>
                  </ol>
                </div>

                {/* iOS Guide */}
                {isIOS && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
                    <div className="font-semibold text-xs text-amber-900 flex items-center gap-2">
                      <Share2 className="w-3.5 h-3.5 text-amber-700" />
                      <span>Di iPhone / iPad (Safari):</span>
                    </div>
                    <ol className="text-xs text-amber-800 list-decimal list-inside space-y-1 pl-1">
                      <li>
                        Tekan tombol <strong>Share / Bagikan</strong> (ikon kotak dengan panah ke atas) di bilah bawah Safari.
                      </li>
                      <li>
                        Gulir ke bawah dan ketuk <strong>"Tambahkan ke Layar Utama"</strong> (Add to Home Screen).
                      </li>
                      <li>
                        Ketuk <strong>Tambah</strong> di pojok kanan atas.
                      </li>
                    </ol>
                  </div>
                )}
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Membuka tanpa bilah browser</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <WifiOff className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Dukungan offline caching</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Responsif tablet kasir & mobile</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Kecepatan memuat seketika</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Versi PWA 2.5 • Mini ATM
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-800 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
