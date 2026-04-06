import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  color?: 'navy' | 'magenta' | 'green' | 'blue'
  sub?: string
}

const colorMap = {
  navy:    { iconBg: 'bg-gradient-to-br from-navy-600 to-navy-400',    text: 'text-navy-700',    sub: 'text-navy-400',    border: 'border-l-navy-600',    ring: 'bg-navy-200/60'    },
  magenta: { iconBg: 'bg-gradient-to-br from-magenta-500 to-pink-400', text: 'text-magenta-700', sub: 'text-magenta-400', border: 'border-l-magenta-500', ring: 'bg-magenta-200/60' },
  green:   { iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-400', text: 'text-emerald-700', sub: 'text-emerald-500', border: 'border-l-emerald-500', ring: 'bg-emerald-200/60'  },
  blue:    { iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-400',  text: 'text-blue-700',    sub: 'text-blue-400',    border: 'border-l-blue-500',    ring: 'bg-blue-200/60'    },
}

export default function StatCard({ label, value, icon: Icon, color = 'navy', sub }: StatCardProps) {
  const c = colorMap[color]
  return (
    <div className={`relative bg-white rounded-2xl border border-gray-200 border-l-4 ${c.border} shadow-sm hover:shadow-md transition-all duration-200 p-5 overflow-hidden`}>

      {/* Decorative background circles */}
      <div className={`absolute -top-4 -right-4 w-24 h-24 rounded-full ${c.ring} blur-xl`} />
      <div className={`absolute -bottom-6 -right-2 w-16 h-16 rounded-full ${c.ring} blur-lg opacity-60`} />

      {/* Dot grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(circle, #1b1464 1px, transparent 1px)', backgroundSize: '14px 14px' }}
      />

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 ${c.iconBg} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
            <Icon size={18} className="text-white" />
          </div>
          <span className="text-xs text-gray-400 font-medium text-right leading-tight">{label}</span>
        </div>
        <p className={`text-3xl font-bold ${c.text} tracking-tight`}>{value}</p>
        {sub && <p className={`text-xs mt-1.5 ${c.sub}`}>{sub}</p>}
      </div>
    </div>
  )
}
