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
    // Render high-quality barcode for print
    const tempContainer = document.createElement('div')
    tempContainer.style.cssText = 'position:absolute;left:-9999px;top:0;width:300px;'
    const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    tempContainer.appendChild(tempSvg)
    document.body.appendChild(tempContainer)

    JsBarcode(tempSvg, value, {
      format:       'CODE128',
      width:        3.5,
      height:       160,
      displayValue: false,
      margin:       6,
      background:   '#ffffff',
      lineColor:    '#000000'
    })
    tempSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    tempSvg.setAttribute('width', '100%')
    tempSvg.removeAttribute('height')
    const svgHTML = new XMLSerializer().serializeToString(tempSvg)
    document.body.removeChild(tempContainer)

    const displayTicket = ticketNo ?? value

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Print Label</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      font-family:'Courier New',Courier,monospace;
      background:#fff;
      display:flex; flex-direction:column;
      align-items:center; justify-content:center;
      padding:6mm;
    }
    .barcode { width:100%; margin-bottom:10px; }
    .barcode svg { width:100% !important; height:auto !important; display:block; }
    .ticket-lbl { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; color:#888; margin-bottom:3px; }
    .ticket-no  { font-size:22px; font-weight:700; letter-spacing:0.5px; margin-bottom:4px; }
    .item-lbl   { font-size:12px; color:#555; }
  </style>
</head>
<body>
  <div class="barcode">${svgHTML}</div>
  <p class="ticket-lbl">Ticket No</p>
  <p class="ticket-no">${displayTicket}</p>
  ${label ? `<p class="item-lbl">${label}</p>` : ''}
</body>
</html>`

    // Use a hidden iframe to avoid popup blockers
    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:0;height:0;border:0;'
    document.body.appendChild(iframe)

    const doc = iframe.contentDocument ?? iframe.contentWindow?.document
    if (!doc) { document.body.removeChild(iframe); return }

    doc.open()
    doc.write(html)
    doc.close()

    iframe.onload = () => {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
      setTimeout(() => document.body.removeChild(iframe), 1000)
    }
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
