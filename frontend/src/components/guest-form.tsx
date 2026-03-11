import { useState, useCallback } from 'react';
import type { GuestData } from '../types';

interface FormFields {
  name: string;
  surname: string;
  phone: string;
  email: string;
  notes: string;
}

interface FormErrors {
  name?: string;
  surname?: string;
  phone?: string;
  email?: string;
}

interface GuestFormProps {
  onValidChange: (valid: boolean, data: GuestData | null) => void;
  disabled?: boolean;
}

const PHONE_DISPLAY_RE = /^\+7\(\d{3}\) \d{3}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  const d = digits.startsWith('7') ? digits.slice(1) : digits;
  const part = d.slice(0, 10);
  let out = '+7';
  if (part.length > 0) out += '(' + part.slice(0, 3);
  if (part.length >= 3) out += ') ' + part.slice(3, 6);
  if (part.length >= 6) out += '-' + part.slice(6, 8);
  if (part.length >= 8) out += '-' + part.slice(8, 10);
  return out;
}

function stripPhone(display: string): string {
  const digits = display.replace(/\D/g, '');
  return '+7' + digits.slice(digits.startsWith('7') ? 1 : 0, 11);
}

function validateFields(fields: FormFields): FormErrors {
  const errors: FormErrors = {};
  if (!fields.name.trim()) errors.name = 'Введите имя';
  if (!fields.surname.trim()) errors.surname = 'Введите фамилию';
  if (!PHONE_DISPLAY_RE.test(fields.phone)) errors.phone = 'Введите телефон в формате +7(XXX) XXX-XX-XX';
  if (!EMAIL_RE.test(fields.email)) errors.email = 'Введите корректный email';
  return errors;
}

export default function GuestForm({ onValidChange, disabled = false }: GuestFormProps) {
  const [fields, setFields] = useState<FormFields>({ name: '', surname: '', phone: '+7', email: '', notes: '' });
  const [touched, setTouched] = useState<Partial<Record<keyof FormErrors, boolean>>>({});
  const [errors, setErrors] = useState<FormErrors>({});

  const notify = useCallback((updated: FormFields, errs: FormErrors) => {
    const isValid = Object.keys(errs).length === 0 && updated.name.trim() !== '' && updated.surname.trim() !== '' && updated.email.trim() !== '';
    if (isValid) {
      onValidChange(true, {
        name: updated.name.trim(),
        surname: updated.surname.trim(),
        phone: stripPhone(updated.phone),
        email: updated.email.trim(),
        notes: updated.notes.trim(),
      });
    } else {
      onValidChange(false, null);
    }
  }, [onValidChange]);

  const handleChange = (field: keyof FormFields, value: string) => {
    const updated = { ...fields, [field]: value };
    setFields(updated);
    const errs = validateFields(updated);
    setErrors(errs);
    notify(updated, errs);
  };

  const handlePhoneChange = (raw: string) => {
    if (!raw.startsWith('+7')) {
      handleChange('phone', '+7');
      return;
    }
    const formatted = formatPhone(raw);
    handleChange('phone', formatted);
  };

  const handleBlur = (field: keyof FormErrors) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errs = validateFields(fields);
    setErrors(errs);
  };

  const showError = (field: keyof FormErrors) => touched[field] ? errors[field] : undefined;

  const inputClass = (field: keyof FormErrors) =>
    `w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${
      showError(field) ? 'border-red-400' : 'border-gray-300'
    } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Имя *</label>
        <input
          type="text"
          value={fields.name}
          onChange={(e) => handleChange('name', e.target.value)}
          onBlur={() => handleBlur('name')}
          disabled={disabled}
          className={inputClass('name')}
          placeholder="Иван"
        />
        {showError('name') && <p className="text-red-500 text-xs mt-1">{showError('name')}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Фамилия *</label>
        <input
          type="text"
          value={fields.surname}
          onChange={(e) => handleChange('surname', e.target.value)}
          onBlur={() => handleBlur('surname')}
          disabled={disabled}
          className={inputClass('surname')}
          placeholder="Иванов"
        />
        {showError('surname') && <p className="text-red-500 text-xs mt-1">{showError('surname')}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Телефон *</label>
        <input
          type="tel"
          value={fields.phone}
          onChange={(e) => handlePhoneChange(e.target.value)}
          onBlur={() => handleBlur('phone')}
          disabled={disabled}
          className={inputClass('phone')}
          placeholder="+7(XXX) XXX-XX-XX"
        />
        {showError('phone') && <p className="text-red-500 text-xs mt-1">{showError('phone')}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
        <input
          type="email"
          value={fields.email}
          onChange={(e) => handleChange('email', e.target.value)}
          onBlur={() => handleBlur('email')}
          disabled={disabled}
          className={inputClass('email')}
          placeholder="ivan@example.com"
        />
        {showError('email') && <p className="text-red-500 text-xs mt-1">{showError('email')}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Примечания</label>
        <textarea
          value={fields.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          disabled={disabled}
          rows={3}
          className={`w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
          }`}
          placeholder="Особые пожелания..."
        />
      </div>
    </div>
  );
}
