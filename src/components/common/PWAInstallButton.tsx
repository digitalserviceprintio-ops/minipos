import React, { useState } from 'react';
import { Download, Check } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { ModalPWAInstall } from '../modals/ModalPWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'sidebar' | 'compact';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { isInstallable, isInstalled, isStandalone, install } = usePWAInstall();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        setIsModalOpen(true);
      }
    } else {
      setIsModalOpen(true);
    }
  };

  // If already running as installed standalone app on the device
  if (isStandalone || isInstalled) {
    if (variant === 'sidebar') {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-900/40 rounded-xl text-[11px] text-blue-200 border border-blue-800/60">
          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Aplikasi Terinstall (PWA)</span>
        </div>
      );
    }
    return null;
  }

  if (variant === 'sidebar') {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer group ${className}`}
          title="Install Aplikasi di Desktop, Tablet, atau HP"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-white">
              <Download className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-left">
              <div className="font-bold leading-tight">Install Aplikasi</div>
              <div className="text-[10px] text-blue-100 font-normal leading-tight">Desktop, Tablet & HP</div>
            </div>
          </div>
          <span className="text-[10px] bg-white/20 text-white font-bold px-1.5 py-0.5 rounded-full">
            App
          </span>
        </button>

        <ModalPWAInstall isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    );
  }

  if (variant === 'compact') {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          className={`p-1.5 text-blue-700 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold ${className}`}
          title="Install Aplikasi Mini ATM"
        >
          <Download className="w-4 h-4 text-blue-700" />
          <span className="hidden sm:inline">Install</span>
        </button>
        <ModalPWAInstall isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    );
  }

  // Default header variant
  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-700 border border-blue-200 text-xs font-bold transition-all shadow-2xs cursor-pointer ${className}`}
        title="Pasang Mini ATM di Komputer, Tablet, atau HP"
      >
        <div className="w-4 h-4 rounded-full bg-blue-700 text-white flex items-center justify-center shrink-0">
          <Download className="w-2.5 h-2.5" />
        </div>
        <span className="hidden md:inline">Install App</span>
        <span className="md:hidden">Install</span>
      </button>

      <ModalPWAInstall isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
