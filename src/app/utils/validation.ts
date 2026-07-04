// Validation utilities for client and financial data

export interface ValidationError {
  field: string;
  message: string;
}

export function validateEmail(email: string): ValidationError | null {
  if (!email) return null;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { field: 'email', message: 'Email invalide' };
  }
  return null;
}

export function validatePhone(phone: string): ValidationError | null {
  if (!phone) return null;
  const phoneRegex = /^[\d\s\-\+\(\)\.]+$/;
  if (!phoneRegex.test(phone)) {
    return { field: 'phone', message: 'Numéro de téléphone invalide' };
  }
  return null;
}

export function validateName(name: string, fieldName: string = 'Nom'): ValidationError | null {
  if (!name || !name.trim()) {
    return { field: fieldName.toLowerCase(), message: `${fieldName} requis` };
  }
  if (name.trim().length < 2) {
    return { field: fieldName.toLowerCase(), message: `${fieldName} trop court (minimum 2 caractères)` };
  }
  if (name.trim().length > 100) {
    return { field: fieldName.toLowerCase(), message: `${fieldName} trop long (maximum 100 caractères)` };
  }
  return null;
}

export function validateNumericField(value: any, fieldName: string = 'Valeur', min = 0): ValidationError | null {
  if (value === '' || value === null || value === undefined) return null;

  const num = Number(value);
  if (isNaN(num)) {
    return { field: fieldName.toLowerCase(), message: `${fieldName} doit être un nombre` };
  }

  if (num < min) {
    return { field: fieldName.toLowerCase(), message: `${fieldName} ne peut pas être inférieur à ${min}` };
  }

  return null;
}

export function validateDate(dateString: string, fieldName: string = 'Date'): ValidationError | null {
  if (!dateString) return null;

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return { field: fieldName.toLowerCase(), message: `${fieldName} invalide` };
  }

  return null;
}

export function validateClientData(clientData: any): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate required fields
  const firstNameError = validateName(clientData.firstName, 'Prénom');
  if (firstNameError) errors.push(firstNameError);

  const lastNameError = validateName(clientData.lastName, 'Nom');
  if (lastNameError) errors.push(lastNameError);

  // Validate optional fields if provided
  if (clientData.email) {
    const emailError = validateEmail(clientData.email);
    if (emailError) errors.push(emailError);
  }

  if (clientData.phone) {
    const phoneError = validatePhone(clientData.phone);
    if (phoneError) errors.push(phoneError);
  }

  if (clientData.birthDate) {
    const dateError = validateDate(clientData.birthDate, 'Date de naissance');
    if (dateError) errors.push(dateError);
  }

  if (clientData.patrimoine !== undefined && clientData.patrimoine !== null && clientData.patrimoine !== '') {
    const patrimoineError = validateNumericField(clientData.patrimoine, 'Patrimoine');
    if (patrimoineError) errors.push(patrimoineError);
  }

  return errors;
}

export function validateFinancialData(data: any): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate numeric fields
  const numericFields = [
    { key: 'traitementsSalairesPensions', label: 'Traitements & salaires' },
    { key: 'revenusTNS', label: 'Revenus TNS' },
    { key: 'locationsMeublesNonPro', label: 'Locations meublées' },
    { key: 'reveusValeursCapitauxMobiliers', label: 'Revenus valeurs mobilières' },
    { key: 'plusValueMobiliere', label: 'Plus-value mobilière' },
    { key: 'revenusFonciers', label: 'Revenus fonciers' },
    { key: 'impotRevenu', label: 'Impôt sur le revenu' },
    { key: 'ifi', label: 'IFI' },
  ];

  numericFields.forEach(field => {
    if (data[field.key] !== undefined && data[field.key] !== null && data[field.key] !== '') {
      const error = validateNumericField(data[field.key], field.label);
      if (error) errors.push(error);
    }
  });

  return errors;
}

export function validatePatrimoineItem(item: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!item.label || !item.label.trim()) {
    errors.push({ field: 'label', message: 'Description requise' });
  }

  const valueError = validateNumericField(item.value, 'Valeur');
  if (valueError) errors.push(valueError);

  if (item.purchaseDate) {
    const dateError = validateDate(item.purchaseDate, 'Date d\'achat');
    if (dateError) errors.push(dateError);
  }

  return errors;
}
