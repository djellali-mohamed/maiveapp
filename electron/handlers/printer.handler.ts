import { ipcMain } from 'electron';
import { getDatabase } from '../../src/db/migrate';

// Receipt width: 48 characters for 80mm thermal printer
const RECEIPT_WIDTH = 48;

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

function formatDZD(centimes: number): string {
  const dzd = centimes / 100;
  return dzd.toLocaleString('fr-DZ') + ' DZD';
}

function generateReceiptContent(transaction: any): string {
  const lines: string[] = [];
  
  // Header
  lines.push('='.repeat(RECEIPT_WIDTH));
  lines.push(center('M A I V É'));
  lines.push(center("L'essence de votre renaissance"));
  lines.push('='.repeat(RECEIPT_WIDTH));
  
  // Date and reference
  const date = new Date(transaction.created_at).toLocaleString('fr-DZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  lines.push(`${date}    Réf: ${transaction.ref}`);
  lines.push('-'.repeat(RECEIPT_WIDTH));
  
  // Items
  for (const item of transaction.items) {
    const name = item.product_name;
    const variant = item.variant_label ? ` - ${item.variant_label}` : '';
    const qty = `x${item.quantity}`;
    const price = formatDZD(item.line_total);
    
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
  lines.push(padRight('Sous-total', 36) + padLeft(formatDZD(transaction.subtotal), 12));
  
  if (transaction.discount_amount > 0) {
    const discountLabel = transaction.discount_reason 
      ? `Remise (${transaction.discount_reason})`
      : 'Remise';
    lines.push(padRight(discountLabel, 36) + padLeft(`-${formatDZD(transaction.discount_amount)}`, 12));
  }
  
  lines.push(' '.repeat(36) + '-'.repeat(12));
  lines.push(padRight('TOTAL', 36) + padLeft(formatDZD(transaction.total), 12));
  lines.push('');
  
  // Payment
  const paymentMethodLabels: Record<string, string> = {
    cash: 'Espèces',
    card: 'Carte bancaire',
    mobile: 'Paiement mobile',
  };
  
  lines.push(padRight(paymentMethodLabels[transaction.payment_method] || transaction.payment_method, 36) + 
    padLeft(formatDZD(transaction.amount_tendered || transaction.total), 12));
  
  if (transaction.change_given > 0) {
    lines.push(padRight('Monnaie', 36) + padLeft(formatDZD(transaction.change_given), 12));
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

export function setupPrinterHandlers() {
  // Print receipt
  ipcMain.handle('printer:printReceipt', async (_, transactionId: number) => {
    try {
      const db = getDatabase();
      
      // Get transaction with items
      const transaction = db.prepare(`
        SELECT t.*, c.name as customer_name, ca.name as cashier_name
        FROM transactions t
        LEFT JOIN customers c ON t.customer_id = c.id
        LEFT JOIN cashiers ca ON t.cashier_id = ca.id
        WHERE t.id = ?
      `).get(transactionId) as any;

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      const items = db.prepare(`
        SELECT * FROM transaction_items WHERE transaction_id = ?
      `).all(transactionId) as any[];

      transaction.items = items;

      // Generate receipt content
      const receiptContent = generateReceiptContent(transaction);
      
      // For now, we'll log the receipt content
      // In a real implementation, this would use electron-pos-printer
      console.log('=== RECEIPT ===');
      console.log(receiptContent);
      console.log('===============');

      // TODO: Implement actual printing with electron-pos-printer
      // const { PosPrinter } = await import('electron-pos-printer');
      // await PosPrinter.print(receiptContent, { ... });

      return true;
    } catch (error) {
      console.error('Print error:', error);
      throw error;
    }
  });

  // Test print
  ipcMain.handle('printer:test', async () => {
    try {
      const testContent = `
${'='.repeat(RECEIPT_WIDTH)}
${center('M A I V É')}
${center('Test d\'impression')}
${'='.repeat(RECEIPT_WIDTH)}

${center('L\'imprimante fonctionne correctement.')}
${center(new Date().toLocaleString('fr-DZ'))}

${'='.repeat(RECEIPT_WIDTH)}
`;
      
      console.log('=== TEST PRINT ===');
      console.log(testContent);
      console.log('==================');

      return true;
    } catch (error) {
      console.error('Test print error:', error);
      throw error;
    }
  });

  // Get available printers
  ipcMain.handle('printer:getList', async () => {
    // In a real implementation, this would return available printers
    // For now, return a mock list
    return ['Default Printer', 'Thermal Printer 80mm'];
  });
}
