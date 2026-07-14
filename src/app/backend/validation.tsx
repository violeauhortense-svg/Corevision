// ============================================
// INPUT VALIDATION MODULE
// Prevents injection attacks, malformed data
// ============================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidateResult<T> {
  valid: boolean;
  data?: T;
  errors?: ValidationError[];
}

// Validators
const validators = {
  email: (value: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(value) && value.length <= 255;
  },

  password: (value: string): boolean => {
    return value.length >= 8 && value.length <= 255;
  },

  uuid: (value: string): boolean => {
    const re = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return re.test(value);
  },

  phone: (value: string): boolean => {
    const re = /^[\d\s\-+()]{7,20}$/;
    return re.test(value);
  },

  positiveNumber: (value: number): boolean => {
    return Number.isFinite(value) && value >= 0;
  },

  stringLength: (value: string, min: number, max: number): boolean => {
    return value.length >= min && value.length <= max;
  },

  statusPipeline: (value: string): boolean => {
    const valid = [
      'Prospect',
      'Découverte',
      'Simulation',
      'Lettre Mission',
      'Rapport/Audit',
      'Suivi MEP',
      'Suivi CSP',
      'Arbitrage',
    ];
    return valid.includes(value);
  },
};

// Validation schemas
export const schemas = {
  signup: (data: any): ValidateResult<{ email: string; password: string }> => {
    const errors: ValidationError[] = [];

    if (!data.email || !validators.email(data.email)) {
      errors.push({ field: 'email', message: 'Invalid email format' });
    }

    if (!data.password || !validators.password(data.password)) {
      errors.push({ field: 'password', message: 'Password must be 8+ characters' });
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return {
      valid: true,
      data: { email: data.email, password: data.password },
    };
  },

  createClient: (data: any): ValidateResult<any> => {
    const errors: ValidationError[] = [];

    if (!data.nom || !validators.stringLength(data.nom, 1, 255)) {
      errors.push({ field: 'nom', message: 'Name required (1-255 chars)' });
    }

    if (data.email && !validators.email(data.email)) {
      errors.push({ field: 'email', message: 'Invalid email' });
    }

    if (data.telephone && !validators.phone(data.telephone)) {
      errors.push({ field: 'telephone', message: 'Invalid phone format' });
    }

    if (data.patrimoine && !validators.positiveNumber(data.patrimoine)) {
      errors.push({ field: 'patrimoine', message: 'Patrimoine must be >= 0' });
    }

    if (data.statusOuvert && !validators.statusPipeline(data.statusOuvert)) {
      errors.push({ field: 'statusOuvert', message: 'Invalid status' });
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true, data };
  },

  updateClient: (data: any): ValidateResult<any> => {
    const errors: ValidationError[] = [];

    if (data.email && !validators.email(data.email)) {
      errors.push({ field: 'email', message: 'Invalid email' });
    }

    if (data.telephone && !validators.phone(data.telephone)) {
      errors.push({ field: 'telephone', message: 'Invalid phone format' });
    }

    if (data.patrimoine !== undefined && !validators.positiveNumber(data.patrimoine)) {
      errors.push({ field: 'patrimoine', message: 'Patrimoine must be >= 0' });
    }

    if (data.statusOuvert && !validators.statusPipeline(data.statusOuvert)) {
      errors.push({ field: 'statusOuvert', message: 'Invalid status' });
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true, data };
  },

  taskUpdate: (data: any): ValidateResult<any> => {
    const errors: ValidationError[] = [];

    if (typeof data.completed !== 'boolean') {
      errors.push({ field: 'completed', message: 'Must be boolean' });
    }

    if (data.status && !['pending', 'validated', 'na'].includes(data.status)) {
      errors.push({ field: 'status', message: 'Invalid task status' });
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true, data };
  },

  createRDV: (data: any): ValidateResult<any> => {
    const errors: ValidationError[] = [];

    if (!data.date_rdv) {
      errors.push({ field: 'date_rdv', message: 'Date required' });
    } else {
      const date = new Date(data.date_rdv);
      if (isNaN(date.getTime())) {
        errors.push({ field: 'date_rdv', message: 'Invalid date format' });
      }
    }

    if (data.duration_minutes && !validators.positiveNumber(data.duration_minutes)) {
      errors.push({ field: 'duration_minutes', message: 'Must be positive' });
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true, data };
  },
};
