import { formatDZD } from './currency';

// Receipt width: 48 characters for 80mm thermal printer
const RECEIPT_WIDTH = 48;

export interface ReceiptData {
  ref: string;
  date: string;
  items: {
    name: string;
    variant?: string;
    quantity: number;
    lineTotal: number;
  }[];
  subtotal: number;
  discountAmount: number;
  discountReason?: string;
  total: number;
  paymentMethod: 'cash' | 'card' | 'mobile';
  amountTendered?: number;
  changeGiven?: number;
}

function center(text: string, width: number = RECEIPT_WIDTH): string {
  const padding = Math.max(0, Math.floor((width - text.length) / 2));
  return ' '.repeat(padding) + text;
}

function padLeft(text: string, width: number): string {
  return text.padStart(width);
}

function padRight(text: string, width: number): string {
  return text.padEnd(width);
}

export function generateReceipt(data: ReceiptData): string {
  const lines: string[] = [];
  
  // Header
  lines.push('='.repeat(RECEIPT_WIDTH));
  lines.push(center('M A I V É'));
  lines.push(center("L'essence de votre renaissance"));
  lines.push('='.repeat(RECEIPT_WIDTH));
  
  // Date and reference
  lines.push(`${data.date}    Réf: ${data.ref}`);
  lines.push('-'.repeat(RECEIPT_WIDTH));
  
  // Items
  for (const item of data.items) {
    const name = item.name;
    const variant = item.variant ? ` - ${item.variant}` : '';
    const qty = `x${item.quantity}`;
    const price = formatDZD(item.lineTotal);
    
    const nameLine = `${name}${variant}`;
    const priceLine = `${padLeft(qty, 8)} ${padLeft(price, 12)}`;
    
    if (nameLine.length + priceLine.length > RECEIPT_WIDTH) {
      lines.push(nameLine.substring(0, RECEIPT_WIDTH - 12));
      lines.push(padLeft(priceLine, RECEIPT_WIDTH));
    } else {
      lines.push(padRight(nameLine, RECEIPT_WIDTH - 12) + padLeft(price, 12));
    }
  }
  
  lines.push('-'.repeat(RECEIPT_WIDTH));
  
  // Totals
  lines.push(padRight('Sous-total', 36) + padLeft(formatDZD(data.subtotal), 12));
  
  if (data.discountAmount > 0) {
    const discountLabel = data.discountReason 
      ? `Remise (${data.discountReason})`
      : 'Remise';
    lines.push(padRight(discountLabel, 36) + padLeft(`-${formatDZD(data.discountAmount)}`, 12));
  }
  
  lines.push(' '.repeat(36) + '-'.repeat(12));
  lines.push(padRight('TOTAL', 36) + padLeft(formatDZD(data.total), 12));
  lines.push('');
  
  // Payment
  const paymentMethodLabels: Record<string, string> = {
    cash: 'Espèces',
    card: 'Carte bancaire',
    mobile: 'Paiement mobile',
  };
  
  lines.push(padRight(paymentMethodLabels[data.paymentMethod] || data.paymentMethod, 36) + 
    padLeft(formatDZD(data.amountTendered || data.total), 12));
  
  if (data.changeGiven && data.changeGiven > 0) {
    lines.push(padRight('Monnaie', 36) + padLeft(formatDZD(data.changeGiven), 12));
  }
  
  lines.push('='.repeat(RECEIPT_WIDTH));
  lines.push(center('Merci pour votre confiance.'));
  lines.push(center('Retours acceptés sous 7 jours avec'));
  lines.push(center('présentation du reçu.'));
  lines.push(center('maive.onrender.com'));
  lines.push('='.repeat(RECEIPT_WIDTH));
  lines.push('');
  lines.push('');
  lines.push('');
  
  return lines.join('\n');
}

export function generateTestReceipt(): string {
  const testData: ReceiptData = {
    ref: 'MAV-20250221-0001',
    date: new Date().toLocaleString('fr-DZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    items: [
      { name: 'Tote Signature', variant: 'Noir', quantity: 1, lineTotal: 950000 },
      { name: 'Mini Bag Élégance', variant: 'Crème', quantity: 1, lineTotal: 550000 },
    ],
    subtotal: 1500000,
    discountAmount: 150000,
    discountReason: '-10%',
    total: 1350000,
    paymentMethod: 'cash',
    amountTendered: 1500000,
    changeGiven: 150000,
  };
  
  return generateReceipt(testData);
}
