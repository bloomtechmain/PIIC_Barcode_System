import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Upload, FileSpreadsheet, CheckCircle, AlertCircle,
  Users, Package, X, ChevronDown, ChevronUp
} from 'lucide-react'
import { importCSV, ImportResult } from '../../api/import.api'

interface Props {
  open: boolean
  onClose: () => void
}

export default function CSVImportModal({ open, onClose }: Props) {
  const qc                            = useQueryClient()
  const inputRef                      = useRef<HTMLInputElement>(null)
  const [dragging, setDragging]       = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [result, setResult]           = useState<ImportResult | null>(null)
  const [showErrors, setShowErrors]   = useState(false)

  const mutation = useMutation({
    mutationFn: (file: File) => importCSV(file),
    onSuccess: data => {
      setResult(data)
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['items'] })
      qc.invalidateQueries({ queryKey: ['branches'] })
    }
  })

  const handleFile = (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) return
    setSelectedFile(file)
    setResult(null)
    mutation.reset()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleClose = () => {
    setSelectedFile(null)
    setResult(null)
    setShowErrors(false)
    mutation.reset()
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-navy-600 to-navy-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet size={20} className="text-white/80" />
            <div>
              <h2 className="text-white font-semibold text-base leading-tight">Import from CSV / Excel</h2>
              <p className="text-navy-200 text-xs mt-0.5">Bulk import customers &amp; items</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-white/60 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* ── Result view ─────────────────────────────────────────────── */}
          {result ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={20} className="text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-navy-700">Import Complete</p>
                  <p className="text-gray-400 text-xs">
                    {selectedFile?.name}
                  </p>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5">
                  <div className="flex items-center gap-2 mb-1">
                    <Users size={14} className="text-blue-500" />
                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Customers</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">{result.customersCreated}</p>
                  <p className="text-xs text-blue-400 mt-0.5">created &nbsp;·&nbsp; {result.customersFound} already existed</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5">
                  <div className="flex items-center gap-2 mb-1">
                    <Package size={14} className="text-emerald-500" />
                    <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Items</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-700">{result.itemsCreated}</p>
                  <p className="text-xs text-emerald-400 mt-0.5">imported &nbsp;·&nbsp; {result.itemsSkipped} skipped</p>
                </div>
              </div>

              {/* Errors collapsible */}
              {result.errors.length > 0 && (
                <div className="border border-amber-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowErrors(v => !v)}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-amber-50 text-amber-700 text-sm font-medium"
                  >
                    <span className="flex items-center gap-2">
                      <AlertCircle size={14} />
                      {result.errors.length} row{result.errors.length !== 1 ? 's' : ''} skipped
                    </span>
                    {showErrors ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {showErrors && (
                    <ul className="px-4 py-3 space-y-1 max-h-40 overflow-y-auto bg-white">
                      {result.errors.map((e, i) => (
                        <li key={i} className="text-xs text-gray-500 font-mono">{e}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button className="btn-secondary flex-1 justify-center" onClick={() => { setResult(null); setSelectedFile(null) }}>
                  Import Another
                </button>
                <button className="btn-primary flex-1 justify-center" onClick={handleClose}>
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* ── Upload view ──────────────────────────────────────────── */
            <div className="space-y-4">
              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-all ${
                  dragging
                    ? 'border-navy-400 bg-navy-50'
                    : selectedFile
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-gray-200 hover:border-navy-300 hover:bg-navy-50/40'
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
                />
                {selectedFile ? (
                  <>
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <FileSpreadsheet size={24} className="text-emerald-600" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-navy-700 text-sm">{selectedFile.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {(selectedFile.size / 1024).toFixed(1)} KB &nbsp;·&nbsp; Click to change
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-navy-50 rounded-xl flex items-center justify-center">
                      <Upload size={24} className="text-navy-400" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-navy-700 text-sm">Drop file here or click to browse</p>
                      <p className="text-xs text-gray-400 mt-1">Accepts .xlsx, .xls, .csv — max 10 MB</p>
                    </div>
                  </>
                )}
              </div>

              {/* Error message */}
              {mutation.isError && (
                <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                  <span>
                    {(mutation.error as { response?: { data?: { message?: string } } })
                      ?.response?.data?.message ?? 'Import failed. Please check your file and try again.'}
                  </span>
                </div>
              )}

              {/* Format hint */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-500 space-y-1">
                <p className="font-semibold text-gray-600 mb-1.5">Expected columns</p>
                <p>Branch · Issued Date · Customer Name · NIC · Ticket No · Item Description</p>
                <p>Gross Weight · Net Weight · Karatage · Total Weight · Advanced Amount</p>
                <p>Outstanding Amount · Profit Rate</p>
              </div>

              <div className="flex gap-2 pt-1">
                <button className="btn-secondary flex-1 justify-center" onClick={handleClose}>
                  Cancel
                </button>
                <button
                  className="btn-primary flex-1 justify-center"
                  disabled={!selectedFile || mutation.isPending}
                  onClick={() => selectedFile && mutation.mutate(selectedFile)}
                >
                  {mutation.isPending ? 'Importing…' : 'Import'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
