export const CAPACITY = 10;
export const WORLD = { width: 1000, height: 660, left: 8, right: 712, top: 8, bottom: 552 };
export const STATIONS = [{ x: 220, y: 400 }, { x: 420, y: 400 }, { x: 620, y: 400 }];
export const GAMES = {
  kitchen: { name: 'ครัวอุ่นใจ', english: 'Little Kitchen', icon: '🍳', steps: ['หยิบวัตถุดิบ', 'ปรุงอาหาร', 'เสิร์ฟอาหาร'], items: ['🥕', '🍲', '🍽️'], duration: 120, description: 'รับวัตถุดิบ ปรุง แล้วเสิร์ฟให้ทันเวลา' },
  makeover: { name: 'บ้านน่าอยู่', english: 'Room for Two', icon: '🪴', steps: ['หยิบอุปกรณ์', 'ประกอบของแต่ง', 'จัดเข้ามุม'], items: ['🧰', '🪑', '🪴'], duration: 120, description: 'หยิบเครื่องมือ ช่วยกันประกอบและจัดห้อง' },
};
export const LOOKS = [
 { name: 'วันอุ่น ๆ', detail: 'ผมลอนน้ำตาล · คาร์ดิแกนครีม', color: '#d99579' },
 { name: 'เพื่อนข้างบ้าน', detail: 'ผมสั้นน้ำตาล · ชุดเอิร์ธโทน', color: '#b99b77' },
 { name: 'สวนเล็ก ๆ', detail: 'ผมบ๊อบชมพู · คาร์ดิแกนเซจ', color: '#8eaa88' },
 { name: 'ท้องฟ้าวันหยุด', detail: 'ผมบลอนด์ · คาร์ดิแกนฟ้า', color: '#8da5c1' },
];

