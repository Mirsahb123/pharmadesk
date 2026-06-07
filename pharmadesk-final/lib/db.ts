import { get, ref, set, push, update, remove } from 'firebase/database'
import { db, Medicine } from './db-firebase'

export const getInventory = async (): Promise<Medicine[]> => {
  const snapshot = await get(ref(db, 'inventory'))
  if (!snapshot.exists()) return []
  const data = snapshot.val()
  return Object.keys(data).map(key => ({ id: key,...data[key] }))
}

export const addMedicine = async (med: Omit<Medicine, 'id'>) => {
  const newRef = push(ref(db, 'inventory'))
  await set(newRef, {...med, createdAt: Date.now() })
}

export const updateStock = async (id: string, qty: number) => {
  await update(ref(db, `inventory/${id}`), { qty })
}

export const deleteMedicine = async (id: string) => {
  await remove(ref(db, `inventory/${id}`))
}

export type { Medicine }