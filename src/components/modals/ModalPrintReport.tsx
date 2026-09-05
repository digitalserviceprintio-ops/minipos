import React, { useState } from 'react';
import {
  X,
  Printer,
  FileText,
  ExternalLink,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Receipt,
  Store,
} from 'lucide-react';
import { AgentProfile, PrinterSettings } from '../../types';
import { printHtmlDocument, openInNewTab, executeThermalReportPrint } from '../../utils/reportPrinterService';
import { formatRp } from '../../utils/formatters';

export interface ReportPrintData {
  title: string;
  periodLabel: string;
  operatorName: string;
  count: number;
  totalNominal: number;
  totalProfit: number;
  htmlContent: string;
  summaryItems?: { label: string; value: string | number; isHighlight?: boolean }[];
}

const DEFAULT_PRINTER_SETTINGS: PrinterSettings = {
  connectionType: 'browser',
  paperWidth: '58mm',
  autoPrintOnSuccess: false,
  printCopies: 1,
  autoCut: true,
  showLogo: true,
  showIdAgent: true,
  showRefNumber: true,
  showNotes: true,
  showFooter: true,
  customFooterNote: 'Terima Kasih',
  bluetoothDeviceName: null,
  serialPortName: null,
  printerDensity: 'normal',
};

interface ModalPrintReportProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: ReportPrintData | null;
  profile: AgentProfile;
  printerSettings?: PrinterSettings;
  onExportExcel?: () => void;
}

export const ModalPrintReport: React.FC<ModalPrintReportProps> = ({
  isOpen,
  onClose,
  reportData,
  profile,
  printerSettings = DEFAULT_PRINTER_SETTINGS,
  onExportExcel,
}) => {
  const [isPrintingDoc, setIsPrintingDoc] = useState(false);
  const [isPrintingThermal, setIsPrintingThermal] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen || !reportData) return null;

  const handlePrintDocument = async () => {
    setIsPrintingDoc(true);
    setFeedback(null);
    try {
      const result = await printHtmlDocument(reportData.htmlContent, reportData.title);
      if (result.success) {
        setFeedback({
          type: 'success',
          message: result.openedInNewTab
            ? 'Dokumen dibuka di tab/jendela baru browser untuk dicetak.'
            : 'Dialog cetak printer sistem telah dibuka.',
        });
      } else {
        setFeedback({
          type: 'error',
          message: result.message,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedback({ type: 'error', message: `Gagal mencetak: ${msg}` });
    } finally {
      setIsPrintingDoc(false);
    }
  };

  const handlePrintThermal = async () => {
    setIsPrintingThermal(true);
    setFeedback(null);
    try {
      const result = await executeThermalReportPrint({
        title: reportData.title,
        profile,
        periodLabel: reportData.periodLabel,
        count: reportData.count,
        totalNominal: reportData.totalNominal,
        totalProfit: reportData.totalProfit,
        operatorName: reportData.operatorName,
        settings: printerSettings,
      });

      if (result.success) {
        setFeedback({
          type: 'success',
          message: result.message || 'Struk ringkasan laporan dikirim ke printer thermal.',
        });
      } else {
        setFeedback({
          type: 'error',
          message: result.message || 'Gagal mencetak ke printer thermal.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedback({ type: 'error', message: `Gagal mencetak thermal: ${msg}` });
    } finally {
      setIsPrintingThermal(false);
    }
  };

  const handleOpenNewTab = () => {
    openInNewTab(reportData.htmlContent, reportData.title);
    setFeedback({
      type: 'success',
      message: 'Pratinjau laporan dibuka di tab baru browser.',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 shadow-2xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
                <span>Pratinjau & Cetak Laporan</span>
              </h3>
              <p className="text-xs text-slate-500">
                {reportData.title} &bull; Periode: <strong className="text-slate-700">{reportData.periodLabel}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200/80 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Konten Pratinjau Dokumen */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 animate-in fade-in duration-150 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="font-medium">{feedback.message}</span>
            </div>
          )}

          {/* Kartu Ringkasan Data Laporan */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <Store className="w-4 h-4 text-blue-600" />
                <span>{profile.storeName || 'MINI ATM AGEN LINK'}</span>
              </div>
              <span className="text-[11px] text-slate-500">
                Operator: <strong className="text-slate-700">{reportData.operatorName}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Total Transaksi</div>
                <div className="text-sm font-extrabold text-blue-700">{reportData.count} Trx</div>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Total Volume / Omzet</div>
                <div className="text-sm font-extrabold text-slate-800">{formatRp(reportData.totalNominal)}</div>
              </div>
              <div className="col-span-2 sm:col-span-1 bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Laba / Keuntungan</div>
                <div className="text-sm font-extrabold text-emerald-600">{formatRp(reportData.totalProfit)}</div>
              </div>
            </div>

            {reportData.summaryItems && reportData.summaryItems.length > 0 && (
              <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs">
                {reportData.summaryItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-slate-600">
                    <span>{item.label}:</span>
                    <strong className={item.isHighlight ? 'text-emerald-700' : 'text-slate-800'}>
                      {item.value}
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Kotak Panduan Cetak */}
          <div className="text-xs text-slate-600 bg-blue-50/60 border border-blue-100 rounded-xl p-3 flex items-start gap-2.5">
            <FileText className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold text-blue-900">Format Cetak Fleksibel:</span> Anda dapat mencetak dokumen
              lengkap dalam format kertas <strong>A4/F4 (PDF / Printer Standar)</strong> atau mencetak ringkasan rekap
              ke <strong>Printer Thermal Kasir (58mm/80mm)</strong>. Jika browser di dalam iframe membatasi dialog
              cetak, gunakan tombol <em>Buka di Tab Baru</em>.
            </div>
          </div>
        </div>

        {/* Footer Tombol Aksi */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenNewTab}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Buka pratinjau halaman cetak di tab baru browser"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>Buka di Tab Baru</span>
            </button>
            {onExportExcel && (
              <button
                onClick={onExportExcel}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Ekspor data ke file Excel XLSX"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export Excel</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Tombol Cetak Struk Thermal */}
            <button
              onClick={handlePrintThermal}
              disabled={isPrintingThermal || isPrintingDoc}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 flex items-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
              title="Cetak struk ringkasan ke printer thermal Bluetooth / USB kasir"
            >
              {isPrintingThermal ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
              ) : (
                <Receipt className="w-3.5 h-3.5 text-amber-700" />
              )}
              <span>Cetak Thermal</span>
            </button>

            {/* Tombol Cetak Dokumen A4 / PDF Utama */}
            <button
              onClick={handlePrintDocument}
              disabled={isPrintingDoc || isPrintingThermal}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-700 hover:bg-blue-800 text-white flex items-center gap-2 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              title="Buka dialog cetak printer dokumen A4 / PDF"
            >
              {isPrintingDoc ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <Printer className="w-4 h-4 text-white" />
              )}
              <span>Cetak Dokumen (A4 / PDF)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
