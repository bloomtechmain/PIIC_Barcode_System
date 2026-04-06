import { Scale } from 'lucide-react'

interface WeightBadgeProps {
  weight: number | string
  size?: 'sm' | 'md'
  className?: string
}

export default function WeightBadge({ weight, size = 'md', className = '' }: WeightBadgeProps) {
  const formatted = Number(weight).toFixed(3)

  if (size === 'sm') {
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-medium text-navy-700 bg-navy-50 px-2 py-0.5 rounded-full ${className}`}>
        <Scale size={10} />
        {formatted}g
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 bg-navy-50 border border-navy-200 px-2.5 py-1 rounded-lg ${className}`}>
      <Scale size={13} className="text-navy-600" />
      {formatted}
      <span className="text-xs font-normal text-gray-400">g</span>
    </span>
  )
}
