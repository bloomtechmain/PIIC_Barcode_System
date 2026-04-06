interface CustomerAvatarProps {
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

/** Deterministic color per customer so the same name always gets the same color */
const getColor = (name: string): string => {
  const colors = [
    'bg-navy-600',
    'bg-magenta-500',
    'bg-blue-600',
    'bg-emerald-600',
    'bg-violet-600',
    'bg-cyan-700',
    'bg-rose-600',
    'bg-teal-600',
  ]
  const index = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length
  return colors[index]
}

const sizeMap = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-11 h-11 text-base',
}

export default function CustomerAvatar({ name, size = 'md', className = '' }: CustomerAvatarProps) {
  return (
    <div
      className={`
        ${sizeMap[size]} ${getColor(name)} ${className}
        rounded-full flex items-center justify-center
        text-white font-bold flex-shrink-0 select-none
      `}
      title={name}
    >
      {getInitials(name)}
    </div>
  )
}
