export type User = {
  id: string;
  phone: string;
  name: string;
  rating: number;
  ratingsCount: number;
  joinedAt: number;
  avatarColor: string;
};

export type VehicleType = "Bike" | "Car" | "Bus" | "Train" | "Flight";

export type Trip = {
  id: string;
  travellerId: string;
  travellerName: string;
  travellerRating: number;
  fromCity: string;
  toCity: string;
  date: number;
  vehicle: VehicleType;
  capacityKg: number;
  notes?: string;
  createdAt: number;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
};

export type ParcelCategory =
  | "Documents"
  | "Electronics"
  | "Clothing"
  | "Food"
  | "Medicine"
  | "Other";

export type Parcel = {
  id: string;
  senderId: string;
  senderName: string;
  fromCity: string;
  toCity: string;
  date: number;
  category: ParcelCategory;
  description: string;
  weightKg: number;
  priceOffer: number;
  receiverName: string;
  receiverPhone: string;
  imageUri?: string;
  createdAt: number;
  status: "OPEN" | "MATCHED" | "DELIVERED" | "CANCELLED" | "FAILED";
};

export type RequestStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";

export type DeliveryRequest = {
  id: string;
  parcelId: string;
  tripId: string;
  senderId: string;
  travellerId: string;
  status: RequestStatus;
  message?: string;
  createdAt: number;
  updatedAt: number;
};

export type ChatMessage = {
  id: string;
  threadId: string;
  senderId: string;
  text: string;
  createdAt: number;
};

export type DeliveryStage =
  | "AWAITING_PICKUP"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "FAILED";

export type Delivery = {
  id: string;
  requestId: string;
  parcelId: string;
  tripId: string;
  senderId: string;
  travellerId: string;
  stage: DeliveryStage;
  pickupConfirmedAt?: number;
  deliveryConfirmedAt?: number;
  otp: string;
  pricePaid: number;
  escrowReleased: boolean;
  failedReason?: string;
};
