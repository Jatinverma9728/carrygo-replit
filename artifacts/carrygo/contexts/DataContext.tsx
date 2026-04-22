import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { ChatMessage, Delivery, DeliveryRequest, Parcel, Trip, VehicleType, ParcelCategory } from "@/types";

type ApiUser = {
  id: string; phone: string; name: string; avatarColor: string;
  rating: number; ratingsCount: number; joinedAt: string;
};
type ApiTrip = {
  id: string; travellerId: string; travellerName: string; travellerRating: number;
  travellerAvatarColor?: string;
  fromCity: string; toCity: string; date: string; vehicle: VehicleType; capacityKg: number;
  notes?: string | null; status: Trip["status"]; createdAt: string;
};
type ApiParcel = {
  id: string; senderId: string; senderName: string; senderAvatarColor?: string;
  fromCity: string; toCity: string; date: string; category: ParcelCategory;
  description: string; weightKg: number; priceOffer: number;
  receiverName: string; receiverPhone: string; imageUri?: string | null;
  status: Parcel["status"]; createdAt: string;
};
type ApiRequest = {
  id: string; parcelId: string; tripId: string; senderId: string; travellerId: string;
  status: DeliveryRequest["status"]; message?: string | null;
  createdAt: string; updatedAt: string;
  parcel: ApiParcel; trip: ApiTrip; sender: ApiUser; traveller: ApiUser;
};
type ApiDelivery = {
  id: string; requestId: string; parcelId: string; tripId: string;
  senderId: string; travellerId: string; stage: Delivery["stage"];
  pickupConfirmedAt?: string | null; deliveryConfirmedAt?: string | null;
  otp: string; pricePaid: number; escrowReleased: boolean;
  failedReason?: string | null; senderRated: boolean; travellerRated: boolean;
  parcel: ApiParcel; trip: ApiTrip; sender: ApiUser; traveller: ApiUser;
};
type ApiMessage = {
  id: string; threadId: string; senderId: string; recipientId: string;
  text: string; readAt?: string | null; createdAt: string;
};

const ts = (s: string | null | undefined): number => (s ? Date.parse(s) : 0);

function tripFromApi(t: ApiTrip): Trip {
  return {
    id: t.id,
    travellerId: t.travellerId,
    travellerName: t.travellerName,
    travellerRating: t.travellerRating,
    fromCity: t.fromCity,
    toCity: t.toCity,
    date: ts(t.date),
    vehicle: t.vehicle,
    capacityKg: t.capacityKg,
    notes: t.notes ?? undefined,
    createdAt: ts(t.createdAt),
    status: t.status,
  };
}
function parcelFromApi(p: ApiParcel): Parcel {
  return {
    id: p.id,
    senderId: p.senderId,
    senderName: p.senderName,
    fromCity: p.fromCity,
    toCity: p.toCity,
    date: ts(p.date),
    category: p.category,
    description: p.description,
    weightKg: p.weightKg,
    priceOffer: p.priceOffer,
    receiverName: p.receiverName,
    receiverPhone: p.receiverPhone,
    imageUri: p.imageUri ?? undefined,
    createdAt: ts(p.createdAt),
    status: p.status,
  };
}
function requestFromApi(r: ApiRequest): DeliveryRequest {
  return {
    id: r.id,
    parcelId: r.parcelId,
    tripId: r.tripId,
    senderId: r.senderId,
    travellerId: r.travellerId,
    status: r.status,
    message: r.message ?? undefined,
    createdAt: ts(r.createdAt),
    updatedAt: ts(r.updatedAt),
  };
}
function deliveryFromApi(d: ApiDelivery): Delivery {
  return {
    id: d.id,
    requestId: d.requestId,
    parcelId: d.parcelId,
    tripId: d.tripId,
    senderId: d.senderId,
    travellerId: d.travellerId,
    stage: d.stage,
    pickupConfirmedAt: d.pickupConfirmedAt ? ts(d.pickupConfirmedAt) : undefined,
    deliveryConfirmedAt: d.deliveryConfirmedAt ? ts(d.deliveryConfirmedAt) : undefined,
    otp: d.otp,
    pricePaid: d.pricePaid,
    escrowReleased: d.escrowReleased,
    failedReason: d.failedReason ?? undefined,
  };
}
function messageFromApi(m: ApiMessage): ChatMessage {
  return {
    id: m.id,
    threadId: m.threadId,
    senderId: m.senderId,
    text: m.text,
    createdAt: ts(m.createdAt),
  };
}

type DataState = {
  hydrated: boolean;
  trips: Trip[];
  parcels: Parcel[];
  requests: DeliveryRequest[];
  messages: ChatMessage[];
  deliveries: Delivery[];

  refresh: () => Promise<void>;

  createTrip: (t: Omit<Trip, "id" | "createdAt" | "status">) => Promise<Trip>;
  cancelTrip: (id: string) => Promise<void>;

  createParcel: (p: Omit<Parcel, "id" | "createdAt" | "status">) => Promise<Parcel>;
  cancelParcel: (id: string) => Promise<void>;

  createRequest: (r: { parcelId: string; tripId: string; senderId: string; travellerId: string; message?: string }) => Promise<DeliveryRequest>;
  acceptRequest: (id: string) => Promise<Delivery>;
  rejectRequest: (id: string) => Promise<void>;
  cancelRequest: (id: string) => Promise<void>;

  sendMessage: (threadId: string, senderId: string, text: string) => Promise<ChatMessage>;
  threadMessages: (threadId: string) => ChatMessage[];
  loadThreadMessages: (threadId: string) => Promise<void>;
  markThreadRead: (threadId: string) => Promise<void>;

  confirmPickup: (deliveryId: string) => Promise<void>;
  confirmDelivery: (deliveryId: string, otp: string) => Promise<void>;
  markDeliveryFailed: (deliveryId: string, reason: string) => Promise<void>;
  rateDelivery: (deliveryId: string, stars: number, comment?: string) => Promise<void>;

  findMatchingTrips: (parcel: Parcel) => Trip[];
  seedDemoIfEmpty: () => Promise<void>;
};

const DataCtx = createContext<DataState | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [hydrated, setHydrated] = useState<boolean>(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [requests, setRequests] = useState<DeliveryRequest[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);

  const refresh = useCallback(async () => {
    try {
      const [tripsRes, parcelsRes, requestsRes, deliveriesRes] = await Promise.all([
        apiFetch<ApiTrip[]>("GET", "/api/trips"),
        user ? apiFetch<ApiParcel[]>("GET", "/api/parcels?mine=true").catch(() => [] as ApiParcel[]) : Promise.resolve([] as ApiParcel[]),
        user ? apiFetch<ApiRequest[]>("GET", "/api/requests").catch(() => [] as ApiRequest[]) : Promise.resolve([] as ApiRequest[]),
        user ? apiFetch<ApiDelivery[]>("GET", "/api/deliveries").catch(() => [] as ApiDelivery[]) : Promise.resolve([] as ApiDelivery[]),
      ]);
      setTrips(tripsRes.map(tripFromApi));
      setParcels(parcelsRes.map(parcelFromApi));
      // Also include parcels embedded in requests/deliveries (for chat lookups)
      const extraParcels: Parcel[] = [];
      const extraTrips: Trip[] = [];
      for (const r of requestsRes) {
        extraParcels.push(parcelFromApi(r.parcel));
        extraTrips.push(tripFromApi(r.trip));
      }
      for (const d of deliveriesRes) {
        extraParcels.push(parcelFromApi(d.parcel));
        extraTrips.push(tripFromApi(d.trip));
      }
      setParcels((cur) => mergeById(cur.concat(extraParcels)));
      setTrips((cur) => mergeById(cur.concat(extraTrips)));
      setRequests(requestsRes.map(requestFromApi));
      setDeliveries(deliveriesRes.map(deliveryFromApi));
    } finally {
      setHydrated(true);
    }
  }, [user]);

  useEffect(() => {
    refresh();
    if (!user) return;
    const interval = setInterval(() => {
      refresh().catch(() => {});
    }, 12000);
    return () => clearInterval(interval);
  }, [refresh, user]);

  const createTrip: DataState["createTrip"] = async (t) => {
    const res = await apiFetch<ApiTrip>("POST", "/api/trips", {
      fromCity: t.fromCity,
      toCity: t.toCity,
      date: new Date(t.date).toISOString(),
      vehicle: t.vehicle,
      capacityKg: t.capacityKg,
      notes: t.notes,
    });
    const trip = tripFromApi(res);
    setTrips((cur) => mergeById([trip, ...cur]));
    return trip;
  };

  const cancelTrip = async (id: string) => {
    const res = await apiFetch<ApiTrip>("POST", `/api/trips/${id}/cancel`);
    setTrips((cur) => cur.map((t) => (t.id === id ? tripFromApi(res) : t)));
  };

  const createParcel: DataState["createParcel"] = async (p) => {
    const res = await apiFetch<ApiParcel>("POST", "/api/parcels", {
      fromCity: p.fromCity,
      toCity: p.toCity,
      date: new Date(p.date).toISOString(),
      category: p.category,
      description: p.description,
      weightKg: p.weightKg,
      priceOffer: p.priceOffer,
      receiverName: p.receiverName,
      receiverPhone: p.receiverPhone,
      imageUri: p.imageUri,
    });
    const parcel = parcelFromApi(res);
    setParcels((cur) => mergeById([parcel, ...cur]));
    return parcel;
  };

  const cancelParcel = async (id: string) => {
    const res = await apiFetch<ApiParcel>("POST", `/api/parcels/${id}/cancel`);
    setParcels((cur) => cur.map((p) => (p.id === id ? parcelFromApi(res) : p)));
  };

  const createRequest: DataState["createRequest"] = async ({ parcelId, tripId, message }) => {
    const res = await apiFetch<ApiRequest>("POST", "/api/requests", { parcelId, tripId, message });
    const req = requestFromApi(res);
    setRequests((cur) => mergeByIdReq([req, ...cur]));
    return req;
  };

  const acceptRequest: DataState["acceptRequest"] = async (id) => {
    const res = await apiFetch<ApiDelivery>("POST", `/api/requests/${id}/accept`);
    const delivery = deliveryFromApi(res);
    setDeliveries((cur) => mergeByIdDlv([delivery, ...cur]));
    setRequests((cur) =>
      cur.map((r) =>
        r.id === id
          ? { ...r, status: "ACCEPTED", updatedAt: Date.now() }
          : r.parcelId === delivery.parcelId && r.status === "PENDING"
          ? { ...r, status: "REJECTED", updatedAt: Date.now() }
          : r,
      ),
    );
    setParcels((cur) =>
      cur.map((p) => (p.id === delivery.parcelId ? { ...p, status: "MATCHED" } : p)),
    );
    return delivery;
  };

  const rejectRequest = async (id: string) => {
    await apiFetch("POST", `/api/requests/${id}/reject`);
    setRequests((cur) => cur.map((r) => (r.id === id ? { ...r, status: "REJECTED", updatedAt: Date.now() } : r)));
  };

  const cancelRequest = async (id: string) => {
    await apiFetch("POST", `/api/requests/${id}/cancel`);
    setRequests((cur) => cur.map((r) => (r.id === id ? { ...r, status: "CANCELLED", updatedAt: Date.now() } : r)));
  };

  const loadThreadMessages = async (threadId: string) => {
    try {
      const res = await apiFetch<ApiMessage[]>("GET", `/api/chats/${threadId}/messages`);
      const msgs = res.map(messageFromApi);
      setMessages((cur) => {
        const remaining = cur.filter((m) => m.threadId !== threadId);
        return [...remaining, ...msgs];
      });
    } catch (e) {
      if (!(e instanceof ApiError) || e.status !== 404) throw e;
    }
  };

  const markThreadRead = async (threadId: string) => {
    try {
      await apiFetch("POST", `/api/chats/${threadId}/read`);
    } catch {
      /* ignore */
    }
  };

  const sendMessage: DataState["sendMessage"] = async (threadId, _senderId, text) => {
    const res = await apiFetch<ApiMessage>("POST", `/api/chats/${threadId}/messages`, { text });
    const msg = messageFromApi(res);
    setMessages((cur) => [...cur, msg]);
    return msg;
  };

  const threadMessages = useCallback(
    (threadId: string) =>
      messages.filter((m) => m.threadId === threadId).sort((a, b) => a.createdAt - b.createdAt),
    [messages],
  );

  const confirmPickup = async (deliveryId: string) => {
    const res = await apiFetch<ApiDelivery>("POST", `/api/deliveries/${deliveryId}/pickup`);
    const dlv = deliveryFromApi(res);
    setDeliveries((cur) => cur.map((d) => (d.id === deliveryId ? dlv : d)));
  };

  const confirmDelivery: DataState["confirmDelivery"] = async (deliveryId, otp) => {
    const res = await apiFetch<ApiDelivery>("POST", `/api/deliveries/${deliveryId}/handoff`, { otp });
    const dlv = deliveryFromApi(res);
    setDeliveries((cur) => cur.map((d) => (d.id === deliveryId ? dlv : d)));
    setParcels((cur) => cur.map((p) => (p.id === dlv.parcelId ? { ...p, status: "DELIVERED" } : p)));
  };

  const markDeliveryFailed: DataState["markDeliveryFailed"] = async (deliveryId, reason) => {
    const res = await apiFetch<ApiDelivery>("POST", `/api/deliveries/${deliveryId}/fail`, { reason });
    const dlv = deliveryFromApi(res);
    setDeliveries((cur) => cur.map((d) => (d.id === deliveryId ? dlv : d)));
    setParcels((cur) => cur.map((p) => (p.id === dlv.parcelId ? { ...p, status: "FAILED" } : p)));
  };

  const rateDelivery = async (deliveryId: string, stars: number, comment?: string) => {
    const res = await apiFetch<ApiDelivery>("POST", `/api/deliveries/${deliveryId}/rate`, { stars, comment });
    const dlv = deliveryFromApi(res);
    setDeliveries((cur) => cur.map((d) => (d.id === deliveryId ? dlv : d)));
  };

  const findMatchingTrips: DataState["findMatchingTrips"] = useCallback(
    (parcel) => {
      const oneDay = 24 * 60 * 60 * 1000;
      return trips
        .filter(
          (t) =>
            t.status === "ACTIVE" &&
            t.fromCity.trim().toLowerCase() === parcel.fromCity.trim().toLowerCase() &&
            t.toCity.trim().toLowerCase() === parcel.toCity.trim().toLowerCase() &&
            Math.abs(t.date - parcel.date) <= 2 * oneDay,
        )
        .sort((a, b) => Math.abs(a.date - parcel.date) - Math.abs(b.date - parcel.date));
    },
    [trips],
  );

  const seedDemoIfEmpty = useCallback(async () => {
    // No-op: demo trips are seeded server-side on first launch.
  }, []);

  const value = useMemo<DataState>(
    () => ({
      hydrated,
      trips,
      parcels,
      requests,
      messages,
      deliveries,
      refresh,
      createTrip,
      cancelTrip,
      createParcel,
      cancelParcel,
      createRequest,
      acceptRequest,
      rejectRequest,
      cancelRequest,
      sendMessage,
      threadMessages,
      loadThreadMessages,
      markThreadRead,
      confirmPickup,
      confirmDelivery,
      markDeliveryFailed,
      rateDelivery,
      findMatchingTrips,
      seedDemoIfEmpty,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hydrated, trips, parcels, requests, messages, deliveries, threadMessages, findMatchingTrips, seedDemoIfEmpty, refresh],
  );

  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>;
}

function mergeById<T extends { id: string; createdAt: number }>(rows: T[]): T[] {
  const map = new Map<string, T>();
  for (const r of rows) map.set(r.id, r);
  return [...map.values()].sort((a, b) => b.createdAt - a.createdAt);
}
function mergeByIdReq(rows: DeliveryRequest[]): DeliveryRequest[] {
  const map = new Map<string, DeliveryRequest>();
  for (const r of rows) map.set(r.id, r);
  return [...map.values()].sort((a, b) => b.createdAt - a.createdAt);
}
function mergeByIdDlv(rows: Delivery[]): Delivery[] {
  const map = new Map<string, Delivery>();
  for (const r of rows) map.set(r.id, r);
  return [...map.values()];
}

export function useData(): DataState {
  const ctx = useContext(DataCtx);
  if (!ctx) throw new Error("useData must be used inside DataProvider");
  return ctx;
}
