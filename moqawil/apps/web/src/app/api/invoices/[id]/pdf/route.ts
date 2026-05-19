import { auth } from '@/lib/auth'
import { getEntrepreneur } from '@/lib/queries/entrepreneur'
import { getInvoiceWithLines } from '@/lib/queries/invoice'
import { getClientById } from '@/lib/queries/client'
import { renderInvoicePdf } from '@moqawil/pdf-templates'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const entrepreneur = await getEntrepreneur(session.user.id)
  if (!entrepreneur) {
    return new NextResponse('Profile not found', { status: 404 })
  }

  const { id } = await params
  const data = await getInvoiceWithLines(id, entrepreneur.id)
  if (!data) {
    return new NextResponse('Invoice not found', { status: 404 })
  }

  const client = await getClientById(data.invoice.clientId, entrepreneur.id)
  if (!client) {
    return new NextResponse('Client not found', { status: 404 })
  }

  const pdfBuffer = await renderInvoicePdf({
    invoice: {
      invoiceNumber: data.invoice.invoiceNumber,
      issueDate: data.invoice.issueDate,
      dueDate: data.invoice.dueDate,
      currency: data.invoice.currency,
      exchangeRate: data.invoice.exchangeRate,
      subtotalMad: data.invoice.subtotalMad,
      totalMad: data.invoice.totalMad,
      notes: data.invoice.notes,
      paymentMethod: data.invoice.paymentMethod,
    },
    lines: data.lines.map((l) => ({
      position: l.position,
      description: l.description,
      quantity: l.quantity,
      unitPriceOriginal: l.unitPriceOriginal,
      lineTotalOriginal: l.lineTotalOriginal,
      lineTotalMad: l.lineTotalMad,
    })),
    entrepreneur: {
      fullName: entrepreneur.fullName,
      ice: entrepreneur.ice,
      ifNumber: entrepreneur.ifNumber,
      address: entrepreneur.address,
      city: entrepreneur.city,
      phone: entrepreneur.phone,
      activityType: entrepreneur.activityType,
      invoicePrefix: entrepreneur.invoicePrefix,
    },
    client: {
      name: client.name,
      ice: client.ice,
      ifNumber: client.ifNumber,
      address: client.address,
      countryCode: client.countryCode,
    },
  })

  const filename = `${data.invoice.invoiceNumber}.pdf`

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(pdfBuffer.length),
    },
  })
}
