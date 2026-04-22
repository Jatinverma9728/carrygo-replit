import type { UserRow, TripRow, ParcelRow, RequestRow, DeliveryRow, MessageRow, NotificationRow } from "@workspace/db";

export function serializeUser(u: UserRow) {
  return {
    id: u.id,
    phone: u.phone,
    name: u.name,
    avatarColor: u.avatarColor,
    rating: Number(u.rating ?? 5),
    ratingsCount: u.ratingsCount,
    joinedAt: u.joinedAt.toISOString(),
  };
}

export function serializeTrip(t: TripRow, traveller: UserRow) {
  return {
    id: t.id,
    travellerId: t.travellerId,
    travellerName: traveller.name,
    travellerRating: Number(traveller.rating ?? 5),
    travellerAvatarColor: traveller.avatarColor,
    fromCity: t.fromCity,
    toCity: t.toCity,
    date: t.date.toISOString(),
    vehicle: t.vehicle,
    capacityKg: Number(t.capacityKg),
    notes: t.notes,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
  };
}

export function serializeParcel(p: ParcelRow, sender: UserRow) {
  return {
    id: p.id,
    senderId: p.senderId,
    senderName: sender.name,
    senderAvatarColor: sender.avatarColor,
    fromCity: p.fromCity,
    toCity: p.toCity,
    date: p.date.toISOString(),
    category: p.category,
    description: p.description,
    weightKg: Number(p.weightKg),
    priceOffer: p.priceOffer,
    receiverName: p.receiverName,
    receiverPhone: p.receiverPhone,
    imageUri: p.imageUri,
    status: p.status,
    createdAt: p.createdAt.toISOString(),
  };
}

export function serializeRequest(
  r: RequestRow,
  parcel: ParcelRow,
  trip: TripRow,
  sender: UserRow,
  traveller: UserRow,
) {
  return {
    id: r.id,
    parcelId: r.parcelId,
    tripId: r.tripId,
    senderId: r.senderId,
    travellerId: r.travellerId,
    status: r.status,
    message: r.message,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    parcel: serializeParcel(parcel, sender),
    trip: serializeTrip(trip, traveller),
    sender: serializeUser(sender),
    traveller: serializeUser(traveller),
  };
}

export function serializeDelivery(
  d: DeliveryRow,
  parcel: ParcelRow,
  trip: TripRow,
  sender: UserRow,
  traveller: UserRow,
  viewerId: string,
) {
  // Hide OTP from anyone other than the sender (the receiver-side knows it).
  const otp = viewerId === d.senderId ? d.otp : "";
  return {
    id: d.id,
    requestId: d.requestId,
    parcelId: d.parcelId,
    tripId: d.tripId,
    senderId: d.senderId,
    travellerId: d.travellerId,
    stage: d.stage,
    pickupConfirmedAt: d.pickupConfirmedAt?.toISOString() ?? null,
    deliveryConfirmedAt: d.deliveryConfirmedAt?.toISOString() ?? null,
    otp,
    pricePaid: d.pricePaid,
    escrowReleased: d.escrowReleased,
    failedReason: d.failedReason,
    senderRated: d.senderRated,
    travellerRated: d.travellerRated,
    parcel: serializeParcel(parcel, sender),
    trip: serializeTrip(trip, traveller),
    sender: serializeUser(sender),
    traveller: serializeUser(traveller),
  };
}

export function serializeMessage(m: MessageRow) {
  return {
    id: m.id,
    threadId: m.threadId,
    senderId: m.senderId,
    recipientId: m.recipientId,
    text: m.text,
    readAt: m.readAt?.toISOString() ?? null,
    createdAt: m.createdAt.toISOString(),
  };
}

export function serializeNotification(n: NotificationRow) {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    data: n.data,
    read: !!n.readAt,
    createdAt: n.createdAt.toISOString(),
  };
}
