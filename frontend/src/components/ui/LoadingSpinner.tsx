export default function LoadingSpinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-16 ${className}`}>
      <div className="w-8 h-8 border-4 border-navy-100 border-t-navy-600 rounded-full animate-spin" />
    </div>
  )
}
