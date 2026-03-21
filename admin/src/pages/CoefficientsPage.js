import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useCallback } from 'react';
import { Alert, Box, Button, Paper, Skeleton, Snackbar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, } from '@mui/material';
import { getCoefficients, patchCoefficient } from '../api/client';
const COEF_KEYS = ['coefficient1', 'coefficient2', 'coefficient3'];
function makeCellState(value) {
    return { value: value.toFixed(2), status: 'idle', error: '' };
}
function makeRowState(coef) {
    return {
        coefficient1: makeCellState(coef.coefficient1),
        coefficient2: makeCellState(coef.coefficient2),
        coefficient3: makeCellState(coef.coefficient3),
    };
}
function buildTableState(coefficients) {
    const state = {};
    for (const coef of coefficients) {
        state[coef.bnovoId] = makeRowState(coef);
    }
    return state;
}
function parseValue(raw) {
    const normalized = raw.trim().replace(',', '.');
    const num = parseFloat(normalized);
    if (isNaN(num) || num <= 0)
        return null;
    return num;
}
export default function CoefficientsPage() {
    const [coefficients, setCoefficients] = useState([]);
    const [tableState, setTableState] = useState({});
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
    });
    const load = useCallback(async () => {
        setLoading(true);
        setLoadError(false);
        try {
            const data = await getCoefficients();
            const sorted = [...data].sort((a, b) => a.roomName.localeCompare(b.roomName, 'ru'));
            setCoefficients(sorted);
            setTableState(buildTableState(sorted));
        }
        catch {
            setLoadError(true);
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        load();
    }, [load]);
    function updateCell(bnovoId, key, partial) {
        setTableState((prev) => ({
            ...prev,
            [bnovoId]: {
                ...prev[bnovoId],
                [key]: { ...prev[bnovoId][key], ...partial },
            },
        }));
    }
    function handleChange(bnovoId, key, value) {
        updateCell(bnovoId, key, { value, error: '' });
    }
    async function handleBlur(bnovoId, key, originalValue) {
        const cell = tableState[bnovoId]?.[key];
        if (!cell)
            return;
        const normalized = cell.value.trim().replace(',', '.');
        if (normalized === originalValue.toFixed(2) || parseFloat(normalized) === originalValue) {
            return;
        }
        const num = parseValue(cell.value);
        if (num === null) {
            updateCell(bnovoId, key, { error: 'Введите положительное число' });
            return;
        }
        try {
            await patchCoefficient(bnovoId, { [key]: num });
            setCoefficients((prev) => prev.map((c) => (c.bnovoId === bnovoId ? { ...c, [key]: num } : c)));
            updateCell(bnovoId, key, { value: num.toFixed(2), status: 'success', error: '' });
            setTimeout(() => updateCell(bnovoId, key, { status: 'idle' }), 1500);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Ошибка при сохранении. Попробуйте снова.';
            updateCell(bnovoId, key, { status: 'error' });
            setSnackbar({ open: true, message });
            setTimeout(() => updateCell(bnovoId, key, { status: 'idle' }), 1500);
        }
    }
    function cellBg(status) {
        if (status === 'success')
            return 'rgba(76, 175, 80, 0.2)';
        if (status === 'error')
            return 'rgba(244, 67, 54, 0.2)';
        return undefined;
    }
    if (loading) {
        return (_jsxs(Box, { sx: { p: 3 }, children: [_jsx(Skeleton, { variant: "rectangular", height: 48, sx: { mb: 1 } }), Array.from({ length: 5 }).map((_, i) => (_jsx(Skeleton, { variant: "rectangular", height: 56, sx: { mb: 0.5 } }, i)))] }));
    }
    if (loadError) {
        return (_jsxs(Box, { sx: { p: 3, textAlign: 'center' }, children: [_jsx(Typography, { color: "error", gutterBottom: true, children: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0434\u0430\u043D\u043D\u044B\u0435." }), _jsx(Button, { variant: "contained", onClick: load, children: "\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C" })] }));
    }
    return (_jsxs(Box, { sx: { p: 3 }, children: [_jsx(Typography, { variant: "h5", gutterBottom: true, children: "\u041A\u043E\u044D\u0444\u0444\u0438\u0446\u0438\u0435\u043D\u0442\u044B \u043D\u043E\u043C\u0435\u0440\u043E\u0432" }), _jsx(TableContainer, { component: Paper, children: _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435" }), _jsx(TableCell, { children: "\u041A\u043E\u044D\u0444. 1" }), _jsx(TableCell, { children: "\u041A\u043E\u044D\u0444. 2" }), _jsx(TableCell, { children: "\u041A\u043E\u044D\u0444. 3" })] }) }), _jsx(TableBody, { children: coefficients.map((coef) => {
                                const row = tableState[coef.bnovoId];
                                if (!row)
                                    return null;
                                return (_jsxs(TableRow, { children: [_jsx(TableCell, { children: coef.roomName }), COEF_KEYS.map((key, idx) => {
                                            const originalValues = [coef.coefficient1, coef.coefficient2, coef.coefficient3];
                                            const cell = row[key];
                                            return (_jsx(TableCell, { sx: { transition: 'background 0.5s', background: cellBg(cell.status) }, children: _jsx(TextField, { size: "small", value: cell.value, error: !!cell.error, helperText: cell.error, onChange: (e) => handleChange(coef.bnovoId, key, e.target.value), onBlur: () => handleBlur(coef.bnovoId, key, originalValues[idx]), inputProps: { style: { width: 80 } } }) }, key));
                                        })] }, coef.bnovoId));
                            }) })] }) }), _jsx(Snackbar, { open: snackbar.open, autoHideDuration: 4000, onClose: () => setSnackbar((s) => ({ ...s, open: false })), anchorOrigin: { vertical: 'bottom', horizontal: 'center' }, children: _jsx(Alert, { severity: "error", onClose: () => setSnackbar((s) => ({ ...s, open: false })), children: snackbar.message }) })] }));
}
