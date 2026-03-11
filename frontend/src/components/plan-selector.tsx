import type { RoomPlan } from '../types';

interface PlanSelectorProps {
  plans: Record<string, RoomPlan>;
  selectedPlanId: string;
  onChange: (planId: string) => void;
}

export default function PlanSelector({ plans, selectedPlanId, onChange }: PlanSelectorProps) {
  const entries = Object.entries(plans);

  if (entries.length <= 1) {
    const plan = entries[0]?.[1];
    if (!plan) return null;
    return (
      <div className="text-sm text-gray-700">
        <span className="font-medium">{plan.name_ru ?? plan.name}</span>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">Тариф</label>
      <select
        value={selectedPlanId}
        onChange={(e) => onChange(e.target.value)}
        className="border border-gray-300 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {entries.map(([id, plan]) => (
          <option key={id} value={id}>
            {plan.name_ru ?? plan.name}
          </option>
        ))}
      </select>
    </div>
  );
}
