/**
 * @moqawil/pdf-templates
 * React-PDF templates for invoices and quarterly declarations.
 * Server-side rendering only — do not import in client components.
 */

import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { DeclarationDocument, type DeclarationPdfProps } from './declaration-template'
import { InvoiceDocument, type InvoicePdfProps } from './invoice-template'
import { QuoteDocument, type QuotePdfProps } from './quote-template'

export type { InvoicePdfProps, DeclarationPdfProps, QuotePdfProps }

export async function renderInvoicePdf(data: InvoicePdfProps): Promise<Buffer> {
  // biome-ignore lint/suspicious/noExplicitAny: react-pdf's Document element type doesn't compose with React.createElement's generic signature.
  const element = React.createElement(InvoiceDocument as any, data)
  // biome-ignore lint/suspicious/noExplicitAny: renderToBuffer expects react-pdf's own ReactElement<DocumentProps>, which this doesn't satisfy.
  return renderToBuffer(element as any)
}

export async function renderDeclarationPdf(data: DeclarationPdfProps): Promise<Buffer> {
  // biome-ignore lint/suspicious/noExplicitAny: see renderInvoicePdf above.
  const element = React.createElement(DeclarationDocument as any, data)
  // biome-ignore lint/suspicious/noExplicitAny: see renderInvoicePdf above.
  return renderToBuffer(element as any)
}

export async function renderQuotePdf(data: QuotePdfProps): Promise<Buffer> {
  // biome-ignore lint/suspicious/noExplicitAny: see renderInvoicePdf above.
  const element = React.createElement(QuoteDocument as any, data)
  // biome-ignore lint/suspicious/noExplicitAny: see renderInvoicePdf above.
  return renderToBuffer(element as any)
}
