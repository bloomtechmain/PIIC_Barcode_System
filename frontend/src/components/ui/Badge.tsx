interface BadgeProps {
  value: string
  className?: string
}

const variantMap: Record<string, string> = {
  ACTIVE:   'bg-green-100 text-green-800',
  RELEASED: 'bg-gray-100 text-gray-700',
  FOUND:    'bg-green-100 text-green-800',
  MISSING:  'bg-red-100 text-red-800',
  UNKNOWN:  'bg-amber-100 text-amber-800',
  ADMIN:    'bg-purple-100 text-purple-800',
  STAFF:    'bg-blue-100 text-blue-800',
}

export default function Badge({ value, className = '' }: BadgeProps) {
  const color = variantMap[value] ?? 'bg-gray-100 text-gray-700'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color} ${className}`}>
      {value}
    </span>
  )
}
