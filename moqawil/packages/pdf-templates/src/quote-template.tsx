import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

// Sprint 6: devis (quote) PDF. Deliberately mirrors invoice-template.tsx's
// layout for visual consistency, but is NOT a legal invoice — no TVA line,
// no Article 145 legal-mentions box. Carries a validity date and an explicit
// "not an invoice" disclaimer instead (CLAUDE.md's own governance rule:
// never let a document be mistaken for something it legally isn't).

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
    borderBottomColor: '#8a5a1a',
    paddingBottom: 16,
  },
  brandName: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#8a5a1a',
    letterSpacing: 1,
  },
  quoteLabel: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#8a5a1a',
    textAlign: 'right',
  },
  quoteNumber: {
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
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f0e8',
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
    borderTopColor: '#8a5a1a',
    marginTop: 2,
  },
  totalFinalText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: '#8a5a1a',
  },
  disclaimerBox: {
    borderWidth: 1,
    borderColor: '#8a5a1a',
    borderRadius: 3,
    padding: 10,
    marginTop: 8,
  },
  disclaimerTitle: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#8a5a1a',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  disclaimerBilingual: {
    flexDirection: 'row',
    gap: 16,
  },
  disclaimerFr: {
    flex: 1,
    fontSize: 7.5,
    color: '#555',
    lineHeight: 1.5,
  },
  disclaimerAr: {
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
  const val = typeof n === 'string' ? Number.parseFloat(n) : n
  return `${new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val)} ${currency}`
}

export interface QuotePdfProps {
  quote: {
    quoteNumber: string
    issueDate: string
    validUntilDate: string
    currency: string
    exchangeRate?: string | null
    subtotalMad: string
    totalMad: string
    notes?: string | null
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
  }
  client: {
    name: string
    ice?: string | null
    ifNumber?: string | null
    address?: string | null
    countryCode: string
  }
}

export function QuoteDocument({ quote, lines, entrepreneur, client }: QuotePdfProps) {
  const isForeignCurrency = quote.currency !== 'MAD'

  return (
    <Document
      title={quote.quoteNumber}
      author={entrepreneur.fullName}
      subject="Devis — Régime auto-entrepreneur Maroc"
    >
      <Page size="A4" style={styles.page}>
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
            <Text style={styles.quoteLabel}>DEVIS</Text>
            <Text style={styles.quoteNumber}>{quote.quoteNumber}</Text>
          </View>
        </View>

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Devis pour</Text>
            <Text style={[styles.value, styles.bold]}>{client.name}</Text>
            {client.address && <Text style={styles.value}>{client.address}</Text>}
            {client.ice && <Text style={styles.value}>ICE : {client.ice}</Text>}
            {client.ifNumber && <Text style={styles.value}>IF : {client.ifNumber}</Text>}
          </View>
          <View style={styles.colRight}>
            <Text style={styles.sectionTitle}>Dates</Text>
            <Text style={styles.value}>
              <Text style={styles.label}>Date d'émission : </Text>
              {quote.issueDate}
            </Text>
            <Text style={styles.value}>
              <Text style={styles.label}>Valable jusqu'au : </Text>
              {quote.validUntilDate}
            </Text>
            {isForeignCurrency && (
              <Text style={styles.value}>
                <Text style={styles.label}>Taux BAM : </Text>
                {quote.exchangeRate} MAD/{quote.currency}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colDesc]}>Description</Text>
          <Text style={[styles.tableHeaderText, styles.colQty]}>Qté</Text>
          <Text style={[styles.tableHeaderText, styles.colPrice]}>Prix HT ({quote.currency})</Text>
          <Text style={[styles.tableHeaderText, styles.colTotal]}>Total (DH)</Text>
        </View>
        {lines.map((line) => (
          <View key={line.position} style={styles.tableRow}>
            <Text style={[styles.value, styles.colDesc]}>{line.description}</Text>
            <Text style={[styles.value, styles.colQty]}>
              {new Intl.NumberFormat('fr-MA').format(Number.parseFloat(line.quantity))}
            </Text>
            <Text style={[styles.value, styles.colPrice]}>
              {fmt(line.unitPriceOriginal, quote.currency)}
            </Text>
            <Text style={[styles.value, styles.colTotal]}>{fmt(line.lineTotalMad, 'DH')}</Text>
          </View>
        ))}

        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text style={[styles.value, { color: '#555' }]}>Sous-total</Text>
            <Text style={styles.value}>{fmt(quote.subtotalMad, 'DH')}</Text>
          </View>
          <View style={styles.totalFinalRow}>
            <Text style={styles.totalFinalText}>TOTAL ESTIMÉ</Text>
            <Text style={styles.totalFinalText}>{fmt(quote.totalMad, 'DH')}</Text>
          </View>
        </View>

        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerTitle}>Ce document n'est pas une facture</Text>
          <View style={styles.disclaimerBilingual}>
            <View style={styles.disclaimerFr}>
              <Text>
                Ce devis est une estimation, sans valeur comptable ni fiscale. Valable jusqu'au{' '}
                {quote.validUntilDate}. Une facture conforme (CGI Article 145) sera émise séparément
                après acceptation.
              </Text>
            </View>
            <View style={styles.disclaimerAr}>
              <Text>
                هذا العرض تقديري وليس له قيمة محاسبية أو ضريبية. صالح إلى غاية{' '}
                {quote.validUntilDate}. ستصدر فاتورة مطابقة (المادة 145) بشكل منفصل بعد القبول.
              </Text>
            </View>
          </View>
        </View>

        {quote.notes && (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={[styles.value, { color: '#555' }]}>{quote.notes}</Text>
          </View>
        )}

        <View style={styles.pageFooter} fixed>
          <Text style={styles.footerText}>{quote.quoteNumber}</Text>
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
