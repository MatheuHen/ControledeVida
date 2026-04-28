import type { LucideIcon } from "lucide-react";
import {
  UtensilsCrossed, Coffee, Pizza, Sandwich, Wine, Beer, Apple, Egg,
  IceCreamCone, Cake, CookingPot, Soup, Salad, Cherry, Milk,
  Car, Bus, Bike, Train, Plane, Fuel, Navigation, MapPin, Ship, Truck, Ambulance, CircleDot,
  Home, Building, Key, Sofa, Lamp, Bath, Bed, DoorOpen, Warehouse, Fence,
  GraduationCap, BookOpen, Library, Pencil, Ruler, Calculator, School, Notebook,
  Backpack, Globe, Microscope, Brain, Lightbulb, FileText, Award,
  Heart, Stethoscope, Pill, Syringe, Activity, Thermometer, Eye, Ear, Hand, Dna, Cross, Hospital,
  Gamepad2, Film, Music, Headphones, Camera, Palette, Drama, PartyPopper, Tent, Mountain, Waves, Dumbbell,
  Briefcase, Monitor, Laptop, Phone, Mail, Calendar, Clock, Printer, Wifi, Server,
  ShoppingCart, ShoppingBag, Gift, Tag, CreditCard, Barcode, Store, Package, Shirt, Watch,
  DollarSign, Wallet, PiggyBank, TrendingUp, TrendingDown, BarChart3, Receipt, Coins, Banknote, Landmark,
  Star, Sparkles, Zap, Shield, Flag, Bell, Bookmark, Pin, Scissors, Wrench,
} from "lucide-react";

export type CategoryIcon = {
  name: string;
  icon: LucideIcon;
  group: string;
};

export const CATEGORY_ICONS: CategoryIcon[] = [
  // Alimentação (15)
  { name: "Refeições", icon: UtensilsCrossed, group: "Alimentação" },
  { name: "Café", icon: Coffee, group: "Alimentação" },
  { name: "Pizza", icon: Pizza, group: "Alimentação" },
  { name: "Sanduíche", icon: Sandwich, group: "Alimentação" },
  { name: "Vinho", icon: Wine, group: "Alimentação" },
  { name: "Cerveja", icon: Beer, group: "Alimentação" },
  { name: "Frutas", icon: Apple, group: "Alimentação" },
  { name: "Ovos", icon: Egg, group: "Alimentação" },
  { name: "Sorvete", icon: IceCreamCone, group: "Alimentação" },
  { name: "Bolo", icon: Cake, group: "Alimentação" },
  { name: "Panela", icon: CookingPot, group: "Alimentação" },
  { name: "Sopa", icon: Soup, group: "Alimentação" },
  { name: "Salada", icon: Salad, group: "Alimentação" },
  { name: "Cereja", icon: Cherry, group: "Alimentação" },
  { name: "Leite", icon: Milk, group: "Alimentação" },

  // Transporte (12)
  { name: "Carro", icon: Car, group: "Transporte" },
  { name: "Ônibus", icon: Bus, group: "Transporte" },
  { name: "Bicicleta", icon: Bike, group: "Transporte" },
  { name: "Trem", icon: Train, group: "Transporte" },
  { name: "Avião", icon: Plane, group: "Transporte" },
  { name: "Combustível", icon: Fuel, group: "Transporte" },
  { name: "Navegação", icon: Navigation, group: "Transporte" },
  { name: "Localização", icon: MapPin, group: "Transporte" },
  { name: "Barco", icon: Ship, group: "Transporte" },
  { name: "Caminhão", icon: Truck, group: "Transporte" },
  { name: "Ambulância", icon: Ambulance, group: "Transporte" },
  { name: "Círculo", icon: CircleDot, group: "Transporte" },

  // Moradia (10)
  { name: "Casa", icon: Home, group: "Moradia" },
  { name: "Prédio", icon: Building, group: "Moradia" },
  { name: "Chave", icon: Key, group: "Moradia" },
  { name: "Sofá", icon: Sofa, group: "Moradia" },
  { name: "Luminária", icon: Lamp, group: "Moradia" },
  { name: "Banheiro", icon: Bath, group: "Moradia" },
  { name: "Cama", icon: Bed, group: "Moradia" },
  { name: "Porta", icon: DoorOpen, group: "Moradia" },
  { name: "Armazém", icon: Warehouse, group: "Moradia" },
  { name: "Cerca", icon: Fence, group: "Moradia" },

  // Educação (15)
  { name: "Formatura", icon: GraduationCap, group: "Educação" },
  { name: "Livro", icon: BookOpen, group: "Educação" },
  { name: "Biblioteca", icon: Library, group: "Educação" },
  { name: "Lápis", icon: Pencil, group: "Educação" },
  { name: "Régua", icon: Ruler, group: "Educação" },
  { name: "Calculadora", icon: Calculator, group: "Educação" },
  { name: "Escola", icon: School, group: "Educação" },
  { name: "Caderno", icon: Notebook, group: "Educação" },
  { name: "Mochila", icon: Backpack, group: "Educação" },
  { name: "Globo", icon: Globe, group: "Educação" },
  { name: "Microscópio", icon: Microscope, group: "Educação" },
  { name: "Cérebro", icon: Brain, group: "Educação" },
  { name: "Ideia", icon: Lightbulb, group: "Educação" },
  { name: "Documento", icon: FileText, group: "Educação" },
  { name: "Premiação", icon: Award, group: "Educação" },

  // Saúde (12)
  { name: "Coração", icon: Heart, group: "Saúde" },
  { name: "Estetoscópio", icon: Stethoscope, group: "Saúde" },
  { name: "Remédio", icon: Pill, group: "Saúde" },
  { name: "Seringa", icon: Syringe, group: "Saúde" },
  { name: "Atividade", icon: Activity, group: "Saúde" },
  { name: "Termômetro", icon: Thermometer, group: "Saúde" },
  { name: "Olho", icon: Eye, group: "Saúde" },
  { name: "Ouvido", icon: Ear, group: "Saúde" },
  { name: "Mão", icon: Hand, group: "Saúde" },
  { name: "DNA", icon: Dna, group: "Saúde" },
  { name: "Cruz", icon: Cross, group: "Saúde" },
  { name: "Hospital", icon: Hospital, group: "Saúde" },

  // Lazer (12)
  { name: "Videogame", icon: Gamepad2, group: "Lazer" },
  { name: "Cinema", icon: Film, group: "Lazer" },
  { name: "Música", icon: Music, group: "Lazer" },
  { name: "Fones", icon: Headphones, group: "Lazer" },
  { name: "Câmera", icon: Camera, group: "Lazer" },
  { name: "Arte", icon: Palette, group: "Lazer" },
  { name: "Teatro", icon: Drama, group: "Lazer" },
  { name: "Festa", icon: PartyPopper, group: "Lazer" },
  { name: "Camping", icon: Tent, group: "Lazer" },
  { name: "Montanha", icon: Mountain, group: "Lazer" },
  { name: "Praia", icon: Waves, group: "Lazer" },
  { name: "Academia", icon: Dumbbell, group: "Lazer" },

  // Trabalho (10)
  { name: "Maleta", icon: Briefcase, group: "Trabalho" },
  { name: "Monitor", icon: Monitor, group: "Trabalho" },
  { name: "Notebook", icon: Laptop, group: "Trabalho" },
  { name: "Telefone", icon: Phone, group: "Trabalho" },
  { name: "E-mail", icon: Mail, group: "Trabalho" },
  { name: "Agenda", icon: Calendar, group: "Trabalho" },
  { name: "Relógio", icon: Clock, group: "Trabalho" },
  { name: "Impressora", icon: Printer, group: "Trabalho" },
  { name: "Wi-Fi", icon: Wifi, group: "Trabalho" },
  { name: "Servidor", icon: Server, group: "Trabalho" },

  // Compras (10)
  { name: "Carrinho", icon: ShoppingCart, group: "Compras" },
  { name: "Sacola", icon: ShoppingBag, group: "Compras" },
  { name: "Presente", icon: Gift, group: "Compras" },
  { name: "Etiqueta", icon: Tag, group: "Compras" },
  { name: "Cartão", icon: CreditCard, group: "Compras" },
  { name: "Código de barras", icon: Barcode, group: "Compras" },
  { name: "Loja", icon: Store, group: "Compras" },
  { name: "Pacote", icon: Package, group: "Compras" },
  { name: "Roupa", icon: Shirt, group: "Compras" },
  { name: "Relógio", icon: Watch, group: "Compras" },

  // Finanças (10)
  { name: "Dinheiro", icon: DollarSign, group: "Finanças" },
  { name: "Carteira", icon: Wallet, group: "Finanças" },
  { name: "Cofre", icon: PiggyBank, group: "Finanças" },
  { name: "Crescimento", icon: TrendingUp, group: "Finanças" },
  { name: "Queda", icon: TrendingDown, group: "Finanças" },
  { name: "Gráfico", icon: BarChart3, group: "Finanças" },
  { name: "Recibo", icon: Receipt, group: "Finanças" },
  { name: "Moedas", icon: Coins, group: "Finanças" },
  { name: "Nota", icon: Banknote, group: "Finanças" },
  { name: "Banco", icon: Landmark, group: "Finanças" },

  // Outros (10)
  { name: "Estrela", icon: Star, group: "Outros" },
  { name: "Brilhos", icon: Sparkles, group: "Outros" },
  { name: "Raio", icon: Zap, group: "Outros" },
  { name: "Escudo", icon: Shield, group: "Outros" },
  { name: "Bandeira", icon: Flag, group: "Outros" },
  { name: "Sino", icon: Bell, group: "Outros" },
  { name: "Marcador", icon: Bookmark, group: "Outros" },
  { name: "Alfinete", icon: Pin, group: "Outros" },
  { name: "Tesoura", icon: Scissors, group: "Outros" },
  { name: "Ferramenta", icon: Wrench, group: "Outros" },
];

export const ICON_GROUPS = Array.from(new Set(CATEGORY_ICONS.map((i) => i.group)));

export function getIconByName(name: string): LucideIcon | undefined {
  return CATEGORY_ICONS.find((i) => i.name === name)?.icon;
}

export function getIconsByGroup(group: string): CategoryIcon[] {
  return CATEGORY_ICONS.filter((i) => i.group === group);
}
