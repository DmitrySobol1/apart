import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
export default function PhotoGallery({ photos }) {
    const sorted = [...photos].sort((a, b) => a.order - b.order);
    const [index, setIndex] = useState(0);
    if (sorted.length === 0) {
        return (_jsx("div", { className: "w-64 h-48 bg-gray-200 flex items-center justify-center rounded-lg shrink-0", children: _jsx("span", { className: "text-gray-400 text-sm", children: "No photos" }) }));
    }
    const prev = () => setIndex((i) => (i - 1 + sorted.length) % sorted.length);
    const next = () => setIndex((i) => (i + 1) % sorted.length);
    return (_jsxs("div", { className: "relative w-64 h-48 shrink-0 rounded-lg overflow-hidden group", children: [_jsx("img", { src: sorted[index].url, alt: "", className: "w-full h-full object-cover" }), sorted.length > 1 && (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", onClick: prev, className: "absolute left-1 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity", children: "\u2039" }), _jsx("button", { type: "button", onClick: next, className: "absolute right-1 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity", children: "\u203A" }), _jsx("div", { className: "absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1", children: sorted.map((_, i) => (_jsx("span", { className: `block w-1.5 h-1.5 rounded-full ${i === index ? "bg-white" : "bg-white/50"}` }, i))) })] }))] }));
}
