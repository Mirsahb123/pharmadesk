import { addMedicine } from './db-firebase'

export async function import500Medicines() {
  let newId = Date.now()
  
  const medicinesData = [
    {
      "category": "Tablet",
      "items": [
        {"name": "Panadol 500mg", "price": 2, "packetQty": 10, "tabletsPerPacket": 20, "cost_price": 1.5, "expiry": "2027-12-31"},
        {"name": "Brufen 400mg", "price": 3, "packetQty": 10, "tabletsPerPacket": 20, "cost_price": 2, "expiry": "2027-12-31"},
        {"name": "Augmentin 625mg", "price": 25, "packetQty": 5, "tabletsPerPacket": 6, "cost_price": 20, "expiry": "2027-10-31"},
        {"name": "Flagyl 400mg", "price": 4, "packetQty": 10, "tabletsPerPacket": 20, "cost_price": 3, "expiry": "2027-09-30"},
        {"name": "Disprin 300mg", "price": 1, "packetQty": 50, "tabletsPerPacket": 10, "cost_price": 0.5, "expiry": "2028-01-31"},
        {"name": "Risek 40mg", "price": 15, "packetQty": 10, "tabletsPerPacket": 14, "cost_price": 12, "expiry": "2027-11-30"},
        {"name": "Ponstan 250mg", "price": 5, "packetQty": 10, "tabletsPerPacket": 20, "cost_price": 4, "expiry": "2027-08-31"},
        {"name": "Caflam 50mg", "price": 8, "packetQty": 10, "tabletsPerPacket": 20, "cost_price": 6, "expiry": "2027-07-31"},
        {"name": "Leflox 250mg", "price": 20, "packetQty": 5, "tabletsPerPacket": 10, "cost_price": 16, "expiry": "2027-06-30"},
        {"name": "Zentel 200mg", "price": 12, "packetQty": 10, "tabletsPerPacket": 2, "cost_price": 9, "expiry": "2028-02-28"}
      ]
    },
    {
      "category": "Capsule",
      "items": [
        {"name": "Amoxil 500mg", "price": 6, "packetQty": 10, "tabletsPerPacket": 10, "cost_price": 4.5, "expiry": "2027-12-31"},
        {"name": "Velosef 250mg", "price": 15, "packetQty": 5, "tabletsPerPacket": 12, "cost_price": 12, "expiry": "2027-10-31"},
        {"name": "Neogab 75mg", "price": 18, "packetQty": 10, "tabletsPerPacket": 14, "cost_price": 15, "expiry": "2027-09-30"},
        {"name": "Inderal 40mg", "price": 4, "packetQty": 10, "tabletsPerPacket": 50, "cost_price": 3, "expiry": "2028-01-31"},
        {"name": "Omeprazole 20mg", "price": 8, "packetQty": 10, "tabletsPerPacket": 14, "cost_price": 6, "expiry": "2027-11-30"}
      ]
    },
    {
      "category": "Syrup",
      "items": [
        {"name": "Calpol 120ml", "price": 120, "packetQty": 20, "tabletsPerPacket": 1, "cost_price": 95, "expiry": "2027-08-31"},
        {"name": "Brufen 100ml", "price": 110, "packetQty": 20, "tabletsPerPacket": 1, "cost_price": 85, "expiry": "2027-07-31"},
        {"name": "Arinac 120ml", "price": 95, "packetQty": 20, "tabletsPerPacket": 1, "cost_price": 75, "expiry": "2027-06-30"},
        {"name": "Hydryllin 120ml", "price": 85, "packetQty": 20, "tabletsPerPacket": 1, "cost_price": 65, "expiry": "2027-09-30"},
        {"name": "Entamizole 60ml", "price": 70, "packetQty": 30, "tabletsPerPacket": 1, "cost_price": 55, "expiry": "2027-05-31"}
      ]
    },
    {
      "category": "Injection",
      "items": [
        {"name": "Dexamethasone 2ml", "price": 25, "packetQty": 50, "tabletsPerPacket": 10, "cost_price": 18, "expiry": "2027-04-30"},
        {"name": "Diclofenac 3ml", "price": 30, "packetQty": 50, "tabletsPerPacket": 10, "cost_price": 22, "expiry": "2027-03-31"},
        {"name": "Vitamin B12 1ml", "price": 35, "packetQty": 50, "tabletsPerPacket": 10, "cost_price": 28, "expiry": "2027-02-28"},
        {"name": "Ceftriaxone 1g", "price": 180, "packetQty": 20, "tabletsPerPacket": 1, "cost_price": 150, "expiry": "2027-01-31"},
        {"name": "Metronidazole 100ml", "price": 90, "packetQty": 30, "tabletsPerPacket": 1, "cost_price": 70, "expiry": "2027-12-31"}
      ]
    }
  ]
  
  let count = 0
  
  for (const cat of medicinesData) {
    for (const item of cat.items) {
      const qrCode = `MED-${newId}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      
      await addMedicine({
        name: item.name,
        type: cat.category,
        price: item.price,
        tabletsPerPacket: item.tabletsPerPacket,
        qty: item.packetQty * item.tabletsPerPacket,
        expiry: item.expiry || '',
        qrCode: qrCode,
      })
      
      count++
      newId++
    }
  }
  
  return count
}
