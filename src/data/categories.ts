export type MarketplaceCategory = { id: string; name: string; icon: string; children: string[]; featured?: boolean };

export const marketplaceCategories: MarketplaceCategory[] = [
  { id: "electronics", name: "Elektronika", icon: "📱", featured: true, children: ["Smartfonlar", "Noutbuklar", "Televizorlar", "Audio", "Foto va video"] },
  { id: "home-appliances", name: "Maishiy texnika", icon: "🧺", featured: true, children: ["Oshxona texnikasi", "Changyutgichlar", "Iqlim texnikasi", "Kir yuvish mashinalari"] },
  { id: "clothing", name: "Kiyim", icon: "👕", featured: true, children: ["Ayollar kiyimi", "Erkaklar kiyimi", "Bolalar kiyimi", "Ichki kiyim"] },
  { id: "shoes", name: "Poyabzal", icon: "👟", featured: true, children: ["Krossovkalar", "Klassik poyabzal", "Bolalar poyabzali", "Uy poyabzali"] },
  { id: "beauty", name: "Go‘zallik va parvarish", icon: "✨", featured: true, children: ["Kosmetika", "Parfyumeriya", "Soch parvarishi", "Gigiyena"] },
  { id: "home", name: "Uy va bog‘", icon: "🏠", featured: true, children: ["Mebel", "Idish-tovoq", "Uy tekstili", "Asboblar", "Bog‘ uchun"] },
  { id: "children", name: "Bolalar uchun", icon: "🧸", children: ["O‘yinchoqlar", "Bolalar transporti", "Maktab bozori", "Chaqaloqlar uchun"] },
  { id: "sport", name: "Sport va hordiq", icon: "⚽", children: ["Fitness", "Turizm", "Velosipedlar", "Sport kiyimi"] },
  { id: "auto", name: "Avtotovarlar", icon: "🚗", children: ["Aksessuarlar", "Avtoelektronika", "Ehtiyot qismlar", "Moylar"] },
  { id: "food", name: "Oziq-ovqat", icon: "🛒", children: ["Ichimliklar", "Shirinliklar", "Choy va qahva", "Sog‘lom ovqat"] },
  { id: "health", name: "Salomatlik", icon: "💊", children: ["Vitaminlar", "Tibbiy texnika", "Optika", "Sport oziqasi"] },
  { id: "books", name: "Kitoblar va hobbi", icon: "📚", children: ["Kitoblar", "Kanselyariya", "Ijodkorlik", "Musiqa"] },
  { id: "pet", name: "Hayvonlar uchun", icon: "🐾", children: ["Mushuklar uchun", "Itlar uchun", "Akvarium", "Parvarish"] },
  { id: "jewelry", name: "Aksessuarlar", icon: "⌚", children: ["Soatlar", "Sumkalar", "Zargarlik", "Ko‘zoynaklar"] },
];

export const featuredCategories = marketplaceCategories.filter((category) => category.featured);
