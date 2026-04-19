// lib/helpers.js - Helper functions

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export const generateInvoiceNumber = (invoiceCount) => {
  const timestamp = Date.now().toString().slice(-4);
  const count = String(invoiceCount + 1).padStart(5, '0');
  return `INV-${count}-${timestamp}`;
};

export const calculateInvoiceTotal = (items, taxRate = 0, discount = 0) => {
  const subtotal = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
  const taxAmount = (subtotal * (taxRate / 100));
  const total = subtotal + taxAmount - discount;
  return { subtotal, taxAmount, total };
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const getStatusBadgeColor = (status) => {
  const statusColors = {
    'paid': 'bg-green-100 text-green-700',
    'pending': 'bg-yellow-100 text-yellow-700',
    'partial': 'bg-blue-100 text-blue-700',
    'unpaid': 'bg-red-100 text-red-700',
    'draft': 'bg-gray-100 text-gray-700',
    'active': 'bg-green-100 text-green-700',
    'inactive': 'bg-gray-100 text-gray-700',
    'cancelled': 'bg-red-100 text-red-700',
  };
  return statusColors[status?.toLowerCase()] || 'bg-gray-100 text-gray-700';
};

export const truncate = (str, length = 50) => {
  if (!str) return '';
  return str.length > length ? str.slice(0, length) + '...' : str;
};
