import { jsPDF } from 'jspdf'

/**
 * Generador PDF client-side con jsPDF.
 * Usado para informes clinicos, facturas, derivaciones, etc.
 *
 * Ejemplo:
 *   const pdf = buildClinicalReport({
 *     title: 'Informe clinico · Dra. Martinez',
 *     patient: { name: 'Carlos M.', age: 52, protocol: 'TRT' },
 *     sections: [
 *       { heading: 'Analitica 21 abril', body: 'Testosterona 9.8 pg/mL...' },
 *       { heading: 'Ajuste propuesto', body: 'Subir dosis 50mg -> 75mg.' },
 *     ],
 *   })
 *   pdf.save('informe-carlos-m.pdf')
 */
export function buildClinicalReport({ title, patient, sections = [], meta = {} } = {}) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 48
  let y = margin

  // Encabezado
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('EverHealthHormIA', margin, y)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120)
  doc.text('Ecosistema IA Adaptativa de Telemedicina Hormonal', margin, y + 14)
  doc.setTextColor(10)
  y += 40

  // Titulo informe
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(title || 'Informe clinico', margin, y)
  y += 22

  // Paciente
  if (patient) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80)
    const line = [patient.name, patient.age ? `${patient.age}a` : null, patient.protocol]
      .filter(Boolean).join('  ·  ')
    doc.text(`Paciente:  ${line}`, margin, y)
    y += 18
  }

  // Meta
  Object.entries(meta).forEach(([k, v]) => {
    doc.setTextColor(120)
    doc.text(`${k}: ${v}`, margin, y)
    y += 14
  })

  y += 8
  doc.setDrawColor(200)
  doc.line(margin, y, pageW - margin, y)
  y += 18

  // Secciones
  sections.forEach(sec => {
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(10)
    doc.text(sec.heading, margin, y)
    y += 16

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(40)
    const split = doc.splitTextToSize(sec.body || '', pageW - margin * 2)
    split.forEach(line => {
      if (y > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage()
        y = margin
      }
      doc.text(line, margin, y)
      y += 14
    })
    y += 10
  })

  // Pie
  doc.setFontSize(8)
  doc.setTextColor(150)
  doc.text(
    `Generado ${new Date().toLocaleString('es-ES')} · EverHealthHormIA`,
    margin,
    doc.internal.pageSize.getHeight() - 24
  )

  return doc
}

export { jsPDF }
