const defaultPromoCodes = [
  {
    code: 'WELCOME10',
    type: 'percentage',
    value: 10,
    minSubtotal: 50,
    description: '10% off orders from $50',
  },
  {
    code: 'SAVE20',
    type: 'fixed',
    value: 20,
    minSubtotal: 150,
    description: '$20 off orders from $150',
  },
  {
    code: 'SHIPFREE',
    type: 'shipping',
    value: 100,
    minSubtotal: 80,
    description: 'Free shipping on orders from $80',
  },
];

const parsePromoCodesFromEnv = () => {
  const raw = process.env.PROMO_CODES;

  if (!raw) {
    return defaultPromoCodes;
  }

  const codes = raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [code, type, value, minSubtotal = '0', description = ''] =
        entry.split(':');

      return {
        code: String(code || '').trim().toUpperCase(),
        type: String(type || '').trim().toLowerCase(),
        value: Number(value || 0),
        minSubtotal: Number(minSubtotal || 0),
        description: description.replace(/_/g, ' ').trim(),
      };
    })
    .filter(
      (promo) =>
        promo.code &&
        ['percentage', 'fixed', 'shipping'].includes(promo.type) &&
        Number.isFinite(promo.value) &&
        promo.value > 0
    );

  return codes.length ? codes : defaultPromoCodes;
};

const roundMoney = (value) => Number(Number(value || 0).toFixed(2));

export const getActivePromoCodes = () => parsePromoCodesFromEnv();

export const resolvePromotion = ({
  promoCode,
  subtotal = 0,
  shippingPrice = 0,
}) => {
  const normalizedCode = String(promoCode || '')
    .trim()
    .toUpperCase();

  if (!normalizedCode) {
    return null;
  }

  const promo = getActivePromoCodes().find((entry) => entry.code === normalizedCode);

  if (!promo) {
    return {
      valid: false,
      code: normalizedCode,
      message: 'Promo code is invalid or inactive',
      discountAmount: 0,
    };
  }

  if (Number(subtotal) < Number(promo.minSubtotal || 0)) {
    return {
      valid: false,
      code: normalizedCode,
      message: `Promo code requires a subtotal of at least $${promo.minSubtotal}`,
      discountAmount: 0,
    };
  }

  let discountAmount = 0;

  if (promo.type === 'percentage') {
    discountAmount = roundMoney((Number(subtotal) * Number(promo.value)) / 100);
  }

  if (promo.type === 'fixed') {
    discountAmount = roundMoney(Math.min(Number(promo.value), Number(subtotal)));
  }

  if (promo.type === 'shipping') {
    discountAmount = roundMoney(
      Math.min(Number(shippingPrice), Number(shippingPrice) * (Number(promo.value) / 100))
    );
  }

  return {
    valid: true,
    code: promo.code,
    type: promo.type,
    value: promo.value,
    minSubtotal: promo.minSubtotal,
    description: promo.description,
    discountAmount,
  };
};
