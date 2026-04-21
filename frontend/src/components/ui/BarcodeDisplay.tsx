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
    const svg = svgRef.current
    if (!svg) return

    // Re-render a fresh SVG at higher resolution for print
    const printSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    JsBarcode(printSvg, value, {
      format:       'CODE128',
      width:        2.2,
      height:       70,
      displayValue: false,
      margin:       4,
      background:   '#ffffff',
      lineColor:    '#000000'
    })
    const svgData = new XMLSerializer().serializeToString(printSvg)

    const displayTicket = ticketNo ?? value

    const win = window.open('', '_blank', 'width=320,height=400')
    if (!win) return

    win.document.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Barcode Label</title>
    <style>
      @page {
        size: 75mm auto;
        margin: 2mm 3mm;
      }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        width: 69mm;
        font-family: 'Courier New', Courier, monospace;
        display: flex;
        flex-direction: column;
        align-items: center;
        background: #fff;
      }
      .barcode-wrap {
        width: 100%;
        margin-bottom: 2mm;
      }
      .barcode-wrap svg {
        width: 100% !important;
        height: auto !important;
        display: block;
      }
      .ticket-no {
        font-size: 13pt;
        font-weight: 700;
        text-align: center;
        letter-spacing: 0.5px;
        margin-bottom: 1.5mm;
      }
      .ticket-label {
        font-size: 7pt;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #555;
        margin-bottom: 0.5mm;
      }
      .item-label {
        font-size: 9pt;
        text-align: center;
        color: #333;
        margin-bottom: 1mm;
      }
    </style>
  </head>
  <body>
    <div class="barcode-wrap">${svgData}</div>
    <p class="ticket-label">Ticket No</p>
    <p class="ticket-no">${displayTicket}</p>
    ${label ? `<p class="item-label">${label}</p>` : ''}
    <script>
      window.onload = function() {
        window.print();
        window.close();
      };
    <\/script>
  </body>
</html>`)
    win.document.close()
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
