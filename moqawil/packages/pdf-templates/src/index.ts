/**
 * @moqawil/pdf-templates
 * React-PDF templates for invoices and quarterly declarations.
 * Server-side rendering only — do not import in client components.
 */

import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { InvoiceDocument, type InvoicePdfProps } from './invoice-template'
import { DeclarationDocument, type DeclarationPdfProps } from './declaration-template'

export type { InvoicePdfProps, DeclarationPdfProps }

export async function renderInvoicePdf(data: InvoicePdfProps): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(InvoiceDocument as any, data)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return renderToBuffer(element as any)
}

export async function renderDeclarationPdf(data: DeclarationPdfProps): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(DeclarationDocument as any, data)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return renderToBuffer(element as any)
}
