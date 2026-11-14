import React, { useState } from 'react';
import Papa from 'papaparse';
import { UploadCloud, FileSpreadsheet, AlertTriangle, CheckCircle, X, Loader2 } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function CSVImportModal({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [columnMapping, setColumnMapping] = useState({
    date: '',
    amount: '',
    description: '',
    category: '',
    merchant: '',
    paymentMethod: '',
    type: ''
  });
  const [step, setStep] = useState(1); // 1: Upload, 2: Map, 3: Preview & Confirm
  const [previewSummary, setPreviewSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.endsWith('.csv')) {
      toast.error('Please upload a valid .csv file.');
      return;
    }

    setFile(uploadedFile);
    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          toast.error('The selected CSV file appears to be empty.');
          return;
        }

        const detectedHeaders = results.meta.fields || Object.keys(results.data[0]);
        setHeaders(detectedHeaders);
        setParsedRows(results.data);

        // Auto-detect columns
        const mapping = { date: '', amount: '', description: '', category: '', merchant: '', paymentMethod: '', type: '' };
        detectedHeaders.forEach((h) => {
          const lower = h.toLowerCase().trim();
          if (lower.includes('date') || lower.includes('time')) mapping.date = h;
          else if (lower.includes('amount') || lower.includes('spent') || lower.includes('price')) mapping.amount = h;
          else if (lower.includes('desc') || lower.includes('narr') || lower.includes('title')) mapping.description = h;
          else if (lower.includes('cat')) mapping.category = h;
          else if (lower.includes('merch') || lower.includes('payee') || lower.includes('vendor')) mapping.merchant = h;
          else if (lower.includes('method') || lower.includes('mode')) mapping.paymentMethod = h;
          else if (lower.includes('type') || lower.includes('cr/dr')) mapping.type = h;
        });

        setColumnMapping(mapping);
        setStep(2);
      },
      error: (err) => {
        toast.error(`CSV Parsing error: ${err.message}`);
      }
    });
  };

  const handlePreview = async () => {
    if (!columnMapping.amount || !columnMapping.description) {
      toast.error('Amount and Description column mappings are required.');
      return;
    }

    setLoading(true);
    try {
      const normalizedRows = parsedRows.map((r) => ({
        date: columnMapping.date ? r[columnMapping.date] : new Date().toISOString().split('T')[0],
        amount: columnMapping.amount ? r[columnMapping.amount] : 0,
        description: columnMapping.description ? r[columnMapping.description] : 'Imported expense',
        category: columnMapping.category ? r[columnMapping.category] : 'Other',
        merchant: columnMapping.merchant ? r[columnMapping.merchant] : '',
        paymentMethod: columnMapping.paymentMethod ? r[columnMapping.paymentMethod] : 'Other',
        type: columnMapping.type ? (String(r[columnMapping.type]).toLowerCase().includes('in') ? 'income' : 'expense') : 'expense'
      }));

      // Call backend for duplicate check and verification preview
      const res = await api.post('/transactions/import', {
        transactions: normalizedRows,
        previewOnly: true
      });

      setPreviewSummary(res.data);
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to preview CSV rows.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    setLoading(true);
    try {
      const normalizedRows = parsedRows.map((r) => ({
        date: columnMapping.date ? r[columnMapping.date] : new Date().toISOString().split('T')[0],
        amount: columnMapping.amount ? r[columnMapping.amount] : 0,
        description: columnMapping.description ? r[columnMapping.description] : 'Imported expense',
        category: columnMapping.category ? r[columnMapping.category] : 'Other',
        merchant: columnMapping.merchant ? r[columnMapping.merchant] : '',
        paymentMethod: columnMapping.paymentMethod ? r[columnMapping.paymentMethod] : 'Other',
        type: columnMapping.type ? (String(r[columnMapping.type]).toLowerCase().includes('in') ? 'income' : 'expense') : 'expense'
      }));

      const res = await api.post('/transactions/import', {
        transactions: normalizedRows,
        previewOnly: false
      });

      toast.success(res.data.message || 'Import successful!');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to import transactions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#141E30] border border-slate-700 rounded-2xl shadow-2xl p-6 text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white">Import Transactions from CSV</h3>
              <p className="text-xs text-slate-400">Bank statements, credit card exports or spreadsheets</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between my-4 px-4 py-2 bg-[#090D18] rounded-xl text-xs font-semibold">
          <span className={step >= 1 ? 'text-purple-400' : 'text-slate-500'}>1. Upload File</span>
          <span className="text-slate-600">→</span>
          <span className={step >= 2 ? 'text-purple-400' : 'text-slate-500'}>2. Map Columns</span>
          <span className="text-slate-600">→</span>
          <span className={step === 3 ? 'text-purple-400' : 'text-slate-500'}>3. Preview & Confirm</span>
        </div>

        {/* STEP 1: Upload */}
        {step === 1 && (
          <div className="py-8">
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-purple-500 rounded-2xl p-8 cursor-pointer transition bg-[#090D18]/50">
              <UploadCloud className="w-12 h-12 text-purple-400 mb-3" />
              <span className="text-sm font-semibold text-white">Click to upload CSV statement</span>
              <span className="text-xs text-slate-400 mt-1">Supports standard CSV exports from any bank or app</span>
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        )}

        {/* STEP 2: Map Columns */}
        {step === 2 && (
          <div className="space-y-4 py-2">
            <p className="text-xs text-slate-400">
              We detected {parsedRows.length} rows in <span className="text-white font-medium">{file?.name}</span>. Confirm matching columns:
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              {['amount', 'description', 'date', 'category', 'merchant', 'paymentMethod', 'type'].map((field) => (
                <div key={field}>
                  <label className="text-slate-300 font-medium block mb-1 capitalize">
                    {field} {['amount', 'description'].includes(field) && '*'}
                  </label>
                  <select
                    value={columnMapping[field]}
                    onChange={(e) => setColumnMapping({ ...columnMapping, [field]: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#090D18] border border-slate-700 text-white outline-none focus:border-purple-500"
                  >
                    <option value="">-- Select Column --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="pt-4 flex justify-between">
              <button onClick={() => setStep(1)} className="px-4 py-2 text-xs text-slate-400 hover:text-white">
                Back
              </button>
              <button
                onClick={handlePreview}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Validate & Preview'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Preview & Confirm */}
        {step === 3 && previewSummary && (
          <div className="space-y-4 py-2">
            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 bg-[#090D18] rounded-xl border border-slate-800">
                <div className="text-slate-400">Total Valid Rows</div>
                <div className="text-lg font-bold text-green-400">{previewSummary.summary.validCount}</div>
              </div>
              <div className="p-3 bg-[#090D18] rounded-xl border border-slate-800">
                <div className="text-slate-400">Potential Duplicates</div>
                <div className="text-lg font-bold text-amber-400">{previewSummary.summary.potentialDuplicatesCount}</div>
              </div>
              <div className="p-3 bg-[#090D18] rounded-xl border border-slate-800">
                <div className="text-slate-400">Invalid / Skipped</div>
                <div className="text-lg font-bold text-red-400">{previewSummary.summary.invalidCount}</div>
              </div>
            </div>

            {previewSummary.summary.potentialDuplicatesCount > 0 && (
              <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  {previewSummary.summary.potentialDuplicatesCount} transactions look similar to existing records. They will be marked as "potential duplicates" so you can review them.
                </span>
              </div>
            )}

            {/* Preview Table */}
            <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-xl text-xs">
              <table className="w-full text-left">
                <thead className="bg-[#090D18] text-slate-400 sticky top-0">
                  <tr>
                    <th className="p-2">Date</th>
                    <th className="p-2">Description</th>
                    <th className="p-2">Category</th>
                    <th className="p-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {previewSummary.preview.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="p-2 text-slate-400">{new Date(row.date).toLocaleDateString()}</td>
                      <td className="p-2 text-white truncate max-w-xs">{row.description}</td>
                      <td className="p-2 text-purple-300">{row.category}</td>
                      <td className="p-2 text-right font-semibold text-white">{row.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-4 flex justify-between">
              <button onClick={() => setStep(2)} className="px-4 py-2 text-xs text-slate-400 hover:text-white">
                Back to Mapping
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={loading || previewSummary.summary.validCount === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Import ${previewSummary.summary.validCount} Transactions`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
