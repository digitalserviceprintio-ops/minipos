import { AgentProfile, Transaction, PosSale, Product, PrinterSettings } from '../types';
import { formatRp, formatDateTime } from './formatters';
import { executeQuickPrint } from './thermalPrinterService';

/**
 * Universal HTML document printer that supports:
 * 1. Hidden iframe printing (bypasses direct window sandbox issues)
 * 2. Window.open / Blob URL fallback if iframe print is blocked
 * 3. Interactive feedback for the user
 */
export async function printHtmlDocument(
  htmlContent: string,
  docTitle: string = 'Laporan_Transaksi'
): Promise<{ success: boolean; message: string; openedInNewTab?: boolean }> {
  return new Promise((resolve) => {
    try {
      // 1. Coba cetak melalui Iframe tersembunyi
      const frameId = 'report-print-frame';
      let iframe = document.getElementById(frameId) as HTMLIFrameElement | null;
      if (iframe) {
        iframe.remove();
      }

      iframe = document.createElement('iframe');
      iframe.id = frameId;
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0px';
      iframe.style.height = '0px';
      iframe.style.border = 'none';
      iframe.style.zIndex = '-9999';
      document.body.appendChild(iframe);

      const frameDoc = iframe.contentWindow?.document || iframe.contentDocument;
      if (!frameDoc || !iframe.contentWindow) {
        throw new Error('Iframe dokumen tidak dapat diakses.');
      }

      frameDoc.open();
      frameDoc.write(htmlContent);
      frameDoc.close();

      const triggerPrint = () => {
        try {
          if (!iframe?.contentWindow) throw new Error('Window iframe tidak tersedia');
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          resolve({ success: true, message: 'Dialog cetak printer sistem telah dibuka.' });
        } catch {
          // Fallback: buka via Blob URL di tab baru
          openInNewTab(htmlContent, docTitle);
          resolve({
            success: true,
            message: 'Dialog cetak dibuka di tab/jendela baru browser.',
            openedInNewTab: true,
          });
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) iframe.remove();
          }, 30000);
        }
      };

      if (frameDoc.readyState === 'complete') {
        setTimeout(triggerPrint, 250);
      } else {
        iframe.onload = () => setTimeout(triggerPrint, 250);
      }
    } catch {
      // Fallback sekunder
      try {
        openInNewTab(htmlContent, docTitle);
        resolve({
          success: true,
          message: 'Laporan dibuka di tab baru.',
          openedInNewTab: true,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        resolve({ success: false, message: `Gagal membuka dokumen cetak: ${msg}` });
      }
    }
  });
}

/**
 * Membuka dokumen cetak di jendela atau tab baru secara aman
 */
export function openInNewTab(htmlContent: string, docTitle: string = 'Dokumen_Laporan'): void {
  try {
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const win = window.open(blobUrl, '_blank');
    if (win) {
      win.focus();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      return;
    }
  } catch {
    // Abaikan jika blob url dibatasi
  }

  // Fallback direct window.open
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      try {
        printWindow.print();
      } catch {
        // Didiamkan jika browser memblokir auto print
      }
    }, 500);
  }
}

/**
 * Generator HTML Laporan Transaksi Agen (A4 / F4 Format)
 */
export function generateAgentReportHtml(params: {
  transactions: Transaction[];
  profile: AgentProfile;
  periodLabel?: string;
  operatorName?: string;
}): string {
  const { transactions, profile, periodLabel = 'Semua Periode', operatorName = 'Administrator' } = params;

  const countTotal = transactions.length;
  const successTrx = transactions.filter((t) => t.status !== 'VOID');
  const countSuccess = successTrx.length;
  const countVoid = countTotal - countSuccess;
  const totalVolume = successTrx.reduce((acc, t) => acc + (t.nominal || 0), 0);
  const totalFeeCust = successTrx.reduce((acc, t) => acc + (t.feeCust || 0), 0);
  const totalFeeAdmin = successTrx.reduce((acc, t) => acc + (t.feeAdmin || 0), 0);
  const totalNetProfit = successTrx.reduce((acc, t) => acc + ((t.feeCust || 0) - (t.feeAdmin || 0)), 0);

  const rows = transactions
    .map((t, idx) => {
      const isVoid = t.status === 'VOID';
      const profit = (t.feeCust || 0) - (t.feeAdmin || 0);
      return `
      <tr class="${isVoid ? 'void-row' : ''}">
        <td style="text-align: center;">${idx + 1}</td>
        <td style="font-family: monospace; font-weight: bold;">#${t.id}</td>
        <td>${t.time || '-'}</td>
        <td style="font-weight: 600;">${t.type}</td>
        <td>${t.cust || '-'}</td>
        <td>${t.target || '-'}</td>
        <td style="text-align: right; font-weight: bold;">${formatRp(t.nominal)}</td>
        <td style="text-align: right;">${formatRp(t.feeCust)}</td>
        <td style="text-align: right; font-weight: bold; color: ${isVoid ? '#991b1b' : '#047857'};">${formatRp(profit)}</td>
        <td style="text-align: center;">
          <span class="status-badge ${isVoid ? 'badge-void' : 'badge-success'}">${t.status}</span>
        </td>
      </tr>
    `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Laporan Transaksi Agen - ${profile.storeName || 'Mini ATM'}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 10mm 12mm;
        }
        * { box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          background: #ffffff;
          margin: 0;
          padding: 0;
          font-size: 11px;
          line-height: 1.4;
        }
        .header-box {
          border-bottom: 2px solid #0f172a;
          padding-bottom: 10px;
          margin-bottom: 12px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .store-name {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
          text-transform: uppercase;
          margin: 0 0 2px 0;
          letter-spacing: -0.5px;
        }
        .store-sub {
          font-size: 10px;
          color: #475569;
          margin: 1px 0;
        }
        .report-title-box {
          text-align: right;
        }
        .report-title {
          font-size: 14px;
          font-weight: 800;
          color: #1d4ed8;
          text-transform: uppercase;
          margin: 0;
        }
        .meta-info {
          font-size: 9.5px;
          color: #64748b;
          margin-top: 3px;
        }
        .kpi-container {
          display: flex;
          gap: 8px;
          margin-bottom: 14px;
        }
        .kpi-card {
          flex: 1;
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          border-radius: 6px;
          padding: 8px 10px;
        }
        .kpi-label {
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          color: #64748b;
          margin-bottom: 2px;
        }
        .kpi-val {
          font-size: 13px;
          font-weight: 800;
          color: #0f172a;
        }
        .kpi-val.green { color: #047857; }
        .kpi-val.blue { color: #1d4ed8; }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 6px;
        }
        th {
          background: #0f172a;
          color: #ffffff;
          padding: 6px 8px;
          font-size: 9.5px;
          font-weight: 700;
          text-transform: uppercase;
          border: 1px solid #0f172a;
          text-align: left;
        }
        td {
          padding: 5.5px 7px;
          border: 1px solid #e2e8f0;
          font-size: 9.5px;
        }
        tr:nth-child(even) {
          background: #f8fafc;
        }
        tr.void-row td {
          background-color: #fef2f2 !important;
          color: #991b1b !important;
          text-decoration: line-through;
        }
        .status-badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 8.5px;
          font-weight: 700;
        }
        .badge-success { background: #dcfce7; color: #166534; }
        .badge-void { background: #fee2e2; color: #991b1b; }

        .footer-sig {
          margin-top: 24px;
          display: flex;
          justify-content: space-between;
          page-break-inside: avoid;
        }
        .sig-box {
          text-align: center;
          width: 180px;
        }
        .sig-space {
          height: 55px;
        }
        .sig-line {
          border-top: 1px solid #0f172a;
          padding-top: 3px;
          font-weight: bold;
          font-size: 10px;
        }
        .no-print-bar {
          background: #1e293b;
          color: #ffffff;
          padding: 8px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        @media print {
          .no-print-bar { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="no-print-bar">
        <span>Pratinjau Dokumen Cetak Laporan Transaksi Agen</span>
        <button onclick="window.print()" style="background:#2563eb;color:#fff;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-weight:bold;">
          Cetak Dokumen Sekarang (Print)
        </button>
      </div>

      <div class="header-box">
        <div>
          <h1 class="store-name">${profile.storeName || 'MINI ATM & AGEN LINK'}</h1>
          <div class="store-sub">${profile.address || 'Alamat Toko Belum Diatur'}</div>
          <div class="store-sub">No. Telp / WA: ${profile.phone || '-'} | ID Agen: ${profile.idAgent || '-'}</div>
        </div>
        <div class="report-title-box">
          <div class="report-title">LAPORAN TRANSAKSI DETAIL</div>
          <div class="meta-info">Periode: <strong>${periodLabel}</strong></div>
          <div class="meta-info">Waktu Cetak: ${formatDateTime()}</div>
          <div class="meta-info">Operator: <strong>${operatorName}</strong></div>
        </div>
      </div>

      <div class="kpi-container">
        <div class="kpi-card">
          <div class="kpi-label">Total Transaksi</div>
          <div class="kpi-val blue">${countTotal} Trx (${countSuccess} Sukses${countVoid > 0 ? `, ${countVoid} Batal` : ''})</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Perputaran (Volume)</div>
          <div class="kpi-val">${formatRp(totalVolume)}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Total Fee Nasabah</div>
          <div class="kpi-val">${formatRp(totalFeeCust)}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Laba Bersih Agen</div>
          <div class="kpi-val green">${formatRp(totalNetProfit)}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 25px; text-align: center;">No</th>
            <th style="width: 70px;">ID Trx</th>
            <th style="width: 90px;">Waktu</th>
            <th>Jenis Layanan</th>
            <th>Nama Nasabah</th>
            <th>Tujuan / No. Rek</th>
            <th style="text-align: right;">Nominal</th>
            <th style="text-align: right;">Fee</th>
            <th style="text-align: right;">Laba Bersih</th>
            <th style="text-align: center; width: 60px;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${rows.length > 0 ? rows : '<tr><td colspan="10" style="text-align:center;padding:16px;color:#64748b;">Tidak ada data transaksi pada rentang filter ini.</td></tr>'}
        </tbody>
      </table>

      <div class="footer-sig">
        <div class="sig-box">
          <div style="color: #64748b; font-size: 9px;">Dicetak Oleh,</div>
          <div class="sig-space"></div>
          <div class="sig-line">${operatorName}</div>
          <div style="color: #64748b; font-size: 8.5px;">Petugas / Kasir</div>
        </div>
        <div class="sig-box">
          <div style="color: #64748b; font-size: 9px;">Mengetahui,</div>
          <div class="sig-space"></div>
          <div class="sig-line">${profile.storeName || 'Owner Toko'}</div>
          <div style="color: #64748b; font-size: 8.5px;">Penanggung Jawab / Agen</div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generator HTML Laporan Penjualan Kasir POS Fisik (A4 Format)
 */
export function generatePosReportHtml(params: {
  sales: PosSale[];
  profile: AgentProfile;
  periodLabel?: string;
  operatorName?: string;
}): string {
  const { sales, profile, periodLabel = 'Semua Periode', operatorName = 'Kasir' } = params;

  const validSales = sales.filter((s) => s.status !== 'VOID');
  const countTotal = sales.length;
  const countSuccess = validSales.length;
  const countVoid = countTotal - countSuccess;
  const totalOmzet = validSales.reduce((acc, s) => acc + (s.totalRevenue || 0), 0);
  const totalHpp = validSales.reduce((acc, s) => acc + (s.totalCost || 0), 0);
  const totalLabaKotor = validSales.reduce((acc, s) => acc + (s.grossProfit || 0), 0);
  const totalItemPcs = validSales.reduce(
    (acc, s) => acc + (s.items || []).reduce((subAcc, it) => subAcc + (it.qty || 0), 0),
    0
  );

  const rows = sales
    .map((s, idx) => {
      const isVoid = s.status === 'VOID';
      const itemsSummary = (s.items || [])
        .map((it) => `${it.productName} (${it.qty}x)`)
        .slice(0, 3)
        .join(', ') + ((s.items || []).length > 3 ? '...' : '');

      return `
      <tr class="${isVoid ? 'void-row' : ''}">
        <td style="text-align: center;">${idx + 1}</td>
        <td style="font-family: monospace; font-weight: bold;">${s.invoiceNumber || s.id}</td>
        <td>${s.time || '-'}</td>
        <td>${s.customerName || 'Pelanggan Umum'}</td>
        <td>${itemsSummary || '-'}</td>
        <td style="text-align: center;">${s.paymentMethod || 'TUNAI'}</td>
        <td style="text-align: right; font-weight: bold;">${formatRp(s.totalRevenue)}</td>
        <td style="text-align: right; color: #64748b;">${formatRp(s.totalCost)}</td>
        <td style="text-align: right; font-weight: bold; color: ${isVoid ? '#991b1b' : '#047857'};">${formatRp(s.grossProfit)}</td>
        <td style="text-align: center;">
          <span class="status-badge ${isVoid ? 'badge-void' : 'badge-success'}">${s.status || 'SUCCESS'}</span>
        </td>
      </tr>
    `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Laporan Penjualan Kasir POS - ${profile.storeName || 'Toko Retail'}</title>
      <style>
        @page { size: A4 portrait; margin: 10mm 12mm; }
        * { box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          background: #ffffff;
          margin: 0;
          padding: 0;
          font-size: 11px;
          line-height: 1.4;
        }
        .header-box {
          border-bottom: 2px solid #0f172a;
          padding-bottom: 10px;
          margin-bottom: 12px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .store-name { font-size: 18px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin: 0 0 2px 0; }
        .store-sub { font-size: 10px; color: #475569; margin: 1px 0; }
        .report-title-box { text-align: right; }
        .report-title { font-size: 14px; font-weight: 800; color: #1d4ed8; text-transform: uppercase; margin: 0; }
        .meta-info { font-size: 9.5px; color: #64748b; margin-top: 3px; }
        .kpi-container { display: flex; gap: 8px; margin-bottom: 14px; }
        .kpi-card { flex: 1; border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 6px; padding: 8px 10px; }
        .kpi-label { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 2px; }
        .kpi-val { font-size: 13px; font-weight: 800; color: #0f172a; }
        .kpi-val.green { color: #047857; }
        .kpi-val.blue { color: #1d4ed8; }

        table { width: 100%; border-collapse: collapse; margin-top: 6px; }
        th { background: #0f172a; color: #ffffff; padding: 6px 8px; font-size: 9.5px; font-weight: 700; text-transform: uppercase; border: 1px solid #0f172a; text-align: left; }
        td { padding: 5.5px 7px; border: 1px solid #e2e8f0; font-size: 9.5px; }
        tr:nth-child(even) { background: #f8fafc; }
        tr.void-row td { background-color: #fef2f2 !important; color: #991b1b !important; text-decoration: line-through; }
        .status-badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 8.5px; font-weight: 700; }
        .badge-success { background: #dcfce7; color: #166534; }
        .badge-void { background: #fee2e2; color: #991b1b; }

        .footer-sig { margin-top: 24px; display: flex; justify-content: space-between; page-break-inside: avoid; }
        .sig-box { text-align: center; width: 180px; }
        .sig-space { height: 55px; }
        .sig-line { border-top: 1px solid #0f172a; padding-top: 3px; font-weight: bold; font-size: 10px; }
        .no-print-bar { background: #1e293b; color: #ffffff; padding: 8px 16px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        @media print { .no-print-bar { display: none !important; } }
      </style>
    </head>
    <body>
      <div class="no-print-bar">
        <span>Pratinjau Dokumen Cetak Laporan Penjualan Kasir POS</span>
        <button onclick="window.print()" style="background:#2563eb;color:#fff;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-weight:bold;">
          Cetak Dokumen Sekarang (Print)
        </button>
      </div>

      <div class="header-box">
        <div>
          <h1 class="store-name">${profile.storeName || 'KASIR POS RETAIL'}</h1>
          <div class="store-sub">${profile.address || 'Alamat Toko Belum Diatur'}</div>
          <div class="store-sub">No. Telp: ${profile.phone || '-'}</div>
        </div>
        <div class="report-title-box">
          <div class="report-title">LAPORAN PENJUALAN KASIR POS</div>
          <div class="meta-info">Periode: <strong>${periodLabel}</strong></div>
          <div class="meta-info">Waktu Cetak: ${formatDateTime()}</div>
          <div class="meta-info">Petugas Kasir: <strong>${operatorName}</strong></div>
        </div>
      </div>

      <div class="kpi-container">
        <div class="kpi-card">
          <div class="kpi-label">Total Faktur / Transaksi</div>
          <div class="kpi-val blue">${countTotal} Faktur (${countSuccess} Berhasil${countVoid > 0 ? `, ${countVoid} Batal` : ''})</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Total Omzet Penjualan</div>
          <div class="kpi-val">${formatRp(totalOmzet)}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Total Modal (HPP)</div>
          <div class="kpi-val">${formatRp(totalHpp)}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Laba Kotor Penjualan</div>
          <div class="kpi-val green">${formatRp(totalLabaKotor)}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 25px; text-align: center;">No</th>
            <th style="width: 80px;">No Faktur</th>
            <th style="width: 90px;">Waktu</th>
            <th>Pelanggan</th>
            <th>Rincian Item</th>
            <th style="text-align: center; width: 70px;">Metode</th>
            <th style="text-align: right;">Total Omzet</th>
            <th style="text-align: right;">Modal HPP</th>
            <th style="text-align: right;">Laba Kotor</th>
            <th style="text-align: center; width: 60px;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${rows.length > 0 ? rows : '<tr><td colspan="10" style="text-align:center;padding:16px;color:#64748b;">Tidak ada data penjualan pada rentang filter ini.</td></tr>'}
        </tbody>
      </table>

      <div class="footer-sig">
        <div class="sig-box">
          <div style="color: #64748b; font-size: 9px;">Dicetak Oleh,</div>
          <div class="sig-space"></div>
          <div class="sig-line">${operatorName}</div>
          <div style="color: #64748b; font-size: 8.5px;">Petugas Kasir</div>
        </div>
        <div class="sig-box">
          <div style="color: #64748b; font-size: 9px;">Mengetahui,</div>
          <div class="sig-space"></div>
          <div class="sig-line">${profile.storeName || 'Owner Toko'}</div>
          <div style="color: #64748b; font-size: 8.5px;">Pemilik / Manager Toko</div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generator HTML Ringkasan Struk Thermal 58mm / 80mm
 * Menghasilkan struk ringkasan harian mini yang bisa dicetak langsung ke printer kasir bluetooth/USB.
 */
export function generateThermalSummaryReceiptHtml(params: {
  title: string;
  profile: AgentProfile;
  periodLabel: string;
  count: number;
  totalNominal: number;
  totalProfit: number;
  operatorName: string;
  paperWidth?: '58mm' | '80mm';
}): string {
  const { title, profile, periodLabel, count, totalNominal, totalProfit, operatorName, paperWidth = '58mm' } = params;
  const is58 = paperWidth === '58mm';
  const widthPx = is58 ? '210px' : '300px';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        @page { margin: 0; size: auto; }
        body {
          margin: 0;
          padding: 8px 4px;
          width: ${widthPx};
          font-family: 'Courier New', Courier, monospace;
          font-size: ${is58 ? '11px' : '12px'};
          line-height: 1.3;
          color: #000;
          background: #fff;
        }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 6px 0; }
        .row { display: flex; justify-content: space-between; margin: 2px 0; }
      </style>
    </head>
    <body>
      <div class="center bold" style="font-size: 13px;">${(profile.storeName || 'MINI ATM').toUpperCase()}</div>
      <div class="center" style="font-size: 10px;">${profile.address || ''}</div>
      <div class="center" style="font-size: 10px;">TELP: ${profile.phone || '-'}</div>
      <div class="line"></div>
      <div class="center bold">${title.toUpperCase()}</div>
      <div class="center" style="font-size: 10px;">Periode: ${periodLabel}</div>
      <div class="line"></div>
      <div class="row"><span>Waktu Cetak:</span><span>${formatDateTime()}</span></div>
      <div class="row"><span>Kasir/Operator:</span><span>${operatorName}</span></div>
      <div class="line"></div>
      <div class="row"><span>Total Transaksi:</span><span class="bold">${count} Trx</span></div>
      <div class="row"><span>Total Volume/Omzet:</span><span class="bold">${formatRp(totalNominal)}</span></div>
      <div class="row"><span>Total Laba/Profit:</span><span class="bold">${formatRp(totalProfit)}</span></div>
      <div class="line"></div>
      <div class="center" style="font-size: 10px; margin-top: 6px;">*** ARSIP LAPORAN HARIAN ***</div>
      <div class="center" style="font-size: 9px;">Dicetak Otomatis oleh Sistem</div>
    </body>
    </html>
  `;
}

/**
 * Mencetak struk ringkasan laporan ke printer thermal (Bluetooth, USB, RawBT, dsb.)
 */
export async function executeThermalReportPrint(params: {
  title: string;
  profile: AgentProfile;
  periodLabel: string;
  count: number;
  totalNominal: number;
  totalProfit: number;
  operatorName: string;
  settings: PrinterSettings;
}): Promise<{ success: boolean; message: string }> {
  const { title, profile, periodLabel, count, totalNominal, totalProfit, operatorName, settings } = params;
  const paperWidth = settings.paperWidth || '58mm';
  const is58 = paperWidth === '58mm';
  const widthChars = is58 ? 32 : 48;

  const padBoth = (text: string, len: number) => {
    if (text.length >= len) return text.slice(0, len);
    const diff = len - text.length;
    const left = Math.floor(diff / 2);
    const right = diff - left;
    return ' '.repeat(left) + text + ' '.repeat(right);
  };

  const padRow = (left: string, right: string, len: number) => {
    const space = len - left.length - right.length;
    if (space <= 0) return `${left}\n${' '.repeat(Math.max(0, len - right.length))}${right}`;
    return left + ' '.repeat(space) + right;
  };

  const divider = '-'.repeat(widthChars);

  let receiptText = '';
  receiptText += padBoth(profile.storeName.toUpperCase(), widthChars) + '\n';
  if (profile.address) receiptText += padBoth(profile.address, widthChars) + '\n';
  if (profile.phone) receiptText += padBoth(`TELP: ${profile.phone}`, widthChars) + '\n';
  receiptText += divider + '\n';
  receiptText += padBoth(title.toUpperCase(), widthChars) + '\n';
  receiptText += padBoth(`PERIODE: ${periodLabel}`, widthChars) + '\n';
  receiptText += divider + '\n';
  receiptText += padRow('Waktu Cetak:', formatDateTime(), widthChars) + '\n';
  receiptText += padRow('Operator:', operatorName, widthChars) + '\n';
  receiptText += divider + '\n';
  receiptText += padRow('Total Trx:', `${count} Trx`, widthChars) + '\n';
  receiptText += padRow('Total Omzet:', formatRp(totalNominal), widthChars) + '\n';
  receiptText += padRow('Total Laba:', formatRp(totalProfit), widthChars) + '\n';
  receiptText += divider + '\n';
  receiptText += padBoth('*** ARSIP REKAP LAPORAN ***', widthChars) + '\n';
  receiptText += '\n\n\n';

  // Pilih koneksi sesuai pengaturan printer
  if (settings.connectionType === 'browser') {
    // Mode Browser System Print via iframe
    const html = generateThermalSummaryReceiptHtml({
      title,
      profile,
      periodLabel,
      count,
      totalNominal,
      totalProfit,
      operatorName,
      paperWidth,
    });
    return printHtmlDocument(html, title);
  }

  // Koneksi Thermal Hardware (Bluetooth, Serial/USB, atau RawBT Android)
  const summaryTrx: Transaction = {
    id: `REKAP-${Date.now().toString().slice(-6)}`,
    time: formatDateTime(),
    type: 'TRANSFER',
    cust: title,
    target: periodLabel,
    nominal: totalNominal,
    feeCust: 0,
    feeAdmin: 0,
    status: 'SUCCESS',
    accountId: 'rekap',
    refNumber: `TOT-${count}TRX`,
    notes: `Total: ${count} Trx | Laba: ${formatRp(totalProfit)} | Op: ${operatorName}`,
  };

  return await executeQuickPrint(summaryTrx, profile, settings);
}

/**
 * Generator HTML Laporan Rekap Stok Barang Fisik (A4 Format)
 */
export function generateStockReportHtml(params: {
  products: Product[];
  profile: AgentProfile;
  filterLabel?: string;
  operatorName?: string;
}): string {
  const { products, profile, filterLabel = 'Semua Stok', operatorName = 'Petugas Gudang' } = params;

  const totalItems = products.length;
  const totalUnits = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const totalAssetHpp = products.reduce((acc, p) => acc + ((p.stock || 0) * (p.buyPrice || 0)), 0);
  const totalAssetJual = products.reduce((acc, p) => acc + ((p.stock || 0) * (p.price || 0)), 0);
  const totalPotentialProfit = totalAssetJual - totalAssetHpp;

  const rows = products
    .map((p, idx) => {
      const minStock = p.minStock || 5;
      const isOut = (p.stock || 0) <= 0;
      const isLow = !isOut && (p.stock || 0) <= minStock;
      const assetVal = (p.stock || 0) * (p.buyPrice || 0);

      let statusBadge = '<span class="status-badge badge-success">AMAN</span>';
      let rowStyle = '';
      if (isOut) {
        statusBadge = '<span class="status-badge badge-void">HABIS</span>';
        rowStyle = 'background-color: #fef2f2;';
      } else if (isLow) {
        statusBadge = '<span class="status-badge" style="background: #fef3c7; color: #92400e; border: 1px solid #fcd34d;">MENIPIS</span>';
        rowStyle = 'background-color: #fffbeb;';
      }

      return `
      <tr style="${rowStyle}">
        <td style="text-align: center;">${idx + 1}</td>
        <td style="font-family: monospace; font-size: 9px;">${p.barcode || p.id}</td>
        <td style="font-weight: bold;">${p.name}</td>
        <td>${p.category || '-'}</td>
        <td style="text-align: right;">${formatRp(p.buyPrice || 0)}</td>
        <td style="text-align: right;">${formatRp(p.price || 0)}</td>
        <td style="text-align: center; font-weight: bold; font-size: 11px;">${p.stock || 0} ${p.unit || 'pcs'}</td>
        <td style="text-align: right; font-weight: bold;">${formatRp(assetVal)}</td>
        <td style="text-align: center;">${statusBadge}</td>
      </tr>
    `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8">
      <title>Laporan Rekap Stok Fisik - ${profile.storeName}</title>
      <style>
        @page { size: A4 portrait; margin: 12mm 10mm; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          background: #ffffff;
          margin: 0;
          padding: 16px;
          font-size: 10px;
          line-height: 1.4;
        }
        .kop {
          border-bottom: 2px solid #0f172a;
          padding-bottom: 8px;
          margin-bottom: 12px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .kop h1 {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 2px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .kop p {
          margin: 1px 0;
          color: #475569;
          font-size: 9.5px;
        }
        .badge-kop {
          display: inline-block;
          background: #e0e7ff;
          color: #3730a3;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 9px;
          margin-top: 3px;
        }
        .meta-right {
          text-align: right;
          font-size: 9px;
          color: #475569;
        }
        .report-title-box {
          text-align: center;
          margin: 10px 0 14px 0;
          padding: 6px 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
        }
        .report-title-box h2 {
          margin: 0 0 2px 0;
          font-size: 13px;
          font-weight: bold;
          color: #0f172a;
          text-transform: uppercase;
        }
        .report-title-box span {
          font-size: 9.5px;
          color: #64748b;
        }
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 14px;
        }
        .kpi-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 8px 10px;
        }
        .kpi-card .label {
          font-size: 8.5px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #64748b;
          font-weight: 600;
          margin-bottom: 2px;
        }
        .kpi-card .val {
          font-size: 13px;
          font-weight: 800;
          color: #0f172a;
        }
        .kpi-card.highlight {
          background: #eff6ff;
          border-color: #bfdbfe;
        }
        .kpi-card.highlight .val {
          color: #1d4ed8;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 6px;
          font-size: 9.5px;
        }
        th {
          background: #1e293b;
          color: #ffffff;
          padding: 6px 7px;
          font-weight: 700;
          text-align: left;
          font-size: 8.5px;
          border: 1px solid #1e293b;
          text-transform: uppercase;
        }
        td {
          padding: 5px 7px;
          border: 1px solid #cbd5e1;
          vertical-align: middle;
        }
        tr:nth-child(even) {
          background-color: #f8fafc;
        }
        .status-badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 8px;
          text-align: center;
        }
        .badge-success {
          background: #dcfce7;
          color: #15803d;
          border: 1px solid #bbf7d0;
        }
        .badge-void {
          background: #fee2e2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }
        .footer-sig {
          margin-top: 24px;
          display: flex;
          justify-content: space-between;
          padding: 0 20px;
        }
        .sig-box {
          text-align: center;
          width: 170px;
        }
        .sig-space {
          height: 48px;
        }
        .sig-line {
          border-top: 1px solid #0f172a;
          margin-top: 2px;
          font-weight: bold;
          font-size: 9.5px;
        }
      </style>
    </head>
    <body>
      <div class="kop">
        <div>
          <h1>${profile.storeName || 'TOKO & MINI ATM'}</h1>
          <p>${profile.address || 'Alamat Toko Agen'}</p>
          <p>No. Telepon/WA: ${profile.phone || '-'}</p>
          <div class="badge-kop">INVENTARIS & STOK GUDANG</div>
        </div>
        <div class="meta-right">
          <div><strong>Waktu Cetak:</strong> ${formatDateTime()}</div>
          <div><strong>Dicetak Oleh:</strong> ${operatorName}</div>
          <div><strong>Total SKU Produk:</strong> ${totalItems} Item</div>
        </div>
      </div>

      <div class="report-title-box">
        <h2>Laporan Inventaris Stok Barang Fisik</h2>
        <span>Status Filter: ${filterLabel}</span>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="label">Total Macam Produk (SKU)</div>
          <div class="val">${totalItems} Macam</div>
        </div>
        <div class="kpi-card">
          <div class="label">Total Unit Fisik Tersedia</div>
          <div class="val">${totalUnits} Unit</div>
        </div>
        <div class="kpi-card highlight">
          <div class="label">Total Nilai Aset Modal (HPP)</div>
          <div class="val">${formatRp(totalAssetHpp)}</div>
        </div>
        <div class="kpi-card">
          <div class="label">Estimasi Nilai Jual Total</div>
          <div class="val">${formatRp(totalAssetJual)}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 25px; text-align: center;">No</th>
            <th style="width: 80px;">Barcode / SKU</th>
            <th>Nama Barang Fisik</th>
            <th>Kategori</th>
            <th style="text-align: right;">HPP Modal</th>
            <th style="text-align: right;">Harga Jual</th>
            <th style="text-align: center;">Sisa Stok</th>
            <th style="text-align: right;">Nilai Modal</th>
            <th style="text-align: center; width: 65px;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <div class="footer-sig">
        <div class="sig-box">
          <div style="color: #64748b; font-size: 9px;">Petugas Gudang / Pemeriksa,</div>
          <div class="sig-space"></div>
          <div class="sig-line">${operatorName}</div>
          <div style="color: #64748b; font-size: 8.5px;">Operator Inventaris</div>
        </div>
        <div class="sig-box">
          <div style="color: #64748b; font-size: 9px;">Mengetahui & Menyetujui,</div>
          <div class="sig-space"></div>
          <div class="sig-line">${profile.storeName || 'Pemilik Toko'}</div>
          <div style="color: #64748b; font-size: 8.5px;">Owner / Penanggung Jawab</div>
        </div>
      </div>
    </body>
    </html>
  `;
}
