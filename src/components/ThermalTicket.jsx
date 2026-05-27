import React from 'react'
import Barcode from 'react-barcode'

/**
 * ThermalTicket
 * Renderiza el formato de ticket para impresoras térmicas de 80mm.
 */
export const ThermalTicket = ({ sale, items = [], company, type = 'DIRECT', copyName = '' }) => {
  if (!sale) return null

  // Config default if none exists
  const defaultTicketBlocks = [
    { id: 'logo', label: 'Logotipo', visible: true, align: 'center' },
    { id: 'trade_name', label: 'Razón Social / Nombre', visible: true, align: 'center' },
    { id: 'rfc', label: 'RFC', visible: true, align: 'center' },
    { id: 'address', label: 'Dirección Completa', visible: true, align: 'center' },
    { id: 'phone', label: 'Teléfono', visible: true, align: 'center' },
    { id: 'sale_info', label: 'Datos de Venta', visible: true, align: 'left' },
    { id: 'seller', label: 'Vendedor / Cajero', visible: true, align: 'left' },
    { id: 'customer', label: 'Datos del Cliente', visible: true, align: 'left' },
    { id: 'items_table', label: 'Tabla de Productos', visible: true, align: 'left' },
    { id: 'totals', label: 'Totales', visible: true, align: 'right' },
    { id: 'barcode', label: 'Código de Barras', visible: true, align: 'center' },
    { id: 'message', label: 'Mensaje Final', visible: true, align: 'center' }
  ]
  
  let configArray = defaultTicketBlocks

  if (company?.ticket_config) {
    let parsed = company.ticket_config
    if (typeof parsed === 'string') { try { parsed = JSON.parse(parsed) } catch(e) {} }
    if (Array.isArray(parsed)) { configArray = parsed } 
    else {
      configArray = defaultTicketBlocks.map(block => {
         if (block.id === 'logo') return { ...block, visible: parsed?.show_logo ?? true }
         if (block.id === 'trade_name') return { ...block, visible: parsed?.show_trade_name ?? true }
         if (block.id === 'rfc') return { ...block, visible: parsed?.show_rfc ?? true }
         if (block.id === 'address') return { ...block, visible: parsed?.show_address ?? true }
         if (block.id === 'phone') return { ...block, visible: parsed?.show_phone ?? true }
         if (block.id === 'customer') return { ...block, visible: parsed?.show_customer ?? true }
         if (block.id === 'barcode') return { ...block, visible: parsed?.show_barcode ?? true }
         return block
      })
    }
  }

  const formatCurrency = (amount) => '$' + (amount / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })
  const formatDate = (dateString) => {
    const d = new Date(dateString)
    return d.toLocaleDateString('es-MX') + ' ' + d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  }

  const renderers = {
    logo: (block) => company?.logo_url ? (
      <div className="flex justify-center mb-2">
        <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:4002'}${company.logo_url}`} alt="Logo" className="w-full h-auto object-contain grayscale" style={{ filter: 'grayscale(100%) contrast(1.2)', maxWidth: '100%' }} />
      </div>
    ) : null,
    
    trade_name: (block) => (<h1 className={`text-lg font-black uppercase text-${block.align} leading-tight`}>{company?.trade_name || company?.name || 'CIMENTA'}</h1>),
    rfc: (block) => company?.rfc ? (<p className={`text-${block.align} text-[10px] font-bold`}>RFC: {company.rfc}</p>) : null,
    address: (block) => company?.address ? (<p className={`text-${block.align} text-[9px] leading-tight font-bold text-gray-600`}>{company.address}</p>) : null,
    phone: (block) => company?.phone ? (<p className={`text-${block.align} text-[10px] font-bold`}>Tel: {company.phone}</p>) : null,

    sale_info: (block) => (
      <div className={`text-${block.align} my-1 text-[10px] border-y border-black py-1`}>
        <p className="flex justify-between"><strong>FOLIO:</strong> <span className="font-black text-base">{sale.folio}</span></p>
        <p className="flex justify-between"><strong>FECHA:</strong> <span className="font-bold text-[9px]">{formatDate(sale.created_at)}</span></p>
      </div>
    ),

    seller: (block) => sale.seller ? (<div className={`text-${block.align} text-[10px] mb-1`}><p><strong>ATENDIÓ:</strong> {sale.seller.name}</p></div>) : null,
    customer: (block) => sale.customer ? (<div className={`text-${block.align} text-[10px] mb-2`}><p className="border-b border-black pb-1"><strong>CLIENTE:</strong> {sale.customer.name}</p></div>) : null,

    items_table: (block) => (
      <div className={`my-2 text-[10px] text-${block.align}`}>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="w-2/12 py-1">CANT</th>
              <th className="w-6/12 py-1">DESCRIPCIÓN</th>
              <th className="text-right w-4/12 py-1">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="align-top border-b border-gray-100">
                <td className="py-1 font-bold">{item.quantity}</td>
                <td className="py-1 pr-1 leading-tight">{item.product?.name || item.description || 'Producto'}</td>
                <td className="py-1 text-right font-bold">{formatCurrency(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),

    totals: (block) => (
      <div className={`my-1 flex flex-col items-${block.align === 'left' ? 'start' : block.align === 'center' ? 'center' : 'end'}`}>
        <div className="w-full border-[2px] border-black p-0.5">
          <div className="flex justify-between items-center bg-black text-white px-2 py-2 total-highlight">
            <span className="font-black text-[10px] uppercase leading-none">TOTAL A<br/>PAGAR:</span>
            <span className="font-black text-xl">{(sale.total_amount / 100).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</span>
          </div>
          {sale.payment_method && (<div className="flex justify-between text-[10px] font-black mt-1 px-1"><span>MÉTODO: {sale.payment_method}</span></div>)}
        </div>
      </div>
    ),

    barcode: (block) => sale.folio ? (
      <div className={`flex justify-${block.align === 'left' ? 'start' : block.align === 'right' ? 'end' : 'center'} my-2 overflow-hidden`}>
        <Barcode value={sale.folio} width={1.2} height={30} fontSize={9} background="#ffffff" lineColor="#000000" margin={0} />
      </div>
    ) : null,

    message: (block) => company?.receipt_message ? (
      <div className={`text-${block.align} text-[10px] mt-2 italic font-bold leading-tight border-t border-dashed border-gray-300 pt-1`}>
        <p className="whitespace-pre-line">{company.receipt_message}</p>
      </div>
    ) : null
  }

  return (
    <div className="ticket-80mm font-mono text-black bg-white p-2 pr-4 mx-auto text-xs" style={{ width: '74mm' }}>
      {copyName && (
        <div className="text-center bg-black text-white py-2 mb-2 border-2 border-black total-highlight">
          <h2 className="text-lg font-black uppercase tracking-tighter">{copyName}</h2>
        </div>
      )}
      {configArray.filter(b => b.visible).map(block => (<div key={block.id}>{renderers[block.id] ? renderers[block.id](block) : null}</div>))}
    </div>
  )
}

export const PrintableTicket = ({ sale, items, company, type }) => {
  const copies = type === 'REMISION_FULL' ? ['CLIENTE', 'ALMACÉN', 'CAJA'] : [null]
  return (
    <div className="hidden print:block w-[74mm] bg-white print-container-parent overflow-visible">
      {copies.map((name, i) => (
        <div key={i} className="print-copy-wrapper overflow-visible">
          <ThermalTicket sale={sale} items={items} company={company} type={type} copyName={name ? `*** COPIA ${name} ***` : ''} />
          <div className="h-8"></div>
          <div className="page-break"></div>
        </div>
      ))}
    </div>
  )
}
