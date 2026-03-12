import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function PlanSelector({ plans, selectedPlanId, onChange }) {
    const entries = Object.entries(plans);
    if (entries.length <= 1) {
        const plan = entries[0]?.[1];
        if (!plan)
            return null;
        return (_jsx("div", { className: "text-sm text-gray-700", children: _jsx("span", { className: "font-medium", children: plan.name_ru ?? plan.name }) }));
    }
    return (_jsxs("div", { children: [_jsx("label", { className: "block text-xs text-gray-500 mb-1", children: "\u0422\u0430\u0440\u0438\u0444" }), _jsx("select", { value: selectedPlanId, onChange: (e) => onChange(e.target.value), className: "border border-gray-300 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-500", children: entries.map(([id, plan]) => (_jsx("option", { value: id, children: plan.name_ru ?? plan.name }, id))) })] }));
}
