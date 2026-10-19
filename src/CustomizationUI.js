import {
  ACCESSORIES, BASE_TYPES, CharacterAppearance, EYE_COLORS, EYE_STYLES,
  HAIR_COLORS, HAIR_STYLES, PANTS, PANTS_COLORS, SHIRT_COLORS, SHIRTS,
  SHOE_COLORS, SHOES, SKIN_TONES,
} from './CharacterAppearance.js';

const CATEGORIES = [
  { id: 'hair', label: 'ผม', icon: '〰', fields: [
    { label: 'ทรงผม', key: 'hairStyle', options: HAIR_STYLES },
    { label: 'สีผม', key: 'hairColor', options: HAIR_COLORS, color: true },
  ] },
  { id: 'eyes', label: 'ดวงตา', icon: '◉', fields: [
    { label: 'รูปตา', key: 'eyeStyle', options: EYE_STYLES },
    { label: 'สีตา', key: 'eyeColor', options: EYE_COLORS, color: true },
  ] },
  { id: 'skin', label: 'สีผิว', icon: '☼', fields: [
    { label: 'โทนสีผิว', key: 'skinTone', options: SKIN_TONES, color: true },
  ] },
  { id: 'shirt', label: 'เสื้อ', icon: '♧', fields: [
    { label: 'แบบเสื้อ', key: 'shirt', options: SHIRTS },
    { label: 'สีเสื้อ', key: 'shirtColor', options: SHIRT_COLORS, color: true },
  ] },
  { id: 'pants', label: 'กางเกง', icon: '▥', fields: [
    { label: 'แบบกางเกง', key: 'pants', options: PANTS },
    { label: 'สีกางเกง', key: 'pantsColor', options: PANTS_COLORS, color: true },
  ] },
  { id: 'shoes', label: 'รองเท้า', icon: '◒', fields: [
    { label: 'แบบรองเท้า', key: 'shoes', options: SHOES },
    { label: 'สีรองเท้า', key: 'shoeColor', options: SHOE_COLORS, color: true },
  ] },
  { id: 'accessory', label: 'อุปกรณ์เสริม', icon: '✿', fields: [
    { label: 'เลือกอุปกรณ์เสริม', key: 'accessory', options: ACCESSORIES },
  ] },
];

const STORAGE_KEY = 'cozy-social-character-v1';

export class CustomizationUI {
  constructor(gameScene) {
    this.scene = gameScene;
    this.activeCategory = 'hair';
    this.currentAppearance = this.loadAppearance() ?? gameScene.getAppearance().clone();
    this.scene.setAppearance(this.currentAppearance);
    this.bindEvents();
    this.renderBaseTypes();
    this.renderTabs();
    this.renderCategory();
    this.syncIdentity();
  }

  loadAppearance() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? CharacterAppearance.fromJSON(JSON.parse(saved)).validate() : null;
    } catch {
      return null;
    }
  }

  bindEvents() {
    document.querySelector('.help-button').addEventListener('click', () => {
      this.showToast('ใช้ WASD หรือปุ่มลูกศรเพื่อขยับตัวอย่างตัวละคร');
    });
    document.querySelector('#display-name').addEventListener('input', (event) => {
      this.currentAppearance.displayName = event.target.value.slice(0, 20);
      this.emitChange();
    });

    document.querySelector('#randomize-btn').addEventListener('click', () => this.randomize());
    document.querySelector('#reset-btn').addEventListener('click', () => this.reset());
    document.querySelector('#save-btn').addEventListener('click', () => this.save());
  }

  renderBaseTypes() {
    const container = document.querySelector('#base-type-options');
    container.replaceChildren();
    BASE_TYPES.forEach((type) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'base-type-option';
      button.dataset.value = type.id;
      button.setAttribute('aria-pressed', String(this.currentAppearance.baseType === type.id));
      button.innerHTML = `<span class="base-type-icon" aria-hidden="true">${type.icon}</span><span>${type.name}</span>`;
      button.addEventListener('click', () => {
        this.currentAppearance.baseType = type.id;
        this.syncIdentity();
        this.emitChange();
      });
      container.append(button);
    });
  }

  renderTabs() {
    const container = document.querySelector('#customization-tabs');
    container.replaceChildren();
    CATEGORIES.forEach((category) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'category-tab';
      button.id = `tab-${category.id}`;
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-selected', String(this.activeCategory === category.id));
      button.setAttribute('aria-controls', 'customization-options');
      button.innerHTML = `<span aria-hidden="true">${category.icon}</span><span>${category.label}</span>`;
      button.addEventListener('click', () => {
        this.activeCategory = category.id;
        this.renderTabs();
        this.renderCategory();
      });
      container.append(button);
    });
  }

  renderCategory() {
    const category = CATEGORIES.find((item) => item.id === this.activeCategory) ?? CATEGORIES[0];
    const title = document.querySelector('#active-category-title');
    title.textContent = `${category.icon}  ${category.label}`;

    const container = document.querySelector('#customization-options');
    container.replaceChildren();
    category.fields.forEach((field) => {
      const group = document.createElement('div');
      group.className = 'option-group';
      const heading = document.createElement('h3');
      heading.textContent = field.label;
      group.append(heading);
      const grid = document.createElement('div');
      grid.className = field.color ? 'swatch-grid' : 'style-grid';
      field.options.forEach((option) => grid.append(this.makeOption(field, option)));
      group.append(grid);
      container.append(group);
    });
  }

  makeOption(field, option) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.key = field.key;
    button.dataset.value = option.id;
    const selected = this.currentAppearance[field.key] === option.id;
    button.className = `${field.color ? 'swatch-option' : 'style-option'}${selected ? ' is-selected' : ''}`;
    button.setAttribute('aria-pressed', String(selected));
    button.setAttribute('aria-label', option.name);

    if (field.color) {
      const swatch = document.createElement('span');
      swatch.className = 'color-swatch';
      swatch.style.setProperty('--swatch', option.hex);
      swatch.setAttribute('aria-hidden', 'true');
      button.append(swatch);
      const label = document.createElement('span');
      label.className = 'swatch-label';
      label.textContent = option.name;
      button.append(label);
    } else {
      const icon = document.createElement('span');
      icon.className = 'style-option-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = option.icon ?? '✦';
      const label = document.createElement('span');
      label.textContent = option.name;
      button.append(icon, label);
    }

    button.addEventListener('click', () => {
      this.currentAppearance[field.key] = option.id;
      this.renderCategory();
      this.emitChange();
    });
    return button;
  }

  syncIdentity() {
    document.querySelector('#display-name').value = this.currentAppearance.displayName;
    document.querySelectorAll('.base-type-option').forEach((button) => {
      const selected = button.dataset.value === this.currentAppearance.baseType;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    const displayName = this.currentAppearance.displayName.trim() || 'ผู้เล่นใหม่';
    document.querySelector('#preview-name').textContent = displayName;
    document.querySelector('#preview-avatar-icon').textContent = this.currentAppearance.baseType === 'female' ? '♡' : '☺';
  }

  emitChange() {
    this.currentAppearance = new CharacterAppearance(this.currentAppearance.toJSON()).validate();
    this.scene.events.emit('appearance-changed', this.currentAppearance);
    this.scene.events.emit('name-changed', this.currentAppearance.displayName.trim() || 'ผู้เล่นใหม่');
    this.syncIdentity();
  }

  randomize() {
    const randomChoice = (options) => options[Math.floor(Math.random() * options.length)].id;
    this.currentAppearance = new CharacterAppearance({
      baseType: randomChoice(BASE_TYPES),
      skinTone: randomChoice(SKIN_TONES),
      hairStyle: randomChoice(HAIR_STYLES),
      hairColor: randomChoice(HAIR_COLORS),
      eyeStyle: randomChoice(EYE_STYLES),
      eyeColor: randomChoice(EYE_COLORS),
      shirt: randomChoice(SHIRTS),
      shirtColor: randomChoice(SHIRT_COLORS),
      pants: randomChoice(PANTS),
      pantsColor: randomChoice(PANTS_COLORS),
      shoes: randomChoice(SHOES),
      shoeColor: randomChoice(SHOE_COLORS),
      accessory: randomChoice(ACCESSORIES),
      displayName: this.currentAppearance.displayName,
    });
    this.renderBaseTypes();
    this.renderCategory();
    this.emitChange();
    this.showToast('ได้ลุคใหม่แล้ว ลองปรับต่อได้เลย');
  }

  reset() {
    this.currentAppearance = new CharacterAppearance();
    this.renderBaseTypes();
    this.renderCategory();
    this.emitChange();
    this.showToast('กลับไปลุคเริ่มต้นแล้ว');
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentAppearance.toJSON()));
      this.showToast('บันทึกตัวละครไว้ในเครื่องนี้แล้ว');
    } catch {
      this.showToast('บันทึกไม่สำเร็จ ลองใช้เบราว์เซอร์อื่น', true);
    }
  }

  showToast(message, isError = false) {
    const region = document.querySelector('#toast-region');
    region.textContent = message;
    region.className = `toast ${isError ? 'toast-error' : ''}`;
    region.classList.add('is-visible');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => region.classList.remove('is-visible'), 2500);
  }

  destroy() {
    clearTimeout(this.toastTimer);
  }
}
