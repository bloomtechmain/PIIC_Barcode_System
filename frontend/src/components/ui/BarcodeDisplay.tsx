import { useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'
import { Printer } from 'lucide-react'

interface BarcodeDisplayProps {
  value: string
  showPrint?: boolean
  label?: string
  large?: boolean
  ticketNo?: string
}

export default function BarcodeDisplay({ value, showPrint = false, label, large = false, ticketNo }: BarcodeDisplayProps) {
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
    svgRef.current.style.width   = '100%'
    svgRef.current.style.height  = 'auto'
    svgRef.current.style.display = 'block'
  }, [value, large])

  const handlePrint = () => {
    // Render high-quality barcode SVG
    const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const tempContainer = document.createElement('div')
    tempContainer.style.cssText = 'position:absolute;left:-9999px;top:0;width:300px;'
    tempContainer.appendChild(tempSvg)
    document.body.appendChild(tempContainer)

    JsBarcode(tempSvg, value, {
      format:       'CODE128',
      width:        5,
      height:       220,
      displayValue: false,
      margin:       8,
      background:   '#ffffff',
      lineColor:    '#000000'
    })
    tempSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    tempSvg.setAttribute('width', '100%')
    tempSvg.removeAttribute('height')
    const svgHTML = new XMLSerializer().serializeToString(tempSvg)
    document.body.removeChild(tempContainer)

    const displayTicket = ticketNo ?? value

    // Inject a print-only overlay into the current page — no popup/iframe needed
    const printArea = document.createElement('div')
    printArea.id = '__barcode_print__'
    printArea.innerHTML = `
      <div style="font-family:'Courier New',Courier,monospace;display:flex;flex-direction:column;align-items:center;padding:6mm;">
        <div style="width:100%;margin-bottom:10px;">${svgHTML}</div>
        <p style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#888;margin-bottom:3px;">Ticket No</p>
        <p style="font-size:22px;font-weight:700;letter-spacing:0.5px;margin-bottom:4px;">${displayTicket}</p>
        ${label ? `<p style="font-size:12px;color:#555;">${label}</p>` : ''}
      </div>`

    const style = document.createElement('style')
    style.id = '__barcode_print_style__'
    style.textContent = `
      @media print {
        @page { margin: 0; }
        html, body {
          height: auto !important;
          min-height: 0 !important;
          overflow: visible !important;
        }
        body > *:not(#__barcode_print__) { display: none !important; }
        #__barcode_print__ { display: block !important; }
      }
      #__barcode_print__ { display: none; }`

    document.head.appendChild(style)
    document.body.appendChild(printArea)

    const cleanup = () => {
      document.head.removeChild(style)
      document.body.removeChild(printArea)
      window.removeEventListener('afterprint', cleanup)
    }
    window.addEventListener('afterprint', cleanup)

    window.print()
  }

  return (
    <div className="flex flex-col items-center w-full">
      <div className="bg-white border border-gray-200 rounded-xl p-3 w-full overflow-hidden">
        <svg ref={svgRef} />
        {ticketNo && (
          <div className="mt-2 text-center">
            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest">Ticket No</p>
            <p className="text-sm font-bold text-gray-800 font-mono tracking-wide">{ticketNo}</p>
          </div>
        )}
        {label && (
          <p className="text-center text-xs text-gray-500 mt-1 font-medium truncate px-1">{label}</p>
        )}
      </div>
      {showPrint && (
        <button onClick={handlePrint} className="btn-secondary mt-3 text-sm">
          <Printer size={14} /> Print Label
        </button>
      )}
    </div>
  )
}
