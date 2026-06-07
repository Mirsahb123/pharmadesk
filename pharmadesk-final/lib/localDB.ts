export type MenuItem = {
  id: string;
  name: string;
  description?: string;
  image?: string;
  imageUrl?: string;
  images?: string[];
  category: string;
  price?: number;
  weightOptions?: { weight: string; price: number }[];
  temp?: 'hot' | 'cold' | null;
  discount?: {
    type: "percentage" | "fixed";
    value: number;
    isActive: boolean;
  };
  isAvailable: boolean;
  averageRating: number;
  totalRatings: number;
};

export type CartItem = {
  menuItem: MenuItem;
  selectedWeight: { weight: string; price: number };
  quantity: number;
};

export type PaymentMethod =
  | 'jazzcash'
  | 'easypaisa'
  | 'hbl'
  | 'ubl'
  | 'meezan'
  | 'faisal'
  | 'abl'
  | 'alhabib'
  | 'alfalah'
  | 'other_bank';

export type Order = {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: 'payment_verification' | 'preparing' | 'on_way' | 'delivered' | 'cancelled';
  paymentMethod: PaymentMethod;
  paymentScreenshot: string;
  paymentAmount: number;
  transactionId?: string;
  createdAt: string;
  verifiedAt?: string;
};

export type BankAccount = {
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban?: string;
  isActive: boolean;
};

export type RestaurantSettings = {
  restaurantName: string;
  restaurantLocation: { lat: number; lng: number };
  jazzCash: { number: string; title: string; isActive: boolean };
  easyPaisa: { number: string; title: string; isActive: boolean };
  banks: Record<string, BankAccount>;
  deliveryFee: number;
  freeDeliveryAbove: number;
};

const STORAGE_KEYS = {
  MENU_ITEMS: "darbar_menu_items",
  ORDERS: "darbar_orders",
  SETTINGS: "darbar_settings",
};

// DEFAULT DATA - YEH AUTO LOAD HO JAYEGA AGAR KHALI HUA
const DEFAULT_SETTINGS: RestaurantSettings = {
  restaurantName: "Darbar Restaurant",
  restaurantLocation: { lat: 31.5204, lng: 74.3587 }, // Lahore
  jazzCash: { number: "03114909295", title: "Darbar Restaurant", isActive: true },
  easyPaisa: { number: "03457654321", title: "Darbar Restaurant", isActive: true },
  banks: {
    hbl: { bankName: "HBL", accountTitle: "Darbar Restaurant", accountNumber: "12345678901", iban: "PK36HABB0000001234567890", isActive: true },
    ubl: { bankName: "UBL", accountTitle: "Darbar Restaurant", accountNumber: "23456789012", iban: "PK36UNIL0000002345678901", isActive: true },
    meezan: { bankName: "Meezan Bank", accountTitle: "Darbar Restaurant", accountNumber: "34567890123", iban: "PK36MEZN0000003456789012", isActive: true },
    faisal: { bankName: "Faysal Bank", accountTitle: "Darbar Restaurant", accountNumber: "45678901234", iban: "PK36FAYS0000004567890123", isActive: true },
    abl: { bankName: "Allied Bank", accountTitle: "Darbar Restaurant", accountNumber: "56789012345", iban: "PK36ABPA0000005678901234", isActive: true },
    alhabib: { bankName: "Bank Al Habib", accountTitle: "Darbar Restaurant", accountNumber: "67890123456", iban: "PK36BAHL0000006789012345", isActive: true },
    alfalah: { bankName: "Bank Alfalah", accountTitle: "Darbar Restaurant", accountNumber: "78901234567", iban: "PK36ALFH0000007890123456", isActive: true },
  },
  deliveryFee: 100,
  freeDeliveryAbove: 2000
};

const DEFAULT_MENU: MenuItem[] = [
  {
    id: "1",
    name: "Chicken Biryani",
    description: "Special Darbar Biryani with raita",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8",
    category: "Biryani & Rice",
    price: 450,
    weightOptions: [
      { weight: "Half", price: 450 },
      { weight: "Full", price: 850 }
    ],
    temp: 'hot',
    isAvailable: true,
    averageRating: 4.5,
    totalRatings: 120
  },
  {
    id: "2",
    name: "Zinger Burger",
    description: "Crispy chicken burger with fries",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
    category: "Snacks & Burgers",
    price: 350,
    weightOptions: [{ weight: "Regular", price: 350 }],
    temp: 'hot',
    isAvailable: true,
    averageRating: 4.2,
    totalRatings: 85
  },
  {
    id: "3",
    name: "Halwa Puri",
    description: "Sunday special breakfast - 2 puri with halwa",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950",
    category: "Breakfast",
    price: 200,
    weightOptions: [{ weight: "2 Puri", price: 200 }],
    temp: 'hot',
    isAvailable: true,
    averageRating: 4.8,
    totalRatings: 200
  },
  {
    id: "4",
    name: "Chicken Karahi",
    description: "Spicy desi chicken karahi",
    image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398",
    category: "Curries/Gravy",
    price: 1200,
    weightOptions: [
      { weight: "Half Kg", price: 1200 },
      { weight: "1 Kg", price: 2200 }
    ],
    temp: 'hot',
    isAvailable: true,
    averageRating: 4.6,
    totalRatings: 150
  },
  {
    id: "5",
    name: "Malai Boti",
    description: "Creamy chicken tikka",
    image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0",
    category: "Tandoori & BBQ",
    price: 600,
    weightOptions: [{ weight: "8 Pcs", price: 600 }],
    temp: 'hot',
    isAvailable: true,
    averageRating: 4.7,
    totalRatings: 95
  },
  {
    id: "6",
    name: "Cold Drink",
    description: "1.5 Liter bottle",
    image: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3",
    category: "Drinks & Desserts",
    price: 150,
    weightOptions: [{ weight: "1.5L", price: 150 }],
    temp: 'cold',
    isAvailable: true,
    averageRating: 4.0,
    totalRatings: 300
  }
];

export const localDB = {
  STORAGE_KEYS,

  // AUTO INITIALIZE - Pehli bar khali ho to default dal do
  init() {
    if (typeof window === "undefined") return;

    // Settings check
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    }

    // Menu check
    if (!localStorage.getItem(STORAGE_KEYS.MENU_ITEMS)) {
      localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(DEFAULT_MENU));
    }

    // Orders check
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
    }
  },

  getItems(): MenuItem[] {
    if (typeof window === "undefined") return [];
    this.init(); // Har bar check karo
    const data = localStorage.getItem(STORAGE_KEYS.MENU_ITEMS);
    return data? JSON.parse(data) : DEFAULT_MENU;
  },

  saveItem(item: Omit<MenuItem, "id" | "averageRating" | "totalRatings">) {
    const items = this.getItems();
    const newItem: MenuItem = {
     ...item,
      id: Date.now().toString(),
      averageRating: 0,
      totalRatings: 0,
      isAvailable: item.isAvailable!== false,
      price: item.price || item.weightOptions?.[0]?.price || 0,
    };
    items.push(newItem);
    localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(items));
    return newItem;
  },

  updateItem(id: string, updates: Partial<MenuItem>) {
    const items = this.getItems();
    const index = items.findIndex((i) => i.id === id);
    if (index!== -1) {
      items[index] = {...items[index],...updates };
      localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(items));
    }
  },

  deleteItem(id: string) {
    const items = this.getItems().filter((i) => i.id!== id);
    localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(items));
  },

  getOrders(): Order[] {
    if (typeof window === "undefined") return [];
    this.init();
    const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return data? JSON.parse(data) : [];
  },

  saveOrder(order: Omit<Order, "id" | "createdAt" | "status">) {
    const orders = this.getOrders();
    const newOrder: Order = {
     ...order,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      status: 'payment_verification',
    };
    orders.push(newOrder);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    return newOrder;
  },

  updateOrderStatus(id: string, status: Order['status']) {
    const orders = this.getOrders();
    const updated = orders.map((o) =>
      o.id === id? {...o, status, verifiedAt: status === 'preparing'? new Date().toISOString() : o.verifiedAt } : o
    );
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
  },

  getSettings(): RestaurantSettings {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    this.init(); // Auto initialize
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data? JSON.parse(data) : DEFAULT_SETTINGS;
  },

  saveSettings(settings: RestaurantSettings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  // RESET BUTTON KE LIYE
  resetToDefaults() {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(DEFAULT_MENU));
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
  }
};