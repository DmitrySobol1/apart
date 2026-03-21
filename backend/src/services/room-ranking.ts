import { Coefficient } from "../models/Coefficient";

const DEFAULT_SCORE = 3;

export async function applyRoomRanking(
  rooms: Array<Record<string, unknown>>,
): Promise<Array<Record<string, unknown>>> {
  if (rooms.length === 0) return [];

  try {
    const coefficients = await Coefficient.find({}).lean();

    const coeffMap = new Map<string, number>();
    for (const c of coefficients) {
      coeffMap.set(
        c.bnovoId,
        (c.coefficient1 ?? 1) + (c.coefficient2 ?? 1) + (c.coefficient3 ?? 1),
      );
    }

    return rooms.map((room) => ({
      ...room,
      numToShowOnFrontend: coeffMap.get(room.id as string) ?? DEFAULT_SCORE,
    }));
  } catch (err) {
    console.error("applyRoomRanking: MongoDB error, using default scores", err);
    return rooms.map((room) => ({ ...room, numToShowOnFrontend: DEFAULT_SCORE }));
  }
}
