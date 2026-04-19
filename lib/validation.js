// lib/validation.js - Form validation utilities

export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validatePhone = (phone) => {
  const regex = /^[0-9\s\-\+\(\)]{10,}$/;
  return regex.test(phone.replace(/\s/g, ''));
};

export const validateProductForm = (data) => {
  const errors = {};

  if (!data.name || data.name.trim() === '') {
    errors.name = 'Product name is required';
  }

  if (!data.price || Number(data.price) <= 0) {
    errors.price = 'Price must be greater than 0';
  }

  if (data.cost_price && Number(data.cost_price) > Number(data.price)) {
    errors.cost_price = 'Cost price cannot be greater than selling price';
  }

  if (!data.stock || Number(data.stock) < 0) {
    errors.stock = 'Stock must be 0 or greater';
  }

  if (data.sku && data.sku.trim() === '') {
    errors.sku = 'SKU cannot be empty';
  }

  return Object.keys(errors).length === 0 ? null : errors;
};

export const validateCustomerForm = (data) => {
  const errors = {};

  if (!data.name || data.name.trim() === '') {
    errors.name = 'Customer name is required';
  }

  if (!data.phone || !validatePhone(data.phone)) {
    errors.phone = 'Valid phone number is required';
  }

  if (data.email && !validateEmail(data.email)) {
    errors.email = 'Valid email is required';
  }

  if (data.postal_code && !/^\d{5,6}$/.test(data.postal_code.replace(/\s/g, ''))) {
    errors.postal_code = 'Valid postal code required (5-6 digits)';
  }

  return Object.keys(errors).length === 0 ? null : errors;
};

export const validateInvoiceForm = (data) => {
  const errors = {};

  if (!data.customer_id) {
    errors.customer_id = 'Customer is required';
  }

  if (!data.items || data.items.length === 0) {
    errors.items = 'At least one item is required';
  } else {
    const itemErrors = [];
    data.items.forEach((item, idx) => {
      if (!item.product_id) {
        itemErrors[idx] = 'Product is required';
      } else if (!item.qty || item.qty <= 0) {
        itemErrors[idx] = 'Quantity must be greater than 0';
      }
    });
    if (itemErrors.some(e => e)) {
      errors.items = itemErrors;
    }
  }

  return Object.keys(errors).length === 0 ? null : errors;
};

// Alias for consistency with other forms
export const validateCustomer = validateCustomerForm;
