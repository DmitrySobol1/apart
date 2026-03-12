import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from "react";
const PHONE_DISPLAY_RE = /^\+7\(\d{3}\) \d{3}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function formatPhone(raw) {
    const digits = raw.replace(/\D/g, "");
    const d = digits.startsWith("7") ? digits.slice(1) : digits;
    const part = d.slice(0, 10);
    let out = "+7";
    if (part.length > 0)
        out += "(" + part.slice(0, 3);
    if (part.length >= 3)
        out += ") " + part.slice(3, 6);
    if (part.length >= 6)
        out += "-" + part.slice(6, 8);
    if (part.length >= 8)
        out += "-" + part.slice(8, 10);
    return out;
}
function stripPhone(display) {
    const digits = display.replace(/\D/g, "");
    return "+7" + digits.slice(digits.startsWith("7") ? 1 : 0, 11);
}
function validateFields(fields) {
    const errors = {};
    if (!fields.name.trim())
        errors.name = "Введите имя";
    if (!fields.surname.trim())
        errors.surname = "Введите фамилию";
    if (!PHONE_DISPLAY_RE.test(fields.phone))
        errors.phone = "Введите телефон в формате +7(XXX) XXX-XX-XX";
    if (!EMAIL_RE.test(fields.email))
        errors.email = "Введите корректный email";
    return errors;
}
export default function GuestForm({ onValidChange, disabled = false }) {
    const [fields, setFields] = useState({
        name: "",
        surname: "",
        phone: "+7",
        email: "",
        notes: "",
    });
    const [touched, setTouched] = useState({});
    const [errors, setErrors] = useState({});
    const notify = useCallback((updated, errs) => {
        const isValid = Object.keys(errs).length === 0 &&
            updated.name.trim() !== "" &&
            updated.surname.trim() !== "" &&
            updated.email.trim() !== "";
        if (isValid) {
            onValidChange(true, {
                name: updated.name.trim(),
                surname: updated.surname.trim(),
                phone: stripPhone(updated.phone),
                email: updated.email.trim(),
                notes: updated.notes.trim(),
            });
        }
        else {
            onValidChange(false, null);
        }
    }, [onValidChange]);
    const handleChange = (field, value) => {
        const updated = { ...fields, [field]: value };
        setFields(updated);
        const errs = validateFields(updated);
        setErrors(errs);
        notify(updated, errs);
    };
    const handlePhoneChange = (raw) => {
        if (!raw.startsWith("+7")) {
            handleChange("phone", "+7");
            return;
        }
        const formatted = formatPhone(raw);
        handleChange("phone", formatted);
    };
    const handleBlur = (field) => {
        setTouched((prev) => ({ ...prev, [field]: true }));
        const errs = validateFields(fields);
        setErrors(errs);
    };
    const showError = (field) => (touched[field] ? errors[field] : undefined);
    const inputClass = (field) => `w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${showError(field) ? "border-red-400" : "border-gray-300"} ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`;
    return (_jsxs("div", { className: "flex flex-col gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u0418\u043C\u044F *" }), _jsx("input", { type: "text", value: fields.name, onChange: (e) => handleChange("name", e.target.value), onBlur: () => handleBlur("name"), disabled: disabled, className: inputClass("name"), placeholder: "\u0418\u0432\u0430\u043D" }), showError("name") && _jsx("p", { className: "text-red-500 text-xs mt-1", children: showError("name") })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u0424\u0430\u043C\u0438\u043B\u0438\u044F *" }), _jsx("input", { type: "text", value: fields.surname, onChange: (e) => handleChange("surname", e.target.value), onBlur: () => handleBlur("surname"), disabled: disabled, className: inputClass("surname"), placeholder: "\u0418\u0432\u0430\u043D\u043E\u0432" }), showError("surname") && (_jsx("p", { className: "text-red-500 text-xs mt-1", children: showError("surname") }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u0422\u0435\u043B\u0435\u0444\u043E\u043D *" }), _jsx("input", { type: "tel", value: fields.phone, onChange: (e) => handlePhoneChange(e.target.value), onBlur: () => handleBlur("phone"), disabled: disabled, className: inputClass("phone"), placeholder: "+7(XXX) XXX-XX-XX" }), showError("phone") && _jsx("p", { className: "text-red-500 text-xs mt-1", children: showError("phone") })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Email *" }), _jsx("input", { type: "email", value: fields.email, onChange: (e) => handleChange("email", e.target.value), onBlur: () => handleBlur("email"), disabled: disabled, className: inputClass("email"), placeholder: "ivan@example.com" }), showError("email") && _jsx("p", { className: "text-red-500 text-xs mt-1", children: showError("email") })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u041F\u0440\u0438\u043C\u0435\u0447\u0430\u043D\u0438\u044F" }), _jsx("textarea", { value: fields.notes, onChange: (e) => handleChange("notes", e.target.value), disabled: disabled, rows: 3, className: `w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`, placeholder: "\u041E\u0441\u043E\u0431\u044B\u0435 \u043F\u043E\u0436\u0435\u043B\u0430\u043D\u0438\u044F..." })] })] }));
}
