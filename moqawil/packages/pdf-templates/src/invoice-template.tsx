/**
 * Invoice PDF template — CGI Article 145 + AE mandatory fields.
 * Bilingual FR (primary) + AR mentions for legal compliance.
 * Rendered server-side via @react-pdf/renderer.
 */

import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'

// Register a font that supports Arabic characters for bilingual mentions
// Falls back to Helvetica for French content
Font.registerEmojiSource({
  format: 'png',
  url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/',
})

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#1a1a1a',
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
    lineHeight: 1.4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: '#1a6e7e',
    paddingBottom: 16,
  },
  brandName: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#1a6e7e',
    letterSpacing: 1,
  },
  invoiceLabel: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#1a6e7e',
    textAlign: 'right',
  },
  invoiceNumber: {
    fontSize: 11,
    color: '#555',
    textAlign: 'right',
    marginTop: 2,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  twoCol: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  col: {
    flex: 1,
  },
  colRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  label: {
    fontSize: 7,
    color: '#888',
    marginBottom: 1,
  },
  value: {
    fontSize: 9,
    marginBottom: 2,
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  },
  // Line items table
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f4f5',
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRadius: 3,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: 'right' },
  colPrice: { flex: 1.5, textAlign: 'right' },
  colTotal: { flex: 1.5, textAlign: 'right' },
  tableHeaderText: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#555',
  },
  // Totals
  totalsBox: {
    alignItems: 'flex-end',
    marginTop: 8,
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: 'row',
    width: 200,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  totalFinalRow: {
    flexDirection: 'row',
    width: 200,
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderTopWidth: 1.5,
    borderTopColor: '#1a6e7e',
    marginTop: 2,
  },
  totalFinalText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: '#1a6e7e',
  },
  // Legal mentions
  legalBox: {
    borderTopWidth: 0.5,
    borderTopColor: '#ccc',
    paddingTop: 12,
    marginTop: 8,
  },
  legalTitle: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  legalBilingual: {
    flexDirection: 'row',
    gap: 16,
  },
  legalFr: {
    flex: 1,
    fontSize: 7.5,
    color: '#555',
    lineHeight: 1.5,
  },
  legalAr: {
    flex: 1,
    fontSize: 7.5,
    color: '#555',
    textAlign: 'right',
    lineHeight: 1.5,
  },
  pageFooter: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: '#ddd',
    paddingTop: 6,
  },
  footerText: {
    fontSize: 7,
    color: '#999',
  },
})

function fmt(n: number | string, currency = 'MAD') {
  const val = typeof n === 'string' ? parseFloat(n) : n
  return `${new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val)} ${currency}`
}

export interface InvoicePdfProps {
  invoice: {
    invoiceNumber: string
    issueDate: string
    dueDate?: string | null
    currency: string
    exchangeRate?: string | null
    subtotalMad: string
    totalMad: string
    notes?: string | null
    paymentMethod?: string | null
  }
  lines: Array<{
    position: number
    description: string
    quantity: string
    unitPriceOriginal: string
    lineTotalOriginal: string
    lineTotalMad: string
  }>
  entrepreneur: {
    fullName: string
    ice: string
    ifNumber: string
    address: string
    city: string
    phone?: string | null
    activityType: string
    invoicePrefix: string
  }
  client: {
    name: string
    ice?: string | null
    ifNumber?: string | null
    address?: string | null
    countryCode: string
  }
}

export function InvoiceDocument({ invoice, lines, entrepreneur, client }: InvoicePdfProps) {
  const isForeign = client.countryCode !== 'MA'
  const isForeignCurrency = invoice.currency !== 'MAD'

  const paymentLabels: Record<string, string> = {
    virement: 'Virement bancaire',
    cheque: 'Chèque',
    espece: 'Espèces',
    effet: 'Effet de commerce',
    carte: 'Carte bancaire',
    other: 'Autre',
  }

  return (
    <Document
      title={invoice.invoiceNumber}
      author={entrepreneur.fullName}
      subject="Facture — Régime auto-entrepreneur Maroc"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>{entrepreneur.fullName}</Text>
            <Text style={[styles.value, { marginTop: 4 }]}>{entrepreneur.address}</Text>
            <Text style={styles.value}>{entrepreneur.city}</Text>
            {entrepreneur.phone && <Text style={styles.value}>{entrepreneur.phone}</Text>}
            <Text style={styles.value}>ICE : {entrepreneur.ice}</Text>
            <Text style={styles.value}>IF : {entrepreneur.ifNumber}</Text>
          </View>
          <View>
            <Text style={styles.invoiceLabel}>FACTURE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
          </View>
        </View>

        {/* Dates + client */}
        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Facturé à</Text>
            <Text style={[styles.value, styles.bold]}>{client.name}</Text>
            {client.address && <Text style={styles.value}>{client.address}</Text>}
            {client.ice && <Text style={styles.value}>ICE : {client.ice}</Text>}
            {client.ifNumber && <Text style={styles.value}>IF : {client.ifNumber}</Text>}
            {isForeign && <Text style={styles.value}>Pays : {client.countryCode}</Text>}
          </View>
          <View style={styles.colRight}>
            <Text style={styles.sectionTitle}>Dates</Text>
            <Text style={styles.value}>
              <Text style={[styles.label]}>Date d'émission : </Text>
              {invoice.issueDate}
            </Text>
            {invoice.dueDate && (
              <Text style={styles.value}>
                <Text style={styles.label}>Échéance : </Text>
                {invoice.dueDate}
              </Text>
            )}
            {invoice.paymentMethod && (
              <Text style={styles.value}>
                <Text style={styles.label}>Paiement : </Text>
                {paymentLabels[invoice.paymentMethod] ?? invoice.paymentMethod}
              </Text>
            )}
            {isForeignCurrency && (
              <Text style={styles.value}>
                <Text style={styles.label}>Taux BAM : </Text>
                {invoice.exchangeRate} MAD/{invoice.currency}
              </Text>
            )}
          </View>
        </View>

        {/* Line items table */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colDesc]}>Description</Text>
          <Text style={[styles.tableHeaderText, styles.colQty]}>Qté</Text>
          <Text style={[styles.tableHeaderText, styles.colPrice]}>
            Prix HT ({invoice.currency})
          </Text>
          <Text style={[styles.tableHeaderText, styles.colTotal]}>Total (DH)</Text>
        </View>
        {lines.map((line) => (
          <View key={line.position} style={styles.tableRow}>
            <Text style={[styles.value, styles.colDesc]}>{line.description}</Text>
            <Text style={[styles.value, styles.colQty]}>
              {new Intl.NumberFormat('fr-MA').format(parseFloat(line.quantity))}
            </Text>
            <Text style={[styles.value, styles.colPrice]}>
              {fmt(line.unitPriceOriginal, invoice.currency)}
            </Text>
            <Text style={[styles.value, styles.colTotal]}>{fmt(line.lineTotalMad, 'DH')}</Text>
          </View>
        ))}

        {/* Totals */}
        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text style={[styles.value, { color: '#555' }]}>Sous-total</Text>
            <Text style={styles.value}>{fmt(invoice.subtotalMad, 'DH')}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={[styles.value, { color: '#555' }]}>TVA</Text>
            <Text style={[styles.value, { color: '#555' }]}>Non applicable</Text>
          </View>
          <View style={styles.totalFinalRow}>
            <Text style={styles.totalFinalText}>TOTAL TTC</Text>
            <Text style={styles.totalFinalText}>{fmt(invoice.totalMad, 'DH')}</Text>
          </View>
        </View>

        {/* Legal mentions — bilingual FR + AR (CGI Article 145) */}
        <View style={styles.legalBox}>
          <Text style={styles.legalTitle}>Mentions légales obligatoires</Text>
          <View style={styles.legalBilingual}>
            <View style={styles.legalFr}>
              <Text>TVA non applicable — Régime auto-entrepreneur (Loi 114-13)</Text>
              <Text>Factures à conserver 10 ans (CGI Art. 211)</Text>
              {isForeignCurrency && (
                <Text>
                  Rapatriement des devises dans un délai de 3 mois (Réglementation des changes)
                </Text>
              )}
            </View>
            <View style={styles.legalAr}>
              <Text>ضريبة القيمة المضافة غير مطبقة — نظام المقاول الذاتي (قانون 114-13)</Text>
              <Text>يجب حفظ الفواتير لمدة 10 سنوات (م. 211 م.ع.ض)</Text>
              {isForeignCurrency && (
                <Text>تحويل العملة الأجنبية في أجل 3 أشهر</Text>
              )}
            </View>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={[styles.value, { color: '#555' }]}>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.pageFooter} fixed>
          <Text style={styles.footerText}>{invoice.invoiceNumber}</Text>
          <Text style={styles.footerText}>
            {entrepreneur.fullName} — ICE {entrepreneur.ice}
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}
