import { useEffect, useState, useCallback } from 'react';
import {
  Alert,
  Box,
  Button,
  Paper,
  Skeleton,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { getCoefficients, patchCoefficient } from '../api/client';
import type { Coefficient } from '../types';

type CoefKey = 'coefficient1' | 'coefficient2' | 'coefficient3';
type CellStatus = 'idle' | 'success' | 'error';

interface CellState {
  value: string;
  status: CellStatus;
  error: string;
}

type RowState = Record<CoefKey, CellState>;
type TableState = Record<number, RowState>;

const COEF_KEYS: CoefKey[] = ['coefficient1', 'coefficient2', 'coefficient3'];

function makeCellState(value: number): CellState {
  return { value: value.toFixed(2), status: 'idle', error: '' };
}

function makeRowState(coef: Coefficient): RowState {
  return {
    coefficient1: makeCellState(coef.coefficient1),
    coefficient2: makeCellState(coef.coefficient2),
    coefficient3: makeCellState(coef.coefficient3),
  };
}

function buildTableState(coefficients: Coefficient[]): TableState {
  const state: TableState = {};
  for (const coef of coefficients) {
    state[coef.bnovoId] = makeRowState(coef);
  }
  return state;
}

function parseValue(raw: string): number | null {
  const normalized = raw.trim().replace(',', '.');
  const num = parseFloat(normalized);
  if (isNaN(num) || num <= 0) return null;
  return num;
}

export default function CoefficientsPage() {
  const [coefficients, setCoefficients] = useState<Coefficient[]>([]);
  const [tableState, setTableState] = useState<TableState>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
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
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function updateCell(bnovoId: number, key: CoefKey, partial: Partial<CellState>) {
    setTableState((prev) => ({
      ...prev,
      [bnovoId]: {
        ...prev[bnovoId],
        [key]: { ...prev[bnovoId][key], ...partial },
      },
    }));
  }

  function handleChange(bnovoId: number, key: CoefKey, value: string) {
    updateCell(bnovoId, key, { value, error: '' });
  }

  async function handleBlur(bnovoId: number, key: CoefKey, originalValue: number) {
    const cell = tableState[bnovoId]?.[key];
    if (!cell) return;

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
      setCoefficients((prev) =>
        prev.map((c) => (c.bnovoId === bnovoId ? { ...c, [key]: num } : c)),
      );
      updateCell(bnovoId, key, { value: num.toFixed(2), status: 'success', error: '' });
      setTimeout(() => updateCell(bnovoId, key, { status: 'idle' }), 1500);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Ошибка при сохранении. Попробуйте снова.';
      updateCell(bnovoId, key, { status: 'error' });
      setSnackbar({ open: true, message });
      setTimeout(() => updateCell(bnovoId, key, { status: 'idle' }), 1500);
    }
  }

  function cellBg(status: CellStatus) {
    if (status === 'success') return 'rgba(76, 175, 80, 0.2)';
    if (status === 'error') return 'rgba(244, 67, 54, 0.2)';
    return undefined;
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={48} sx={{ mb: 1 }} />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={56} sx={{ mb: 0.5 }} />
        ))}
      </Box>
    );
  }

  if (loadError) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error" gutterBottom>
          Не удалось загрузить данные.
        </Typography>
        <Button variant="contained" onClick={load}>
          Повторить
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Коэффициенты номеров
      </Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Название</TableCell>
              <TableCell>Коэф. 1</TableCell>
              <TableCell>Коэф. 2</TableCell>
              <TableCell>Коэф. 3</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {coefficients.map((coef) => {
              const row = tableState[coef.bnovoId];
              if (!row) return null;
              return (
                <TableRow key={coef.bnovoId}>
                  <TableCell>{coef.roomName}</TableCell>
                  {COEF_KEYS.map((key, idx) => {
                    const originalValues = [coef.coefficient1, coef.coefficient2, coef.coefficient3];
                    const cell = row[key];
                    return (
                      <TableCell
                        key={key}
                        sx={{ transition: 'background 0.5s', background: cellBg(cell.status) }}
                      >
                        <TextField
                          size="small"
                          value={cell.value}
                          error={!!cell.error}
                          helperText={cell.error}
                          onChange={(e) => handleChange(coef.bnovoId, key, e.target.value)}
                          onBlur={() => handleBlur(coef.bnovoId, key, originalValues[idx])}
                          inputProps={{ style: { width: 80 } }}
                        />
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
