import { auth } from '@/lib/auth'
import { getClientById } from '@/lib/queries/client'
import { getEntrepreneur } from '@/lib/queries/entrepreneur'
import { getQuoteWithLines } from '@/lib/queries/quote'
import { renderQuotePdf } from '@moqawil/pdf-templates'
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
  const data = await getQuoteWithLines(id, entrepreneur.id)
  if (!data) {
    return new NextResponse('Quote not found', { status: 404 })
  }

  const client = await getClientById(data.quote.clientId, entrepreneur.id)
  if (!client) {
    return new NextResponse('Client not found', { status: 404 })
  }

  const pdfBuffer = await renderQuotePdf({
    quote: {
      quoteNumber: data.quote.quoteNumber,
      issueDate: data.quote.issueDate,
      validUntilDate: data.quote.validUntilDate,
      currency: data.quote.currency,
      exchangeRate: data.quote.exchangeRate,
      subtotalMad: data.quote.subtotalMad,
      totalMad: data.quote.totalMad,
      notes: data.quote.notes,
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
    },
    client: {
      name: client.name,
      ice: client.ice,
      ifNumber: client.ifNumber,
      address: client.address,
      countryCode: client.countryCode,
    },
  })

  const filename = `${data.quote.quoteNumber}.pdf`

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(pdfBuffer.length),
    },
  })
}
