// lib/db.ts
// Backward compatibility layer - sab functions db-firebase.ts se re-export kar rahe

import { 
  getInventory, 
  saveMedicine, 
  updateMedicine, 
  deleteMedicine, 
  Medicine 
} from './db-firebase'

// Re-export with same names jo purane code me use ho rahe the
export { getInventory }

export const addMedicine = async (med: Omit<Medicine, 'id'>) => {
  return saveMedicine(med)
}

export const updateStock = async (id: string, qty: number) => {
  return updateMedicine(id, { qty })
}

export { deleteMedicine }

// Type bhi re-export kar de
export type { Medicine }
