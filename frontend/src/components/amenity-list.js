import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function AmenityList({ amenityIds, definitions }) {
    const items = Object.entries(amenityIds)
        .map(([id, data]) => {
        const def = definitions[id];
        if (!def)
            return null;
        const label = def.type === "int" && data.value
            ? `${def.name_ru}: ${data.value}${def.unit === "m2" ? " м²" : ""}`
            : def.name_ru;
        return { id, label, icon: def.icon };
    })
        .filter((item) => item !== null);
    if (items.length === 0)
        return null;
    return (_jsx("div", { className: "flex flex-wrap gap-2", children: items.map((item) => (_jsxs("div", { className: "relative group flex items-center gap-1", children: [item.icon ? (_jsx("img", { src: item.icon, alt: "", className: "w-4 h-4 opacity-60" })) : (_jsx("span", { className: "w-4 h-4 bg-gray-300 rounded-sm inline-block" })), _jsx("span", { className: "text-xs text-gray-600", children: item.label })] }, item.id))) }));
}
