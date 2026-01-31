// src/utils.js

export const normalizeStatus = (status) => {
  if (!status) return '';
  return status.toLowerCase().replace(/\s+/g, '');
};

export const formatTime = (isoString) => {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return isoString;
  }
};

export const formatTargetTime = (timeStr) => {
  if (!timeStr || timeStr === 'ASAP') return 'ASAP';
  return timeStr; 
};

// --- MISSING FUNCTION ADDED HERE ---
export const getModeColor = (mode) => {
  if (!mode) return 'bg-gray-100 text-gray-600 border-gray-200';
  const m = mode.toLowerCase();
  if (m.includes('delivery')) return 'bg-orange-100 text-orange-700 border-orange-200';
  if (m.includes('pick')) return 'bg-blue-100 text-blue-700 border-blue-200';
  return 'bg-purple-100 text-purple-700 border-purple-200'; // Dine in
};

export const getStatusColor = (status) => {
  const s = normalizeStatus(status);
  switch (s) {
    case 'placed': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'preparing': return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'ontheway': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'arrived': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'delivered': return 'bg-green-100 text-green-700 border-green-200';
    case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-gray-100 text-gray-600 border-gray-200';
  }
};

export const getTargetLabel = (mode) => {
  return mode === 'Delivery' ? 'Drop-off' : 'Ready by';
};

export const parseOrderItems = (itemsStr) => {
  if (!itemsStr) return [];
  // Handles the specific string format from the Google Sheet
  return itemsStr.split('\n').map(line => {
    line = line.trim();
    if (!line) return null;

    // Detect Fee lines
    if (line.includes('FEE:')) return { type: 'fee', raw: line };

    // Regex to parse: Quantity x Name [Variant]
    const match = line.match(/^(\d+)x\s+(.+)/);
    
    if (match) {
      const qty = match[1];
      let rest = match[2];
      
      let variant = null;
      let addons = null;
      let notes = null;

      // Extract Note
      if (rest.includes('Note:')) {
        const parts = rest.split('Note:');
        rest = parts[0].trim();
        notes = parts[1].trim();
      }

      // Extract Variant [...]
      const variantMatch = rest.match(/\[(.*?)\]/);
      if (variantMatch) {
        variant = variantMatch[1];
        rest = rest.replace(variantMatch[0], '').trim();
      }

      // Extract Addons (usually after a + sign)
      if (rest.includes('+')) {
         const parts = rest.split('+');
         rest = parts[0].trim();
         addons = parts[1].trim();
      }

      return { type: 'item', qty, name: rest, variant, addons, notes };
    }

    return { type: 'text', raw: line }; // Fallback
  }).filter(Boolean);
};

export const extractLink = (addressStr) => {
  if (!addressStr) return null;
  const linkMatch = addressStr.match(/(https?:\/\/[^\s]+)/);
  return linkMatch ? linkMatch[0] : null;
};