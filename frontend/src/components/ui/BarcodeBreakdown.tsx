interface Segment {
  value: string
  label: string
  sublabel: string
  color: { bg: string; border: string; text: string; label: string }
}

const COLORS = [
  { bg: 'bg-navy-50',    border: 'border-navy-300',    text: 'text-navy-800',    label: 'text-navy-600'    },
  { bg: 'bg-blue-50',    border: 'border-blue-300',    text: 'text-blue-800',    label: 'text-blue-600'    },
  { bg: 'bg-magenta-50', border: 'border-magenta-300', text: 'text-magenta-800', label: 'text-magenta-600' },
  { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-800', label: 'text-emerald-600' },
]

const formatDate = (raw: string): string => {
  if (raw.length !== 8) return raw
  return new Date(`${raw.slice(0,4)}-${raw.slice(4,6)}-${raw.slice(6,8)}`)
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const formatCount = (raw: string): string => {
  const n = parseInt(raw, 10)
  if (isNaN(n)) return raw
  const suffix = n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'
  return `${n}${suffix} pawn by this customer`
}

interface BarcodeBreakdownProps {
  barcode: string
  customerName?: string
}

export default function BarcodeBreakdown({ barcode, customerName }: BarcodeBreakdownProps) {
  const parts = barcode.split('-')
  const isKnownFormat = parts.length === 4 && parts[0] === 'GP'

  if (!isKnownFormat) {
    return (
      <p className="text-xs text-gray-400 italic text-center">
        Custom barcode — no breakdown available
      </p>
    )
  }

  const [prefix, date, initials, count] = parts

  const segments: Segment[] = [
    {
      value:    prefix,
      label:    'System Prefix',
      sublabel: 'Pearl Isle Capital',
      color:    COLORS[0],
    },
    {
      value:    date,
      label:    'Issue Date',
      sublabel: formatDate(date),
      color:    COLORS[1],
    },
    {
      value:    initials,
      label:    'Customer',
      sublabel: customerName ?? 'First 2 letters of name',
      color:    COLORS[2],
    },
    {
      value:    count,
      label:    'Pawn Count',
      sublabel: formatCount(count),
      color:    COLORS[3],
    },
  ]

  return (
    <div className="w-full space-y-3">
      {/* Segmented bar */}
      <div className="flex items-stretch gap-px rounded-lg overflow-hidden border border-gray-200">
        {segments.map((seg, i) => (
          <div
            key={i}
            className={`flex-1 ${seg.color.bg} px-2 py-2.5 text-center ${
              i < segments.length - 1 ? `border-r ${seg.color.border}` : ''
            }`}
          >
            <p className={`font-mono font-bold text-sm tracking-widest ${seg.color.text}`}>
              {seg.value}
            </p>
          </div>
        ))}
      </div>

      {/* Connectors + label cards */}
      <div className="flex gap-1">
        {segments.map((seg, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className={`w-px h-3 border-l border-dashed ${seg.color.border}`} />
            <div className={`w-full rounded-lg border ${seg.color.border} ${seg.color.bg} px-2 py-2 text-center`}>
              <p className={`text-xs font-semibold ${seg.color.text}`}>{seg.label}</p>
              <p className={`text-xs mt-0.5 leading-tight ${seg.color.label}`}>{seg.sublabel}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
