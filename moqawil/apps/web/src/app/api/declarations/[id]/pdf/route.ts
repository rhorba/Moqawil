import { auth } from '@/lib/auth'
import { getEntrepreneur } from '@/lib/queries/entrepreneur'
import { db, quarterlyDeclarations } from '@moqawil/db'
import { eq, and } from 'drizzle-orm'
import { renderDeclarationPdf } from '@moqawil/pdf-templates'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

  const entrepreneur = await getEntrepreneur(session.user.id)
  if (!entrepreneur) return new NextResponse('Profile not found', { status: 404 })

  const { id } = await params

  const [decl] = await db
    .select()
    .from(quarterlyDeclarations)
    .where(
      and(
        eq(quarterlyDeclarations.id, id),
        eq(quarterlyDeclarations.entrepreneurId, entrepreneur.id)
      )
    )
    .limit(1)

  if (!decl) return new NextResponse('Declaration not found', { status: 404 })

  const pdfBuffer = await renderDeclarationPdf({
    declaration: {
      year: decl.year,
      quarter: decl.quarter,
      totalTurnoverMad: parseFloat(decl.totalTurnoverMad),
      taxRate: parseFloat(decl.taxRate),
      taxDueMad: parseFloat(decl.taxDueMad),
      status: decl.status,
      submittedAt: decl.submittedAt,
    },
    entrepreneur: {
      fullName: entrepreneur.fullName,
      ice: entrepreneur.ice,
      ifNumber: entrepreneur.ifNumber,
      address: entrepreneur.address,
      city: entrepreneur.city,
      phone: entrepreneur.phone,
      activityType: entrepreneur.activityType,
      invoicePrefix: entrepreneur.invoicePrefix,
      registrationDate: entrepreneur.registrationDate,
    },
  })

  const filename = `declaration-T${decl.quarter}-${decl.year}.pdf`

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(pdfBuffer.length),
    },
  })
}
