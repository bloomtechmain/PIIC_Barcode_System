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
    // Render a high-quality barcode SVG in a hidden off-screen container
    const tempContainer = document.createElement('div')
    tempContainer.style.cssText = 'position:absolute;left:-9999px;top:0;width:300px;'
    const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    tempContainer.appendChild(tempSvg)
    document.body.appendChild(tempContainer)

    JsBarcode(tempSvg, value, {
      format:       'CODE128',
      width:        2.5,
      height:       72,
      displayValue: false,
      margin:       4,
      background:   '#ffffff',
      lineColor:    '#000000'
    })
    tempSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    tempSvg.style.cssText = 'width:100%;height:auto;display:block;'
    const svgHTML = new XMLSerializer().serializeToString(tempSvg)
    document.body.removeChild(tempContainer)

    const displayTicket = ticketNo ?? value

    // Inject @media print styles that hide everything except our label
    const styleEl = document.createElement('style')
    styleEl.id = '__thermal_print_style__'
    styleEl.textContent = `
      @media print {
        @page { margin: 0; }
        html, body { margin: 0; padding: 0; background: #fff; }
        body > *:not(#__thermal_label__) { display: none !important; visibility: hidden !important; }
        #__thermal_label__ {
          display: flex !important;
          visibility: visible !important;
          flex-direction: column;
          align-items: center;
          width: 100%;
          position: fixed;
          top: 0; left: 0;
          background: #fff;
          padding: 3mm;
          font-family: 'Courier New', Courier, monospace;
        }
        #__thermal_label__ .t-barcode { width: 100%; margin-bottom: 2mm; }
        #__thermal_label__ .t-barcode svg { width: 100% !important; height: auto !important; display: block; }
        #__thermal_label__ .t-ticket-lbl { font-size: 7pt; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #555; margin-bottom: 0.5mm; }
        #__thermal_label__ .t-ticket-no  { font-size: 13pt; font-weight: 700; text-align: center; letter-spacing: 0.5px; margin-bottom: 1.5mm; }
        #__thermal_label__ .t-item-lbl   { font-size: 9pt; text-align: center; color: #333; }
      }
    `
    document.head.appendChild(styleEl)

    // Build the label element
    const labelEl = document.createElement('div')
    labelEl.id = '__thermal_label__'
    labelEl.style.display = 'none' // hidden in normal view
    labelEl.innerHTML = `
      <div class="t-barcode">${svgHTML}</div>
      <p class="t-ticket-lbl">Ticket No</p>
      <p class="t-ticket-no">${displayTicket}</p>
      ${label ? `<p class="t-item-lbl">${label}</p>` : ''}
    `
    document.body.appendChild(labelEl)

    // Print using the main window — shows all installed printers
    window.print()

    // Cleanup
    document.body.removeChild(labelEl)
    document.head.removeChild(styleEl)
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
