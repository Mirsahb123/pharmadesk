"use client"

import { useState } from 'react'
import Link from 'next/link'
import QRCode from 'react-qr-code'

export default function QRGeneratorPage() {
  const [count, setCount] = useState(100)
  const [codes, setCodes] = useState<string[]>([])
  const [generated, setGenerated] = useState(false)
  const [showId, setShowId] = useState(false)
  const [qrSizeMM, setQrSizeMM] = useState(15)
  const [cols, setCols] = useState(10)
  const [gapMM, setGapMM] = useState(2)

  const generateCodes = () => {
    if(count < 1 || count > 500) return alert('1 se 500 tak QR banao')

    const newCodes = []
    for(let i = 0; i < count; i++) {
      newCodes.push(`MED_${Date.now()}_${i}`)
    }
    setCodes(newCodes)
    setGenerated(true)
  }

  const printSheet = () => {
    if(codes.length === 0) return alert('Pehle QR Generate karo')
    window.print()
  }

  const totalGap = (cols - 1) * gapMM
  const boxWidthMM = Math.floor((200 - totalGap) / cols)

  return (
    <>
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
         .qr-sheet,.qr-sheet * { visibility: visible; }
         .qr-sheet { position: absolute; left: 0; top: 0; width: 100%; }
         .no-print { display: none!important; }
         .qr-item { page-break-inside: avoid; }
          @page { size: A4; margin: 5mm; }
        }
      `}</style>

      <div className="min-h-screen bg-gray-50 p-6 no-print">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Universal QR Generator</h1>
            <Link href="/dashboard" className="text-blue-600 hover:underline font-semibold">← Dashboard</Link>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border mb-6">
            <h2 className="text-xl font-bold mb-2">Blank QR Stickers Banao</h2>
            <p className="text-gray-600 mb-4">Ye QR kisi bhi medicine pe laga do. Dotted line se kaat lena.</p>

            <div className="grid md:grid-cols-4 gap-4">
              <div className="flex gap-3 items-center">
                <label className="font-semibold">Kitne QR:</label>
                <input
                  type="number"
                  value={count}
                  onChange={e=>setCount(Number(e.target.value))}
                  min="1"
                  max="500"
                  className="border p-2 rounded w-24"
                />
              </div>

              <div className="flex gap-3 items-center">
                <label className="font-semibold">Columns:</label>
                <select
                  value={cols}
                  onChange={e=>setCols(Number(e.target.value))}
                  className="border p-2 rounded"
                >
                  <option value={5}>5 - Bade</option>
                  <option value={8}>8 - Medium</option>
                  <option value={10}>10 - Standard</option>
                  <option value={12}>12 - Chhote</option>
                </select>
              </div>

              <div className="flex gap-3 items-center">
                <label className="font-semibold">QR Size:</label>
                <input
                  type="range"
                  min="8"
                  max="18"
                  value={qrSizeMM}
                  onChange={e=>setQrSizeMM(Number(e.target.value))}
                  className="w-24"
                />
                <span className="text-sm w-12">{qrSizeMM}mm</span>
              </div>

              <div className="flex gap-3 items-center">
                <label className="font-semibold">Cutting Gap:</label>
                <input
                  type="range"
                  min="1"
                  max="4"
                  value={gapMM}
                  onChange={e=>setGapMM(Number(e.target.value))}
                  className="w-24"
                />
                <span className="text-sm w-12">{gapMM}mm</span>
              </div>
            </div>

            <div className="flex gap-3 mt-4 items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showId}
                  onChange={e=>setShowId(e.target.checked)}
                />
                <span className="text-sm">ID Text Dikhana Hai?</span>
              </label>

              <button
                onClick={generateCodes}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700"
              >
                Generate QR Codes
              </button>
              {generated && (
                <button
                  onClick={printSheet}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700"
                >
                  Print A4 Sheet
                </button>
              )}
            </div>
          </div>

          {generated && (
            <div className="bg-white p-4 rounded-xl shadow-sm border">
              <p className="text-sm text-gray-600 mb-4">
                Total: {codes.length} QR | {cols} Columns | Box: {boxWidthMM}mm | QR: {qrSizeMM}mm | Gap: {gapMM}mm
              </p>
              <div
                className="grid"
                style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: `${gapMM}px` }}
              >
                {codes.slice(0, cols * 2).map((code, idx) => (
                  <div key={idx} className="border border-dashed border-gray-400 bg-white flex flex-col items-center justify-center p-1" style={{ aspectRatio: '1' }}>
                    <div style={{ width: `${qrSizeMM * 3}px`, height: `${qrSizeMM * 3}px` }}>
                      <QRCode
                        value={code}
                        size={qrSizeMM * 3}
                        style={{ width: "100%", height: "100%" }}
                      />
                    </div>
                    {showId && <p className="text-[6px] leading-none mt-0.5 font-mono">{code.slice(-6)}</p>}
                  </div>
                ))}
                {codes.length > cols * 2 && (
                  <div className="col-span-full text-center text-gray-500 text-sm py-4">
                 ... aur {codes.length - cols * 2} QR. Print karo sab aa jayenge
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {generated && (
        <div className="qr-sheet hidden print:block">
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: `${gapMM}mm`,
            padding: '0'
          }}>
            {codes.map((code, idx) => (
              <div key={idx} className="qr-item" style={{
                width: `${boxWidthMM}mm`,
                height: `${boxWidthMM}mm`,
                border: '0.3mm dashed #999',
                padding: '1mm',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#fff',
                boxSizing: 'border-box'
              }}>
                <QRCode
                  value={code}
                  size={qrSizeMM * 3.78}
                  style={{ width: `${qrSizeMM}mm`, height: `${qrSizeMM}mm` }}
                />
                {showId && (
                  <p style={{
                    fontSize: '2.5pt',
                    fontFamily: 'monospace',
                    margin: '0.3mm 0 0 0',
                    lineHeight: '1'
                  }}>
                    {code.slice(-6)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
