type LocationSource = readonly [region: string, districts: readonly string[]];

const source: readonly LocationSource[] = [
  ["Toshkent shahri", ["Bektemir", "Chilonzor", "Mirobod", "Mirzo Ulug‘bek", "Olmazor", "Sergeli", "Shayxontohur", "Uchtepa", "Yakkasaroy", "Yashnobod", "Yunusobod", "Yangihayot"]],
  ["Toshkent viloyati", ["Angren", "Bekobod", "Bo‘ka", "Bo‘stonliq", "Chinoz", "Ohangaron", "Oqqo‘rg‘on", "Parkent", "Piskent", "Qibray", "Quyi Chirchiq", "O‘rta Chirchiq", "Yangiyo‘l", "Yuqori Chirchiq", "Zangiota"]],
  ["Andijon viloyati", ["Andijon shahri", "Andijon", "Asaka", "Baliqchi", "Bo‘z", "Buloqboshi", "Izboskan", "Jalaquduq", "Marhamat", "Oltinko‘l", "Paxtaobod", "Qo‘rg‘ontepa", "Shahrixon", "Ulug‘nor", "Xo‘jaobod"]],
  ["Buxoro viloyati", ["Buxoro shahri", "Buxoro", "G‘ijduvon", "Jondor", "Kogon", "Olot", "Peshku", "Qorako‘l", "Qorovulbozor", "Romitan", "Shofirkon", "Vobkent"]],
  ["Farg‘ona viloyati", ["Farg‘ona shahri", "Beshariq", "Bog‘dod", "Buvayda", "Dang‘ara", "Farg‘ona", "Furqat", "Oltiariq", "Qo‘qon", "Qo‘shtepa", "Quva", "Rishton", "So‘x", "Toshloq", "Uchko‘prik", "Yozyovon"]],
  ["Jizzax viloyati", ["Jizzax shahri", "Arnasoy", "Baxmal", "Do‘stlik", "Forish", "G‘allaorol", "Mirzacho‘l", "Paxtakor", "Sharof Rashidov", "Yangiobod", "Zafarobod", "Zarbdor", "Zomin"]],
  ["Namangan viloyati", ["Namangan shahri", "Chortoq", "Chust", "Kosonsoy", "Mingbuloq", "Namangan", "Norin", "Pop", "To‘raqo‘rg‘on", "Uchqo‘rg‘on", "Uychi", "Yangiqo‘rg‘on"]],
  ["Navoiy viloyati", ["Navoiy shahri", "Karmana", "Konimex", "Navbahor", "Nurota", "Qiziltepa", "Tomdi", "Uchquduq", "Xatirchi"]],
  ["Qashqadaryo viloyati", ["Qarshi shahri", "Chiroqchi", "Dehqonobod", "G‘uzor", "Kasbi", "Kitob", "Ko‘kdala", "Koson", "Mirishkor", "Muborak", "Nishon", "Qamashi", "Qarshi", "Shahrisabz", "Yakkabog‘"]],
  ["Qoraqalpog‘iston Respublikasi", ["Nukus shahri", "Amudaryo", "Beruniy", "Bo‘zatov", "Chimboy", "Ellikqal’a", "Kegeyli", "Mo‘ynoq", "Qanliko‘l", "Qorao‘zak", "Qo‘ng‘irot", "Shumanay", "Taxtako‘pir", "Taxiatosh", "To‘rtko‘l", "Xo‘jayli"]],
  ["Samarqand viloyati", ["Samarqand shahri", "Bulung‘ur", "Ishtixon", "Jomboy", "Kattaqo‘rg‘on", "Narpay", "Nurobod", "Oqdaryo", "Paxtachi", "Payariq", "Pastdarg‘om", "Qo‘shrabot", "Samarqand", "Toyloq", "Urgut"]],
  ["Sirdaryo viloyati", ["Guliston shahri", "Boyovut", "Guliston", "Mirzaobod", "Oqoltin", "Sardoba", "Sayxunobod", "Sirdaryo", "Xovos"]],
  ["Surxondaryo viloyati", ["Termiz shahri", "Angor", "Bandixon", "Boysun", "Denov", "Jarqo‘rg‘on", "Muzrabot", "Oltinsoy", "Qiziriq", "Qumqo‘rg‘on", "Sariosiyo", "Sherobod", "Sho‘rchi", "Termiz", "Uzun"]],
  ["Xorazm viloyati", ["Urganch shahri", "Bog‘ot", "Gurlan", "Hazorasp", "Xiva", "Xonqa", "Qo‘shko‘pir", "Shovot", "Tuproqqal’a", "Urganch", "Yangiariq", "Yangibozor"]],
] as const;

let districtId = 1;
export const uzbekistanLocations = source.map(([name, districts], regionIndex) => ({
  id: String(regionIndex + 1),
  name,
  districts: districts.map((district) => ({ id: String(districtId++), name: district })),
}));
