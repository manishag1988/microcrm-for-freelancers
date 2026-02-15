// Form Validation Module

class Validator {
  static rules = {
    required: (value) => {
      if (value === null || value === undefined || value === '') {
        return 'This field is required';
      }
      return null;
    },
    
    email: (value) => {
      if (!value) return null;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Please enter a valid email address';
      }
      return null;
    },
    
    minLength: (min) => (value) => {
      if (!value) return null;
      if (value.length < min) {
        return `Must be at least ${min} characters`;
      }
      return null;
    },
    
    maxLength: (max) => (value) => {
      if (!value) return null;
      if (value.length > max) {
        return `Must be no more than ${max} characters`;
      }
      return null;
    },
    
    min: (min) => (value) => {
      if (value === null || value === undefined || value === '') return null;
      if (Number(value) < min) {
        return `Must be at least ${min}`;
      }
      return null;
    },
    
    max: (max) => (value) => {
      if (value === null || value === undefined || value === '') return null;
      if (Number(value) > max) {
        return `Must be no more than ${max}`;
      }
      return null;
    },
    
    positiveNumber: (value) => {
      if (!value) return null;
      if (isNaN(value) || Number(value) <= 0) {
        return 'Must be a positive number';
      }
      return null;
    },
    
    phone: (value) => {
      if (!value) return null;
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(value) || value.replace(/\D/g, '').length < 10) {
        return 'Please enter a valid phone number';
      }
      return null;
    },
    
    url: (value) => {
      if (!value) return null;
      try {
        new URL(value);
        return null;
      } catch {
        return 'Please enter a valid URL';
      }
    },
    
    match: (fieldName, getValue) => (value) => {
      if (!value) return null;
      const matchValue = getValue();
      if (value !== matchValue) {
        return `Does not match ${fieldName}`;
      }
      return null;
    }
  };

  static validate(data, schema) {
    const errors = {};
    let isValid = true;

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      
      for (const rule of rules) {
        let error = null;
        
        if (typeof rule === 'function') {
          error = rule(value);
        } else if (typeof rule === 'object' && rule.validate) {
          error = rule.validate(value);
        }
        
        if (error) {
          errors[field] = error;
          isValid = false;
          break;
        }
      }
    }

    return { isValid, errors };
  }

  static showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    // Remove existing error
    this.clearFieldError(fieldId);

    // Add error class
    field.classList.add('error');
    
    // Create error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    
    // Insert after field
    field.parentNode.insertBefore(errorDiv, field.nextSibling);
  }

  static clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    field.classList.remove('error');
    
    // Remove error message
    const errorDiv = field.parentNode.querySelector('.field-error');
    if (errorDiv) {
      errorDiv.remove();
    }
  }

  static clearAllErrors(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    form.querySelectorAll('.field-error').forEach(el => el.remove());
  }

  static highlightError(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    field.classList.add('error');
  }
}

// Form Schemas
const FormSchemas = {
  login: {
    'login-email': [Validator.rules.required, Validator.rules.email],
    'login-password': [Validator.rules.required, Validator.rules.minLength(8)]
  },
  
  register: {
    'register-name': [Validator.rules.required, Validator.rules.minLength(2), Validator.rules.maxLength(50)],
    'register-email': [Validator.rules.required, Validator.rules.email],
    'register-password': [Validator.rules.required, Validator.rules.minLength(8)],
    'register-company': [Validator.rules.maxLength(100)]
  },
  
  client: {
    'client-name': [Validator.rules.required, Validator.rules.minLength(2), Validator.rules.maxLength(100)],
    'client-email': [Validator.rules.email],
    'client-phone': [Validator.rules.phone],
    'client-company': [Validator.rules.maxLength(100)]
  },
  
  project: {
    'project-name': [Validator.rules.required, Validator.rules.minLength(2), Validator.rules.maxLength(100)],
    'project-budget': [Validator.rules.positiveNumber],
    'project-deadline': []
  },
  
  task: {
    'task-title': [Validator.rules.required, Validator.rules.minLength(2), Validator.rules.maxLength(200)],
    'task-priority': [Validator.rules.required]
  },
  
  invoice: {
    'invoice-client': [Validator.rules.required],
    items: [(value) => {
      // This will be handled separately in the form submit
      return null;
    }],
    'invoice-due-date': []
  },
  
  timelog: {
    description: [Validator.rules.maxLength(500)]
  },
  
  settings: {
    name: [Validator.rules.required, Validator.rules.minLength(2)],
    company: [Validator.rules.maxLength(100)]
  },
  
  changePassword: {
    currentPassword: [Validator.rules.required],
    newPassword: [Validator.rules.required, Validator.rules.minLength(6)],
    confirmPassword: [
      Validator.rules.required,
      Validator.rules.match('password', () => document.getElementById('settings-new-password')?.value)
    ]
  }
};

// Helper to validate before submit
function validateForm(formId, schemaName) {
  const form = document.getElementById(formId);
  if (!form) return true;

  const schema = FormSchemas[schemaName];
  if (!schema) return true;

  // Get data from form fields using id attributes
  const data = {};
  for (const fieldName in schema) {
    const field = document.getElementById(fieldName);
    if (field) {
      if (field.type === 'checkbox') {
        data[fieldName] = field.checked;
      } else if (field.type === 'number') {
        data[fieldName] = field.value ? Number(field.value) : '';
      } else {
        data[fieldName] = field.value;
      }
    } else {
      data[fieldName] = '';
    }
  }

  const { isValid, errors } = Validator.validate(data, schema);
  
  Validator.clearAllErrors(formId);
  
  if (!isValid) {
    for (const [field, message] of Object.entries(errors)) {
      Validator.showFieldError(field, message);
    }
    return false;
  }
  
  return true;
}

// Add CSS for error styling
const style = document.createElement('style');
style.textContent = `
  .field-error {
    color: #ef4444;
    font-size: 0.75rem;
    margin-top: 0.25rem;
  }
  input.error, select.error, textarea.error {
    border-color: #ef4444 !important;
  }
  input.error:focus, select.error:focus, textarea.error:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
  }
`;
document.head.appendChild(style);

export { Validator, FormSchemas, validateForm };
