export interface User {
  id: number;
}
export interface ExtendedRequest extends Request {
  user?: User;
}
export interface CustomRequest extends Request {
  user?: { id: number };
}

export interface Fighter {
  id: number;
  name: string;
  userId: number;
  visual: Visual;
  stats: Stat;
  deck: Card[];
  equipment: Equipment;
}

export interface FighterAttributes {
  fighterStat: FighterStat;
  stat: Stat;
}

export interface Visual {
  skinColor: string;
  eyesColor: string;
  eyesType: string;
  hairType: string;
  hairColor: string;
}

export interface FighterStat {
  level: number;
  skillPoint: number;
  xpCurrent: number;
  xpMax: number;
}

export interface Stat {
  level: number;
  hp: number;
  atk: number;
  mag: number;
  spd: number;
  rng: number;
}

export interface Card {
  id: number;
  name: string;
  description: string;
  type: string;
  conditions: Condition[];
  effects: Effect[];
  isEquipped: boolean;
  context: "deck" | "collection" | "profile";
  quantity: number;
  slot?: number;
}

export interface Effect {
  value: number;
  type: string;
}

export interface Condition {
  value: number;
  type: string;
}

export interface Equipment {
  body: ItemInterface | null;
  weapon: ItemInterface | null;
  hands: ItemInterface | null;
  feet: ItemInterface | null;
  [key: string]: ItemInterface | null;
}

export interface ItemInterface {
  id: number;
  name: string;
  description: string;
  atk: number;
  hp: number;
  mag: number;
  spd: number;
  range: number;
  type: WeaponTypeInterface;
  slot: EquipmentSlotInterface;
  quantity?: number;
}

type WeaponTypeInterface = "dagger" | "spear" | "sword" | "axe" | "staff";
export type EquipmentSlotInterface = "weapon" | "hands" | "feet" | "body";
