import { Room } from "../models/Room";
import { Coefficient } from "../models/Coefficient";
import { bnovoClient } from "./bnovo-client";

const DATE_OFFSETS = [7, 14, 21, 30, 45, 60, 75, 90, 105, 120];

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildDateRanges(): Array<{ dfrom: string; dto: string }> {
  const now = Date.now();
  return DATE_OFFSETS.map((offset) => {
    const checkin = new Date(now + offset * 86_400_000);
    const checkout = new Date(now + (offset + 2) * 86_400_000);
    return { dfrom: formatDate(checkin), dto: formatDate(checkout) };
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface BnovoRoom {
  id: string;
  name_ru: string;
}

interface BnovoRoomsResponse {
  rooms: BnovoRoom[];
}

export async function syncRooms(): Promise<void> {
  const ranges = buildDateRanges();
  const uniqueRooms = new Map<string, string>();
  let errors = 0;

  for (const { dfrom, dto } of ranges) {
    try {
      const response = await bnovoClient.getRooms(dfrom, dto);
      const data = response.data as BnovoRoomsResponse;
      const rooms = data?.rooms ?? [];

      if (rooms.length === 0) {
        console.log(`[room-sync] No rooms for ${dfrom}–${dto}, skipping`);
        continue;
      }

      for (const room of rooms) {
        if (room.id && room.name_ru) {
          uniqueRooms.set(room.id, room.name_ru);
        }
      }
    } catch (err) {
      errors++;
      console.error(`[room-sync] Error fetching rooms for ${dfrom}–${dto}:`, err instanceof Error ? err.message : err);
    }

    await delay(1000 + Math.random() * 1000);
  }

  let newRoomsCount = 0;

  for (const [bnovoId, name] of uniqueRooms) {
    const result = await Room.findOneAndUpdate(
      { bnovoId },
      { name },
      { upsert: true, new: false, lean: true },
    );

    const isNew = result === null;

    if (isNew) {
      newRoomsCount++;
      const createdRoom = await Room.findOne({ bnovoId }).lean();
      if (createdRoom) {
        await Coefficient.updateOne(
          { bnovoId },
          { $setOnInsert: { roomId: createdRoom._id, bnovoId, coefficient1: 1, coefficient2: 1, coefficient3: 1 } },
          { upsert: true },
        );
      }
    }
  }

  console.log(`[room-sync] Done. Total unique rooms: ${uniqueRooms.size}, new: ${newRoomsCount}, errors: ${errors}`);
}
