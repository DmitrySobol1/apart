export interface RoomPhoto {
  id: number;
  order: number;
  url: string;
  thumb: string;
  original_url: string;
  roomtype_id: string;
}

export interface RoomPlan {
  id: number;
  name: string;
  name_ru: string | null;
  cancellation_rules: string;
  enabled: number;
  prices: Record<string, string>;
  price: number;
}

export interface Room {
  id: string;
  name: string;
  name_ru: string;
  description: string;
  description_ru: string;
  adults: number;
  children: number;
  available: number;
  order: number;
  photos: RoomPhoto[];
  amenities: Record<string, { value: string }>;
  plans: Record<string, RoomPlan>;
}

export interface AmenityDefinition {
  name_ru: string;
  name_en: string;
  type: 'bool' | 'int';
  unit: string;
  icon: string;
}

export interface AmenityGroup {
  name_ru: string;
  amenities: Record<string, AmenityDefinition>;
}

export interface Amenity {
  id: string;
  name_ru: string;
  name_en: string;
  type: 'bool' | 'int';
  unit: string;
  icon: string;
}

export interface GuestData {
  name: string;
  surname: string;
  phone: string;
  email: string;
  notes: string;
}

export interface SearchParams {
  dfrom: string;
  dto: string;
  adults: number;
}

export interface BookingRequest {
  dfrom: string;
  dto: string;
  planId: number;
  adults: number;
  roomTypeId: string;
  guest: GuestData;
}

export interface BookingResponse {
  success: boolean;
  message: string;
}
