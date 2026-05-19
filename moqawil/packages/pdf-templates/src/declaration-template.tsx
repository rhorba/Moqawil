/**
 * Quarterly declaration PDF template — modelled on Barid Al-Maghrib form.
 * Pre-filled with AE data so the user just signs and submits at the bank.
 * Bilingual FR (primary) + AR (mandatory legal text).
 */

import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#1a1a1a',
    paddingTop: 30,
    paddingBottom: 50,
    paddingHorizontal: 35,
    lineHeight: 1.4,
  },
  // Page header — bilingual title
  headerBox: {
    border: '1.5px solid #1a6e7e',
    borderRadius: 4,
    padding: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerFr: { flex: 1 },
  headerAr: { flex: 1, alignItems: 'flex-end' },
  title: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#1a6e7e',
  },
  subtitle: { fontSize: 8, color: '#555', marginTop: 2 },
  // Section blocks
  sectionLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#1a6e7e',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1a6e7e',
    paddingBottom: 3,
    marginBottom: 6,
    marginTop: 10,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  fieldLabel: { width: 140, fontSize: 8, color: '#555' },
  fieldValue: {
    flex: 1,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    borderBottomWidth: 0.5,
    borderBottomColor: '#aaa',
    paddingBottom: 1,
  },
  // Declaration amounts table
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e8f0f2',
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginTop: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd',
  },
  col1: { flex: 3, fontSize: 8 },
  col2: { flex: 1, textAlign: 'right', fontSize: 8 },
  headerText: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#444' },
  // Total box
  totalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#1a6e7e',
    marginTop: 8,
    borderRadius: 3,
  },
  totalLabel: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#1a6e7e' },
  totalValue: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#1a6e7e' },
  // Signature zone
  signatureZone: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 20,
  },
  signatureBox: {
    flex: 1,
    border: '0.5px solid #aaa',
    borderRadius: 3,
    padding: 8,
    minHeight: 70,
  },
  signatureLabel: {
    fontSize: 7,
    color: '#888',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Legal footer
  legalBox: {
    position: 'absolute',
    bottom: 30,
    left: 35,
    right: 35,
    borderTopWidth: 0.5,
    borderTopColor: '#ccc',
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legalText: { fontSize: 6.5, color: '#888' },
})

function fmt(n: number) {
  return new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

const quarterLabels: Record<number, { fr: string; ar: string; period: string }> = {
  1: { fr: '1er Trimestre', ar: 'الربع الأول', period: 'Janvier – Mars' },
  2: { fr: '2ème Trimestre', ar: 'الربع الثاني', period: 'Avril – Juin' },
  3: { fr: '3ème Trimestre', ar: 'الربع الثالث', period: 'Juillet – Septembre' },
  4: { fr: '4ème Trimestre', ar: 'الربع الرابع', period: 'Octobre – Décembre' },
}

const activityLabels: Record<string, string> = {
  commercial: 'Commercial (achat/revente)',
  industrial: 'Industriel (fabrication)',
  artisanal: 'Artisanal',
  service: 'Services',
}

export interface DeclarationPdfProps {
  declaration: {
    year: number
    quarter: number
    totalTurnoverMad: number
    taxRate: number
    taxDueMad: number
    status: string
    submittedAt?: Date | null
  }
  entrepreneur: {
    fullName: string
    ice: string
    ifNumber: string
    address: string
    city: string
    phone?: string | null
    activityType: string
    invoicePrefix: string
    registrationDate: string
  }
}

export function DeclarationDocument({ declaration, entrepreneur }: DeclarationPdfProps) {
  const ql = quarterLabels[declaration.quarter]
  const taxRatePct =
    entrepreneur.activityType === 'service' ? '1,0 %' : '0,5 %'

  return (
    <Document
      title={`Déclaration ${ql.fr} ${declaration.year}`}
      author={entrepreneur.fullName}
      subject="Déclaration de chiffre d'affaires — Auto-entrepreneur Maroc"
    >
      <Page size="A4" style={styles.page}>
        {/* Bilingual header */}
        <View style={styles.headerBox}>
          <View style={styles.headerFr}>
            <Text style={styles.title}>DÉCLARATION DE CHIFFRE D&apos;AFFAIRES</Text>
            <Text style={styles.subtitle}>Régime Auto-Entrepreneur — Loi 114-13</Text>
            <Text style={styles.subtitle}>
              {ql.fr} {declaration.year} ({ql.period})
            </Text>
          </View>
          <View style={styles.headerAr}>
            <Text style={[styles.title, { textAlign: 'right' }]}>تصريح برقم الأعمال</Text>
            <Text style={[styles.subtitle, { textAlign: 'right' }]}>نظام المقاول الذاتي — القانون 114-13</Text>
            <Text style={[styles.subtitle, { textAlign: 'right' }]}>
              {ql.ar} {declaration.year}
            </Text>
          </View>
        </View>

        {/* Identity section */}
        <Text style={styles.sectionLabel}>Identité du déclarant / هوية المصرح</Text>
        <View style={styles.row}>
          <Text style={styles.fieldLabel}>Nom complet :</Text>
          <Text style={styles.fieldValue}>{entrepreneur.fullName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.fieldLabel}>ICE :</Text>
          <Text style={styles.fieldValue}>{entrepreneur.ice}</Text>
          <Text style={[styles.fieldLabel, { marginLeft: 16 }]}>IF :</Text>
          <Text style={styles.fieldValue}>{entrepreneur.ifNumber}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.fieldLabel}>Adresse :</Text>
          <Text style={styles.fieldValue}>{entrepreneur.address}, {entrepreneur.city}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.fieldLabel}>Téléphone :</Text>
          <Text style={styles.fieldValue}>{entrepreneur.phone ?? '—'}</Text>
          <Text style={[styles.fieldLabel, { marginLeft: 16 }]}>Date immatriculation :</Text>
          <Text style={styles.fieldValue}>{entrepreneur.registrationDate}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.fieldLabel}>Activité :</Text>
          <Text style={styles.fieldValue}>{activityLabels[entrepreneur.activityType] ?? entrepreneur.activityType}</Text>
        </View>

        {/* Declaration period */}
        <Text style={styles.sectionLabel}>Période de déclaration / فترة التصريح</Text>
        <View style={styles.row}>
          <Text style={styles.fieldLabel}>Exercice fiscal :</Text>
          <Text style={styles.fieldValue}>{declaration.year}</Text>
          <Text style={[styles.fieldLabel, { marginLeft: 16 }]}>Trimestre :</Text>
          <Text style={styles.fieldValue}>{ql.fr} ({ql.period})</Text>
        </View>

        {/* CA breakdown */}
        <Text style={styles.sectionLabel}>Chiffre d&apos;affaires déclaré / رقم الأعمال المصرح به</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerText, styles.col1]}>Désignation</Text>
          <Text style={[styles.headerText, styles.col2]}>Montant (MAD)</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.col1}>
            Chiffre d&apos;affaires trimestriel ({ql.fr} {declaration.year})
          </Text>
          <Text style={styles.col2}>{fmt(declaration.totalTurnoverMad)}</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.col1}>
            Taux libératoire applicable ({activityLabels[entrepreneur.activityType]} — {taxRatePct})
          </Text>
          <Text style={styles.col2}>{taxRatePct}</Text>
        </View>

        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>IMPÔT DÛ (Cotisation libératoire)</Text>
          <Text style={styles.totalValue}>{fmt(declaration.taxDueMad)} DH</Text>
        </View>

        {declaration.totalTurnoverMad === 0 && (
          <View style={{ marginTop: 8, padding: 6, backgroundColor: '#fff9e6', borderRadius: 3 }}>
            <Text style={{ fontSize: 8, color: '#7d5a00' }}>
              DÉCLARATION NÉANTE — Chiffre d&apos;affaires nul pour la période. La déclaration reste
              obligatoire (Article 7 de la Loi 114-13). Deux déclarations nulles consécutives
              (à partir de l&apos;an 2) entraînent la radiation du registre RNAE.
            </Text>
          </View>
        )}

        {/* Signature zone */}
        <View style={styles.signatureZone}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Cachet et signature du déclarant</Text>
            <Text style={{ fontSize: 7, color: '#aaa' }}>Nom :</Text>
            <Text style={{ fontSize: 7, color: '#aaa', marginTop: 16 }}>Date :</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Cachet et signature de la banque (Al Barid Bank)</Text>
            <Text style={{ fontSize: 7, color: '#aaa' }}>Date de réception :</Text>
            <Text style={{ fontSize: 7, color: '#aaa', marginTop: 16 }}>Référence paiement :</Text>
          </View>
        </View>

        {/* Legal footer */}
        <View style={styles.legalBox} fixed>
          <Text style={styles.legalText}>
            Régime Auto-Entrepreneur — Loi 114-13 · À déposer à Al Barid Bank, Attijariwafa, BMCE ou tout établissement agréé
          </Text>
          <Text style={styles.legalText}>
            نظام المقاول الذاتي — القانون 114-13 · للإيداع لدى بريد بنك أو أي مؤسسة معتمدة
          </Text>
        </View>
      </Page>
    </Document>
  )
}
