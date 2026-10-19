/** Appearance data is persisted independently from live gameplay state. */
export const BASE_TYPES = [
  { id: 'male', name: 'ชาย', icon: '♂' },
  { id: 'female', name: 'หญิง', icon: '♀' },
];

export const HAIR_STYLES = [
  { id: 'short', name: 'ทรงสั้น', icon: '✂' },
  { id: 'long', name: 'ผมยาว', icon: '〰' },
  { id: 'spiky', name: 'ผมตั้ง', icon: '✦' },
  { id: 'bob', name: 'บ๊อบ', icon: '◡' },
];

export const HAIR_COLORS = [
  { id: 'black', name: 'ดำ', hex: '#332820' },
  { id: 'brown', name: 'น้ำตาล', hex: '#85563f' },
  { id: 'blonde', name: 'บลอนด์', hex: '#e9bd68' },
  { id: 'red', name: 'แดง', hex: '#b95f54' },
  { id: 'blue', name: 'น้ำเงิน', hex: '#6788ac' },
  { id: 'pink', name: 'ชมพู', hex: '#d889a5' },
  { id: 'white', name: 'เงิน', hex: '#ded6d2' },
  { id: 'green', name: 'เขียว', hex: '#719278' },
];

export const EYE_STYLES = [
  { id: 'round', name: 'กลมใส', icon: '●' },
  { id: 'soft', name: 'ละมุน', icon: '◉' },
  { id: 'sparkle', name: 'วิ้ง ๆ', icon: '✧' },
];

export const EYE_COLORS = [
  { id: 'brown', name: 'น้ำตาล', hex: '#68432f' },
  { id: 'black', name: 'ดำ', hex: '#28262d' },
  { id: 'blue', name: 'ฟ้า', hex: '#6593bd' },
  { id: 'green', name: 'เขียว', hex: '#668966' },
  { id: 'violet', name: 'ม่วง', hex: '#9271aa' },
];

export const SKIN_TONES = [
  { id: 'light', name: 'ขาวนวล', hex: '#f6d7bd' },
  { id: 'medium-light', name: 'เบจ', hex: '#e9bd9e' },
  { id: 'medium', name: 'แทน', hex: '#cf9871' },
  { id: 'medium-dark', name: 'น้ำผึ้ง', hex: '#b77b56' },
  { id: 'dark', name: 'เข้ม', hex: '#85563f' },
];

export const SHIRTS = [
  { id: 'tee', name: 'เสื้อยืด', icon: 'T' },
  { id: 'shirt', name: 'เชิ้ต', icon: '▤' },
  { id: 'hoodie', name: 'ฮู้ดดี้', icon: '⌂' },
  { id: 'cardigan', name: 'คาร์ดิแกน', icon: '▥' },
];

export const SHIRT_COLORS = [
  { id: 'sage', name: 'เขียวเซจ', hex: '#829b7d' },
  { id: 'coral', name: 'คอรัล', hex: '#d99079' },
  { id: 'lavender', name: 'ลาเวนเดอร์', hex: '#9b8baa' },
  { id: 'blue', name: 'ฟ้า', hex: '#7595af' },
  { id: 'cream', name: 'ครีม', hex: '#efe1c8' },
  { id: 'navy', name: 'กรมท่า', hex: '#4f6279' },
  { id: 'yellow', name: 'เหลือง', hex: '#dfbc6d' },
  { id: 'rose', name: 'ชมพู', hex: '#d18e9c' },
];

export const PANTS = [
  { id: 'trousers', name: 'ขายาว', icon: '▥' },
  { id: 'jeans', name: 'ยีนส์', icon: '▤' },
  { id: 'shorts', name: 'ขาสั้น', icon: '▱' },
  { id: 'overalls', name: 'เอี๊ยม', icon: '♧' },
];

export const PANTS_COLORS = [
  { id: 'charcoal', name: 'เทาเข้ม', hex: '#5c5b60' },
  { id: 'denim', name: 'ยีนส์', hex: '#6e8ca3' },
  { id: 'brown', name: 'น้ำตาล', hex: '#927258' },
  { id: 'cream', name: 'ครีม', hex: '#d9c9ac' },
  { id: 'olive', name: 'เขียวมะกอก', hex: '#82856c' },
  { id: 'plum', name: 'พลัม', hex: '#7c6677' },
];

export const SHOES = [
  { id: 'sneakers', name: 'สนีกเกอร์', icon: '◒' },
  { id: 'boots', name: 'บูท', icon: '▰' },
  { id: 'loafers', name: 'โลฟเฟอร์', icon: '◓' },
  { id: 'slippers', name: 'รองเท้าแตะ', icon: '⌁' },
];

export const SHOE_COLORS = [
  { id: 'cream', name: 'ครีม', hex: '#e8ddca' },
  { id: 'brown', name: 'น้ำตาล', hex: '#76543d' },
  { id: 'rose', name: 'ชมพู', hex: '#d28791' },
  { id: 'blue', name: 'ฟ้า', hex: '#7193ae' },
  { id: 'black', name: 'ดำ', hex: '#3c3a3b' },
];

export const ACCESSORIES = [
  { id: 'none', name: 'ไม่ใส่', icon: '—', offset: { x: 0, y: 0 } },
  { id: 'glasses', name: 'แว่นตา', icon: '◉', offset: { x: 0, y: 0 } },
  { id: 'headphones', name: 'หูฟัง', icon: '♫', offset: { x: 0, y: 0 } },
  { id: 'hat', name: 'หมวก', icon: '⌒', offset: { x: 0, y: -10 } },
  { id: 'bow', name: 'โบว์', icon: '✿', offset: { x: 0, y: -14 } },
  { id: 'flower', name: 'ดอกไม้', icon: '❀', offset: { x: 0, y: -14 } },
];

const DEFAULTS = {
  male: {
    displayName: '', baseType: 'male', skinTone: 'light', hairStyle: 'short', hairColor: 'brown',
    eyeStyle: 'round', eyeColor: 'brown', shirt: 'cardigan', shirtColor: 'sage',
    pants: 'trousers', pantsColor: 'charcoal', shoes: 'sneakers', shoeColor: 'cream', accessory: 'none',
  },
  female: {
    displayName: '', baseType: 'female', skinTone: 'light', hairStyle: 'long', hairColor: 'brown',
    eyeStyle: 'sparkle', eyeColor: 'brown', shirt: 'cardigan', shirtColor: 'coral',
    pants: 'trousers', pantsColor: 'charcoal', shoes: 'sneakers', shoeColor: 'cream', accessory: 'flower',
  },
};

function firstId(options, fallback) {
  return options.some((option) => option.id === fallback) ? fallback : options[0].id;
}

export class CharacterAppearance {
  constructor(data = {}) {
    const baseType = data.baseType === 'female' ? 'female' : 'male';
    const defaults = DEFAULTS[baseType];

    this.displayName = String(data.displayName ?? defaults.displayName).slice(0, 20);
    this.baseType = baseType;
    this.skinTone = data.skinTone ?? defaults.skinTone;
    this.hairStyle = data.hairStyle ?? defaults.hairStyle;
    this.hairColor = data.hairColor ?? defaults.hairColor;
    this.eyeStyle = data.eyeStyle ?? defaults.eyeStyle;
    this.eyeColor = data.eyeColor ?? defaults.eyeColor;
    // Read older prototype exports without losing their chosen shirt style/color.
    this.shirt = data.shirt ?? data.outfit ?? defaults.shirt;
    this.shirtColor = data.shirtColor ?? data.outfitColor ?? defaults.shirtColor;
    this.pants = data.pants ?? defaults.pants;
    this.pantsColor = data.pantsColor ?? defaults.pantsColor;
    this.shoes = data.shoes ?? defaults.shoes;
    this.shoeColor = data.shoeColor ?? defaults.shoeColor;
    this.accessory = data.accessory ?? defaults.accessory;
  }

  clone() { return new CharacterAppearance(this.toJSON()); }

  toJSON() {
    return {
      displayName: this.displayName,
      baseType: this.baseType,
      skinTone: this.skinTone,
      hairStyle: this.hairStyle,
      hairColor: this.hairColor,
      eyeStyle: this.eyeStyle,
      eyeColor: this.eyeColor,
      shirt: this.shirt,
      shirtColor: this.shirtColor,
      pants: this.pants,
      pantsColor: this.pantsColor,
      shoes: this.shoes,
      shoeColor: this.shoeColor,
      accessory: this.accessory,
    };
  }

  static fromJSON(data) { return new CharacterAppearance(data); }

  getHairStyle() { return HAIR_STYLES.find((item) => item.id === this.hairStyle) ?? HAIR_STYLES[0]; }
  getHairColor() { return HAIR_COLORS.find((item) => item.id === this.hairColor) ?? HAIR_COLORS[0]; }
  getSkinTone() { return SKIN_TONES.find((item) => item.id === this.skinTone) ?? SKIN_TONES[0]; }
  getEyeColor() { return EYE_COLORS.find((item) => item.id === this.eyeColor) ?? EYE_COLORS[0]; }
  getShirt() { return SHIRTS.find((item) => item.id === this.shirt) ?? SHIRTS[0]; }
  getShirtColor() { return SHIRT_COLORS.find((item) => item.id === this.shirtColor) ?? SHIRT_COLORS[0]; }
  getPants() { return PANTS.find((item) => item.id === this.pants) ?? PANTS[0]; }
  getPantsColor() { return PANTS_COLORS.find((item) => item.id === this.pantsColor) ?? PANTS_COLORS[0]; }
  getShoes() { return SHOES.find((item) => item.id === this.shoes) ?? SHOES[0]; }
  getShoeColor() { return SHOE_COLORS.find((item) => item.id === this.shoeColor) ?? SHOE_COLORS[0]; }
  getAccessory() { return ACCESSORIES.find((item) => item.id === this.accessory) ?? ACCESSORIES[0]; }

  validate() {
    this.baseType = firstId(BASE_TYPES, this.baseType);
    this.skinTone = firstId(SKIN_TONES, this.skinTone);
    this.hairStyle = firstId(HAIR_STYLES, this.hairStyle);
    this.hairColor = firstId(HAIR_COLORS, this.hairColor);
    this.eyeStyle = firstId(EYE_STYLES, this.eyeStyle);
    this.eyeColor = firstId(EYE_COLORS, this.eyeColor);
    this.shirt = firstId(SHIRTS, this.shirt);
    this.shirtColor = firstId(SHIRT_COLORS, this.shirtColor);
    this.pants = firstId(PANTS, this.pants);
    this.pantsColor = firstId(PANTS_COLORS, this.pantsColor);
    this.shoes = firstId(SHOES, this.shoes);
    this.shoeColor = firstId(SHOE_COLORS, this.shoeColor);
    this.accessory = firstId(ACCESSORIES, this.accessory);
    this.displayName = String(this.displayName ?? '').slice(0, 20);
    return this;
  }
}

export const DEFAULT_APPEARANCE = new CharacterAppearance(DEFAULTS.male);
