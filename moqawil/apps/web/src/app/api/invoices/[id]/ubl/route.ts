import { auth } from '@/lib/auth'
import { getClearanceProvider } from '@/lib/clearance/provider'
import { getClientById } from '@/lib/queries/client'
import { getEntrepreneur } from '@/lib/queries/entrepreneur'
import { getInvoiceWithLines } from '@/lib/queries/invoice'
import arMessages from '@/messages/ar.json'
import frMessages from '@/messages/fr.json'
import { db, invoices } from '@moqawil/db'
import { mapInvoiceToUbl } from '@moqawil/tax-engine'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

// Sprint 4 — e-invoicing format readiness (docs/architecture-sprint4-e-invoicing.md).
// UBL 2.1 XML export ONLY. This route does not submit anything to DGI/xHub — see
// apps/web/lib/clearance/provider.ts — and must never be described as "cleared" or
// "certified" anywhere in the response or the UI that calls it (Sprint 4 DoD).
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

  const vatNoticeFr = frMessages.legal.vatNotice
  const vatNoticeAr = arMessages.legal.vatNoticeAr

  const xml = mapInvoiceToUbl({
    invoiceNumber: data.invoice.invoiceNumber,
    issueDate: data.invoice.issueDate,
    currency: data.invoice.currency,
    seller: {
      name: entrepreneur.fullName,
      address: entrepreneur.address,
      city: entrepreneur.city,
      ice: entrepreneur.ice,
      ifNumber: entrepreneur.ifNumber,
    },
    buyer: {
      name: client.name,
      address: client.address ?? '',
      city: '',
      ice: client.ice ?? undefined,
    },
    lines: data.lines.map((l) => ({
      description: l.description,
      quantity: Number(l.quantity),
      unitPrice: Number(l.unitPriceOriginal),
      lineTotal: Number(l.lineTotalOriginal),
    })),
    totalMad: Number(data.invoice.totalMad),
    notesFr: vatNoticeFr,
    notesAr: vatNoticeAr,
  })

  // Wired but inert in v0.1 — NoOpClearanceProvider always returns 'not_applicable'. This
  // is the actual integration point a real DgiXhubClearanceProvider plugs into later
  // (Sprint 5+) without touching this route or invoice creation at all (ADR-2).
  const clearanceResult = await getClearanceProvider().submitInvoice(xml)

  // First-generation marker only — no real clearance has happened yet.
  if (
    data.invoice.clearanceStatus === 'not_applicable' &&
    clearanceResult.status === 'not_applicable'
  ) {
    await db.update(invoices).set({ clearanceStatus: 'ready' }).where(eq(invoices.id, id))
  }

  const filename = `${data.invoice.invoiceNumber}.xml`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
