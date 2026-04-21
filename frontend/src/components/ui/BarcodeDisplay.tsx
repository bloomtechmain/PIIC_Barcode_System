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
    // Render a high-quality barcode in an off-screen container
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
    tempSvg.setAttribute('width', '100%')
    tempSvg.removeAttribute('height')
    const svgHTML = new XMLSerializer().serializeToString(tempSvg)
    document.body.removeChild(tempContainer)

    const displayTicket = ticketNo ?? value

    // Build the label element (hidden until beforeprint fires)
    const labelEl = document.createElement('div')
    labelEl.id   = '__thermal_label__'
    labelEl.style.cssText = 'display:none;'
    labelEl.innerHTML = `
      <div style="width:100%;margin-bottom:3mm;">${svgHTML}</div>
      <p style="font-size:7pt;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#555;margin:0 0 1mm 0;">Ticket No</p>
      <p style="font-size:13pt;font-weight:700;margin:0 0 2mm 0;letter-spacing:0.5px;">${displayTicket}</p>
      ${label ? `<p style="font-size:9pt;color:#333;margin:0;">${label}</p>` : ''}
    `
    document.body.appendChild(labelEl)

    // @page style — no size declaration, just zero margin
    const pageStyle = document.createElement('style')
    pageStyle.textContent = '@page { margin: 0; }'
    document.head.appendChild(pageStyle)

    const appRoot = document.getElementById('root')

    // beforeprint: show label, hide app — fires right before Chrome renders print preview
    const onBefore = () => {
      labelEl.style.cssText = [
        'display:flex',
        'flex-direction:column',
        'align-items:center',
        'width:100%',
        'padding:4mm',
        'background:#fff',
        'font-family:"Courier New",Courier,monospace',
        'box-sizing:border-box',
      ].join(';')
      if (appRoot) appRoot.style.display = 'none'
    }

    // afterprint: restore everything
    const onAfter = () => {
      document.body.removeChild(labelEl)
      document.head.removeChild(pageStyle)
      if (appRoot) appRoot.style.display = ''
      window.removeEventListener('beforeprint', onBefore)
      window.removeEventListener('afterprint',  onAfter)
    }

    window.addEventListener('beforeprint', onBefore)
    window.addEventListener('afterprint',  onAfter)

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
