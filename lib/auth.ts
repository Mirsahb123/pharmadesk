// lib/auth.ts
import { db } from './firebase'
import { ref, get, set, push, update, remove } from "firebase/database"

export type Shop = {
  id: string
  name: string
  cnic: string
  password: string
  ownerName: string
  phone: string
  logo?: string
  theme?: string
  plan: 'trial' | 'active' | 'blocked'
  createdAt: string
  trialEndsAt: string
}

export type User = {
  cnic: string
  role: 'superadmin' | 'shop'
  shopId?: string
  name: string
  id?: string
}

export const Auth = {
  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null
    try {
      const user = localStorage.getItem('currentUser')
      return user? JSON.parse(user) : null
    } catch {
      return null
    }
  },

  setCurrentUser(user: User) {
    if (typeof window!== 'undefined') {
      try {
        localStorage.setItem('currentUser', JSON.stringify(user))
      } catch (error) {
        console.error('localStorage error:', error)
      }
    }
  },

  logout() {
    if (typeof window!== 'undefined') {
      localStorage.removeItem('currentUser')
    }
  },

  getCurrentShopId(): string | null {
    const user = this.getCurrentUser()
    if (!user) return null
    return user.role === 'superadmin'? 'superadmin' : user.shopId || user.id || null
  },

  async getAllShops(): Promise<Shop[]> {
    const snapshot = await get(ref(db, 'shops'))
    if (!snapshot.exists()) return []
    const data = snapshot.val()
    return Object.keys(data).map(key => ({ id: key,...data[key] }))
  },

  async getShopByCNIC(cnic: string): Promise<Shop | null> {
    const shops = await this.getAllShops()
    return shops.find(s => s.cnic.replace(/\D/g, '') === cnic.replace(/\D/g, '')) || null
  },

  async addShop(shop: Omit<Shop, 'id' | 'createdAt' | 'trialEndsAt'>): Promise<Shop> {
    const shops = await this.getAllShops()
    const cleanCNIC = shop.cnic.trim()

    if (shops.find(s => s.cnic.trim() === cleanCNIC)) {
      throw new Error('Ye CNIC pehle se registered hai')
    }

    const now = new Date()
    const newShopData = {
     ...shop,
      cnic: cleanCNIC,
      password: shop.password.trim(),
      createdAt: now.toISOString(),
      trialEndsAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      plan: 'trial' as const
    }

    const newShopRef = push(ref(db, 'shops'))
    await set(newShopRef, newShopData)
    return { id: newShopRef.key!,...newShopData }
  },

  async updateShop(id: string, data: Partial<Shop>) {
    await update(ref(db, `shops/${id}`), data)
  },

  async deleteShop(id: string) {
    await remove(ref(db, `shops/${id}`))
  },

  async getShopData<T>(key: string, defaultValue: T): Promise<T> {
    const user = this.getCurrentUser()
    if (!user?.shopId) return defaultValue
    const snapshot = await get(ref(db, `shops/${user.shopId}/data/${key}`))
    return snapshot.exists()? snapshot.val() : defaultValue
  },

  async setShopData(key: string, value: unknown) {
    const user = this.getCurrentUser()
    if (!user?.shopId) return
    await set(ref(db, `shops/${user.shopId}/data/${key}`), value)
  }
}
