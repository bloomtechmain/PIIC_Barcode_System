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
      background:#f0f0f0;
      display:flex; flex-direction:column;
      align-items:center; justify-content:center;
      min-height:100vh; gap:12px;
    }
    .card {
      background:#fff; border:1px solid #ddd;
      border-radius:10px; padding:20px;
      display:flex; flex-direction:column;
      align-items:center; width:360px;
      box-shadow:0 2px 8px rgba(0,0,0,0.1);
    }
    .barcode { width:100%; margin-bottom:12px; }
    .barcode svg { width:100% !important; height:auto !important; display:block; }
    .ticket-lbl { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; color:#888; margin-bottom:3px; }
    .ticket-no  { font-size:24px; font-weight:700; letter-spacing:0.5px; margin-bottom:6px; }
    .item-lbl   { font-size:13px; color:#555; margin-bottom:14px; }
    .btn {
      background:#1b1464; color:#fff; border:none;
      padding:10px 28px; border-radius:7px;
      font-size:14px; font-weight:600; cursor:pointer;
      display:flex; align-items:center; gap:6px;
    }
    .btn:hover { background:#2a2480; }
    .hint { font-size:10px; color:#999; font-family:sans-serif; }

    @media print {
      @page { size: portrait; margin: 0; }
      body { background:#fff; padding:0; justify-content:flex-start; min-height:unset; gap:0; }
      .card { border:none; box-shadow:none; border-radius:0; padding:6mm; width:100%; }
      .btn, .hint { display:none; }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="barcode">${svgHTML}</div>
    <p class="ticket-lbl">Ticket No</p>
    <p class="ticket-no">${displayTicket}</p>
    ${label ? `<p class="item-lbl">${label}</p>` : ''}
    <button class="btn" onclick="window.print()">🖨️ Print</button>
  </div>
  <p class="hint">Select your thermal printer, then click Print.</p>
</body>
</html>`

    const win = window.open('', '_blank', 'width=440,height=640,toolbar=0,location=0,menubar=0,scrollbars=0')
    if (!win) {
      alert('Please allow popups for this site to enable printing.')
      return
    }
    win.document.write(html)
    win.document.close()
    win.focus()
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
