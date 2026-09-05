import React, { useState, useMemo } from 'react';
import {
  FileBarChart,
  Printer,
  Download,
  Filter,
  RotateCcw,
  TrendingUp,
  CreditCard,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { Account, Transaction, AgentProfile, PrinterSettings } from '../../types';
import { formatRp } from '../../utils/formatters';
import { ModalPrintReport, ReportPrintData } from '../modals/ModalPrintReport';
import { generateAgentReportHtml } from '../../utils/reportPrinterService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export type PeriodFilter = 'ALL' | 'TODAY' | 'YESTERDAY' | '7D' | '30D' | 'LAST_MONTH' | 'CUSTOM';

// Format Date to YYYY-MM-DD for HTML input
function toDateInputValue(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to parse date
function parseTrxDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const isoDate = new Date(dateStr);
  if (!isNaN(isoDate.getTime())) return isoDate;

  // DD/MM/YYYY or DD-MM-YYYY
  const slashMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (slashMatch) {
    const d = parseInt(slashMatch[1], 10);
    const m = parseInt(slashMatch[2], 10) - 1;
    const y = parseInt(slashMatch[3], 10);
    return new Date(y, m, d);
  }

  const indonesianMonths: { [key: string]: number } = {
    jan: 0, feb: 1, mar: 2, apr: 3, mei: 4, may: 4, jun: 5,
    jul: 6, agu: 7, aug: 7, sep: 8, okt: 9, oct: 9, nov: 10, des: 11, dec: 11,
  };

  const parts = dateStr.trim().split(/[\s,]+/);
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10);
    const monthKey = parts[1].toLowerCase().slice(0, 3);
    const month = indonesianMonths[monthKey];
    const year = parseInt(parts[2], 10);

    if (!isNaN(day) && month !== undefined && !isNaN(year)) {
      let hours = 0;
      let minutes = 0;
      if (parts[3] && parts[3].includes(':')) {
        const timeParts = parts[3].split(':');
        hours = parseInt(timeParts[0], 10) || 0;
        minutes = parseInt(timeParts[1], 10) || 0;
      }
      return new Date(year, month, day, hours, minutes);
    }
  }
  return null;
}

interface LaporanDetailViewProps {
  transactions?: Transaction[];
  accounts?: Account[];
  profile?: AgentProfile;
  printerSettings?: PrinterSettings;
  operatorName?: string;
  onExportCSV: () => void;
}

export const LaporanDetailView: React.FC<LaporanDetailViewProps> = ({
  transactions = [],
  accounts = [],
  profile,
  printerSettings,
  operatorName = 'Administrator',
  onExportCSV,
}) => {
  const [period, setPeriod] = useState<PeriodFilter>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterAccount, setFilterAccount] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [printData, setPrintData] = useState<ReportPrintData | null>(null);

  const activeProfile: AgentProfile = profile || {
    storeName: 'MINI ATM & AGEN LINK',
    ownerName: 'Administrator',
    phone: '',
    address: '',
    idAgent: 'AG-01',
  };

  const accountMap = useMemo(() => {
    return new Map((accounts || []).map((a) => [a.id, a.name]));
  }, [accounts]);

  // Preset handler
  const handleSetPreset = (preset: PeriodFilter) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    setPeriod(preset);

    if (preset === 'ALL') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'TODAY') {
      const tStr = toDateInputValue(today);
      setStartDate(tStr);
      setEndDate(tStr);
    } else if (preset === 'YESTERDAY') {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yStr = toDateInputValue(yesterday);
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (preset === '7D') {
      const past7 = new Date(today);
      past7.setDate(today.getDate() - 6);
      setStartDate(toDateInputValue(past7));
      setEndDate(toDateInputValue(today));
    } else if (preset === '30D') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(toDateInputValue(firstDay));
      setEndDate(toDateInputValue(today));
    } else if (preset === 'LAST_MONTH') {
      const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      setStartDate(toDateInputValue(firstDayLastMonth));
      setEndDate(toDateInputValue(lastDayLastMonth));
    }
  };

  const handleCustomDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setPeriod('CUSTOM');
  };

  const handleResetDateRange = () => {
    setStartDate('');
    setEndDate('');
    setPeriod('ALL');
  };

  const getReadablePeriodLabel = (): string => {
    if (startDate && endDate) {
      return `Rentang: ${startDate} s/d ${endDate}`;
    }
    if (startDate) {
      return `Mulai: ${startDate}`;
    }
    if (endDate) {
      return `Akhir: ${endDate}`;
    }
    switch (period) {
      case 'TODAY':
        return 'Periode: Hari Ini';
      case 'YESTERDAY':
        return 'Periode: Kemarin';
      case '7D':
        return 'Periode: 7 Hari Terakhir';
      case '30D':
        return 'Periode: Bulan Ini';
      case 'LAST_MONTH':
        return 'Periode: Bulan Lalu';
      default:
        return 'Periode: Semua Waktu';
    }
  };

  const resetFilters = () => {
    setFilterType('ALL');
    setFilterAccount('ALL');
    setFilterStatus('ALL');
    setFilterSearch('');
    setPeriod('ALL');
    setStartDate('');
    setEndDate('');
  };

  const isDateInPeriod = (trxTime?: string): boolean => {
    if (!trxTime) return true;
    if (startDate || endDate) {
      const d = parseTrxDate(trxTime);
      if (!d) return true;
      if (startDate) {
        const start = new Date(startDate + 'T00:00:00');
        if (d < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate + 'T23:59:59.999');
        if (d > end) return false;
      }
      return true;
    }

    if (period === 'ALL') return true;
    const d = parseTrxDate(trxTime);
    if (!d) return true;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (period === 'TODAY') {
      return d >= today;
    }
    if (period === 'YESTERDAY') {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      return d >= yesterday && d < today;
    }
    if (period === '7D') {
      const past7 = new Date(today);
      past7.setDate(today.getDate() - 7);
      return d >= past7;
    }
    if (period === '30D') {
      const past30 = new Date(today);
      past30.setDate(today.getDate() - 30);
      return d >= past30;
    }
    return true;
  };

  const filteredTransactions = useMemo(() => {
    return (transactions || []).filter((t) => {
      if (!t) return false;
      if (!isDateInPeriod(t.time)) return false;

      const matchType = filterType === 'ALL' || t.type === filterType;
      const matchAcc = filterAccount === 'ALL' || t.accountId === filterAccount;
      const matchStatus = filterStatus === 'ALL' || t.status === filterStatus;
      const q = filterSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        (t.cust && t.cust.toLowerCase().includes(q)) ||
        (t.target && t.target.toLowerCase().includes(q)) ||
        t.id.toLowerCase().includes(q) ||
        (t.notes && t.notes.toLowerCase().includes(q));

      return matchType && matchAcc && matchStatus && matchSearch;
    });
  }, [transactions, period, startDate, endDate, filterType, filterAccount, filterStatus, filterSearch]);

  // Key stats
  const stats = useMemo(() => {
    let totalGross = 0;
    let totalNet = 0;
    let totalFeeCust = 0;
    let totalFeeAdmin = 0;
    let validCount = 0;

    filteredTransactions.forEach((t) => {
      if (t.status !== 'VOID') {
        totalGross += t.nominal;
        totalFeeCust += t.feeCust;
        totalFeeAdmin += t.feeAdmin;
        totalNet += t.feeCust - t.feeAdmin;
        validCount++;
      }
    });

    const avgNominal = validCount > 0 ? Math.round(totalGross / validCount) : 0;

    return {
      totalGross,
      totalNet,
      totalFeeCust,
      totalFeeAdmin,
      totalCount: filteredTransactions.length,
      validCount,
      avgNominal,
    };
  }, [filteredTransactions]);

  // Chart 1: Line Chart Data (Trend)
  const lineChartData = useMemo(() => {
    const sorted = [...filteredTransactions].reverse();
    const labels = sorted.map((t) => {
      const parts = t.time.split(' ');
      return parts.length >= 4 ? `${parts[0]} ${parts[1]} ${parts[3]}` : t.id;
    });
    const nominals = sorted.map((t) => (t.status !== 'VOID' ? t.nominal : 0));
    const profits = sorted.map((t) => (t.status !== 'VOID' ? t.feeCust - t.feeAdmin : 0));

    return {
      labels: labels.length > 0 ? labels : ['Belum ada data'],
      datasets: [
        {
          label: 'Nominal Transaksi (Rp)',
          data: nominals.length > 0 ? nominals : [0],
          borderColor: '#0284c7',
          backgroundColor: 'rgba(2, 132, 199, 0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: '#0284c7',
        },
        {
          label: 'Profit Fee Bersih (Rp)',
          data: profits.length > 0 ? profits : [0],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: '#10b981',
        },
      ],
    };
  }, [filteredTransactions]);

  // Chart 2: Bar Chart Data (Category comparison)
  const barChartData = useMemo(() => {
    const catMap: Record<string, { nominal: number; profit: number }> = {};
    filteredTransactions.forEach((t) => {
      if (t.status !== 'VOID') {
        if (!catMap[t.type]) catMap[t.type] = { nominal: 0, profit: 0 };
        catMap[t.type].nominal += t.nominal;
        catMap[t.type].profit += t.feeCust - t.feeAdmin;
      }
    });

    const labels = Object.keys(catMap);
    const nominals = labels.map((l) => catMap[l].nominal);
    const profits = labels.map((l) => catMap[l].profit);

    return {
      labels: labels.length > 0 ? labels : ['Belum ada'],
      datasets: [
        {
          label: 'Total Nominal (Rp)',
          data: nominals.length > 0 ? nominals : [0],
          backgroundColor: '#3b82f6',
          borderRadius: 6,
        },
        {
          label: 'Total Net Profit (Rp)',
          data: profits.length > 0 ? profits : [0],
          backgroundColor: '#10b981',
          borderRadius: 6,
        },
      ],
    };
  }, [filteredTransactions]);

  // Chart 3: Pie Chart (Account Distribution)
  const pieChartData = useMemo(() => {
    const accCountMap: Record<string, number> = {};
    filteredTransactions.forEach((t) => {
      if (t.status !== 'VOID') {
        const name = accountMap.get(t.accountId) || 'Utama';
        accCountMap[name] = (accCountMap[name] || 0) + 1;
      }
    });

    const labels = Object.keys(accCountMap);
    const counts = labels.map((l) => accCountMap[l]);

    return {
      labels: labels.length > 0 ? labels : ['Tidak ada data'],
      datasets: [
        {
          data: counts.length > 0 ? counts : [1],
          backgroundColor: [
            '#0066cc',
            '#10b981',
            '#f59e0b',
            '#8b5cf6',
            '#ec4899',
            '#06b6d4',
          ],
        },
      ],
    };
  }, [filteredTransactions, accountMap]);

  // Chart 4: Doughnut Chart (Success vs Void)
  const statusChartData = useMemo(() => {
    const successCount = filteredTransactions.filter((t) => t.status === 'SUCCESS').length;
    const voidCount = filteredTransactions.filter((t) => t.status === 'VOID').length;

    return {
      labels: ['Sukses (Success)', 'Dibatalkan (Void)'],
      datasets: [
        {
          data: [successCount, voidCount],
          backgroundColor: ['#10b981', '#ef4444'],
        },
      ],
    };
  }, [filteredTransactions]);

  const handlePrint = () => {
    const successTrx = filteredTransactions.filter((t) => t.status !== 'VOID');
    const countTotal = filteredTransactions.length;
    const totalVolume = successTrx.reduce((acc, t) => acc + (t.nominal || 0), 0);
    const totalNetProfit = successTrx.reduce((acc, t) => acc + ((t.feeCust || 0) - (t.feeAdmin || 0)), 0);
    const totalFeeCust = successTrx.reduce((acc, t) => acc + (t.feeCust || 0), 0);

    const parts: string[] = [getReadablePeriodLabel()];
    if (filterType !== 'ALL') parts.push(`Layanan: ${filterType}`);
    if (filterStatus !== 'ALL') parts.push(`Status: ${filterStatus}`);
    if (filterAccount !== 'ALL') parts.push(`Rekening: ${accountMap.get(filterAccount) || filterAccount}`);
    if (filterSearch) parts.push(`Cari: "${filterSearch}"`);
    const periodLabel = parts.join(' | ');

    const htmlContent = generateAgentReportHtml({
      transactions: filteredTransactions,
      profile: activeProfile,
      periodLabel,
      operatorName,
    });

    setPrintData({
      title: 'Laporan Transaksi Detail & Visual Analytics',
      periodLabel,
      operatorName,
      count: countTotal,
      totalNominal: totalVolume,
      totalProfit: totalNetProfit,
      htmlContent,
      summaryItems: [
        { label: 'Total Transaksi Sukses', value: `${successTrx.length} Trx` },
        { label: 'Total Volume / Omzet', value: formatRp(totalVolume) },
        { label: 'Total Fee Nasabah', value: formatRp(totalFeeCust) },
        { label: 'Laba Bersih Agen', value: formatRp(totalNetProfit), isHighlight: true },
      ],
    });

    setIsPrintModalOpen(true);
  };

  return (
    <section id="view-laporan-detail" className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-blue-700" />
            <span>Laporan Transaksi Detail & Visual Analytics</span>
          </h2>
          <p className="text-xs text-slate-500">
            Analisis statistik komprehensif, grafik tren, dan distribusi rekening transaksi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Laporan</span>
          </button>
          <button
            onClick={onExportCSV}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Filter Controls Panel */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between border-b pb-2">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-blue-700" />
            Filter Laporan Detail
          </span>
          <button
            onClick={resetFilters}
            className="text-[11px] text-blue-700 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Filter</span>
          </button>
        </div>

        {/* Date Range & Period Filter (Mulai - Akhir Laporan) */}
        <div className="space-y-2.5 pb-2 border-b border-slate-100">
          <div className="flex items-center justify-between flex-wrap gap-2.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-600 mr-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Periode Cepat:</span>
              </span>
              {[
                { id: 'ALL', label: 'Semua Waktu' },
                { id: 'TODAY', label: 'Hari Ini' },
                { id: 'YESTERDAY', label: 'Kemarin' },
                { id: '7D', label: '7 Hari Terakhir' },
                { id: '30D', label: 'Bulan Ini' },
                { id: 'LAST_MONTH', label: 'Bulan Lalu' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSetPreset(p.id as PeriodFilter)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    period === p.id
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              {getReadablePeriodLabel()}
            </span>
          </div>

          {/* Date Picker Range Inputs (Tanggal Mulai - Akhir Laporan) */}
          <div className="flex items-center justify-between gap-3 p-2.5 bg-slate-50/80 rounded-xl border border-slate-200 flex-wrap">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-700" />
                <span>Rentang Tanggal Laporan:</span>
              </span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-slate-500">Tanggal Mulai:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => handleCustomDateChange(e.target.value, endDate)}
                    className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-medium text-slate-800 shadow-2xs"
                  />
                </div>
                <span className="text-xs font-semibold text-slate-400">s/d</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-slate-500">Akhir Laporan:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => handleCustomDateChange(startDate, e.target.value)}
                    className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-medium text-slate-800 shadow-2xs"
                  />
                </div>
              </div>

              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={handleResetDateRange}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-red-700 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                  title="Hapus filter rentang tanggal dan tampilkan semua waktu"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Tanggal</span>
                </button>
              )}
            </div>

            <div className="text-[11px] text-slate-500 font-medium">
              Menampilkan <strong className="text-slate-800">{filteredTransactions.length}</strong> transaksi
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Tipe Transaksi</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-slate-50/50"
            >
              <option value="ALL">Semua Tipe Transaksi</option>
              <option value="TARIK TUNAI">TARIK TUNAI</option>
              <option value="SETOR TUNAI">SETOR TUNAI</option>
              <option value="TRANSFER">TRANSFER</option>
              <option value="PEMBAYARAN">PEMBAYARAN</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Akun Kas / Rekening</label>
            <select
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-slate-50/50"
            >
              <option value="ALL">Semua Rekening</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Status Transaksi</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-slate-50/50"
            >
              <option value="ALL">Semua Status</option>
              <option value="SUCCESS">SUCCESS (Berhasil)</option>
              <option value="VOID">VOID (Dibatalkan)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Cari Kata Kunci</label>
            <input
              type="text"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="Nasabah, ID, Penerima..."
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-slate-50/50"
            />
          </div>
        </div>
      </div>

      {/* Summary KPI Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Nominal (Gross)
          </span>
          <p className="text-base sm:text-lg font-bold text-blue-900 leading-tight">
            {formatRp(stats.totalGross)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Profit Fee (Net)
          </span>
          <p className="text-base sm:text-lg font-bold text-emerald-600 leading-tight">
            {formatRp(stats.totalNet)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Jumlah Transaksi
          </span>
          <p className="text-base sm:text-lg font-bold text-slate-800 leading-tight">
            {stats.totalCount}{' '}
            <span className="text-xs font-normal text-slate-400">
              ({stats.validCount} valid)
            </span>
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Rata-Rata per Trx
          </span>
          <p className="text-base sm:text-lg font-bold text-indigo-700 leading-tight">
            {formatRp(stats.avgNominal)}
          </p>
        </div>
      </div>

      {/* 4 Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Line Chart */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Grafik Tren Transaksi & Profit
              </h4>
              <p className="text-[10px] text-slate-400">Pertumbuhan volume transaksi dan keuntungan</p>
            </div>
            <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded">
              Line Chart
            </span>
          </div>
          <div className="h-60 relative">
            <Line
              data={lineChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { labels: { font: { size: 10 } } },
                },
                scales: {
                  x: { ticks: { font: { size: 9 } } },
                  y: { ticks: { font: { size: 9 } } },
                },
              }}
            />
          </div>
        </div>

        {/* Chart 2: Bar Chart */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                Diagram Batang Per Kategori
              </h4>
              <p className="text-[10px] text-slate-400">
                Perbandingan nominal & fee berdasarkan jenis layanan
              </p>
            </div>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded">
              Bar Chart
            </span>
          </div>
          <div className="h-60 relative">
            <Bar
              data={barChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { labels: { font: { size: 10 } } },
                },
                scales: {
                  x: { ticks: { font: { size: 9 } } },
                  y: { ticks: { font: { size: 9 } } },
                },
              }}
            />
          </div>
        </div>

        {/* Chart 3: Pie Chart */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <PieIcon className="w-4 h-4 text-emerald-600" />
                Diagram Pie Distribusi Rekening
              </h4>
              <p className="text-[10px] text-slate-400">
                Porsi penggunaan akun kas & rekening bank
              </p>
            </div>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded">
              Pie Chart
            </span>
          </div>
          <div className="h-60 relative flex items-center justify-center">
            <Pie
              data={pieChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { font: { size: 10 } },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Chart 4: Doughnut Chart */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-amber-600" />
                Diagram Status Transaksi
              </h4>
              <p className="text-[10px] text-slate-400">Rasio transaksi Sukses vs Dibatalkan</p>
            </div>
            <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded">
              Doughnut
            </span>
          </div>
          <div className="h-60 relative flex items-center justify-center">
            <Doughnut
              data={statusChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { font: { size: 10 } },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Comprehensive Detailed Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden p-4 space-y-3" id="printableReport">
        <div className="flex items-center justify-between pb-2 border-b">
          <h4 className="font-bold text-xs text-slate-800">Rincian Tabel Laporan Transaksi Lengkap</h4>
          <span className="text-[11px] text-slate-500 font-mono">
            {filteredTransactions.length} Data Transaksi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold uppercase text-[10px]">
                <th className="p-2.5">ID Trx</th>
                <th className="p-2.5">Waktu</th>
                <th className="p-2.5">Tipe</th>
                <th className="p-2.5">Nasabah</th>
                <th className="p-2.5">Tujuan</th>
                <th className="p-2.5">Rekening</th>
                <th className="p-2.5 text-right">Nominal</th>
                <th className="p-2.5 text-right">Biaya Cust</th>
                <th className="p-2.5 text-right">Biaya Admin</th>
                <th className="p-2.5 text-right">Net Profit</th>
                <th className="p-2.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center p-6 text-slate-400">
                    Tidak ada transaksi yang memenuhi kriteria filter
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => {
                  const isVoid = t.status === 'VOID';
                  const netProfit = t.feeCust - t.feeAdmin;
                  const accName = accountMap.get(t.accountId) || 'Utama';

                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isVoid ? 'opacity-50 bg-slate-50' : ''
                      }`}
                    >
                      <td className="p-2.5 font-mono font-bold text-slate-700">#{t.id}</td>
                      <td className="p-2.5 font-mono text-slate-500 whitespace-nowrap">{t.time}</td>
                      <td className="p-2.5 font-semibold text-slate-800">{t.type}</td>
                      <td className="p-2.5 text-slate-800">{t.cust}</td>
                      <td className="p-2.5 text-slate-600">{t.target}</td>
                      <td className="p-2.5 text-slate-600">{accName}</td>
                      <td className="p-2.5 text-right font-bold text-slate-900">
                        {formatRp(t.nominal)}
                      </td>
                      <td className="p-2.5 text-right text-slate-600 font-medium">
                        {formatRp(t.feeCust)}
                      </td>
                      <td className="p-2.5 text-right text-slate-500 font-medium">
                        {formatRp(t.feeAdmin)}
                      </td>
                      <td
                        className={`p-2.5 text-right font-bold ${
                          netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {isVoid ? 'Rp 0' : formatRp(netProfit)}
                      </td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            isVoid ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredTransactions.length > 0 && (
              <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-800">
                <tr>
                  <td colSpan={6} className="p-2.5 text-right uppercase font-bold text-slate-600">
                    Total Ringkasan:
                  </td>
                  <td className="p-2.5 text-right font-bold text-blue-900">
                    {formatRp(stats.totalGross)}
                  </td>
                  <td className="p-2.5 text-right font-bold text-slate-700">
                    {formatRp(stats.totalFeeCust)}
                  </td>
                  <td className="p-2.5 text-right font-bold text-slate-500">
                    {formatRp(stats.totalFeeAdmin)}
                  </td>
                  <td className="p-2.5 text-right font-bold text-emerald-600">
                    {formatRp(stats.totalNet)}
                  </td>
                  <td className="p-2.5"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Modal Pratinjau & Cetak Laporan */}
      <ModalPrintReport
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        reportData={printData}
        profile={activeProfile}
        printerSettings={printerSettings}
        onExportExcel={onExportCSV}
      />
    </section>
  );
};
