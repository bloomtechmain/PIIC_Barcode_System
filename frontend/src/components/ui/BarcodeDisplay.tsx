import { useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'
import { Printer } from 'lucide-react'

interface BarcodeDisplayProps {
  value: string
  showPrint?: boolean
  label?: string
  large?: boolean
}

export default function BarcodeDisplay({ value, showPrint = false, label, large = false }: BarcodeDisplayProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return
    JsBarcode(svgRef.current, value, {
      format:       'CODE128',
      width:        1.0,
      height:       48,
      displayValue: false,
      margin:       6,
      background:   '#ffffff',
      lineColor:    '#111827'
    })
    // Override the fixed pixel width JsBarcode sets so the SVG scales
    // to fit its container while the viewBox keeps proportions correct
    svgRef.current.style.width   = '100%'
    svgRef.current.style.height  = 'auto'
    svgRef.current.style.display = 'block'
  }, [value, large])

  const handlePrint = () => {
    const svg = svgRef.current
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const win = window.open('', '_blank', 'width=400,height=300')
    if (!win) return

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Barcode — ${value}</title>
          <style>
            body { margin: 0; display: flex; flex-direction: column;
                   align-items: center; justify-content: center;
                   min-height: 100vh; font-family: monospace; }
            .label { font-size: 13px; color: #374151; margin-top: 6px; }
          </style>
        </head>
        <body>
          ${svgData}
          ${label ? `<p class="label">${label}</p>` : ''}
          <script>window.onload = () => { window.print(); window.close() }<\/script>
        </body>
      </html>
    `)
    win.document.close()
  }

  return (
    <div className="flex flex-col items-center w-full">
      <div className="bg-white border border-gray-200 rounded-xl p-3 w-full overflow-hidden">
        <svg ref={svgRef} />
        {label && (
          <p className="text-center text-xs text-gray-500 mt-1.5 font-medium truncate px-1">{label}</p>
        )}
      </div>
      {showPrint && (
        <button onClick={handlePrint} className="btn-secondary mt-3 text-sm">
          <Printer size={14} /> Print Barcode
        </button>
      )}
    </div>
  )
}
