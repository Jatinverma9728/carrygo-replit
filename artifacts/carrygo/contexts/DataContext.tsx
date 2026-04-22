import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { makeId, makeOtp } from "@/lib/id";
import type {
  ChatMessage,
  Delivery,
  DeliveryRequest,
  Parcel,
  Trip,
} from "@/types";

const KEYS = {
  trips: "carrygo:trips",
  parcels: "carrygo:parcels",
  requests: "carrygo:requests",
  messages: "carrygo:messages",
  deliveries: "carrygo:deliveries",
};

type DataState = {
  hydrated: boolean;
  trips: Trip[];
  parcels: Parcel[];
  requests: DeliveryRequest[];
  messages: ChatMessage[];
  deliveries: Delivery[];

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

  confirmPickup: (deliveryId: string) => Promise<void>;
  confirmDelivery: (deliveryId: string, otp: string) => Promise<void>;
  markDeliveryFailed: (deliveryId: string, reason: string) => Promise<void>;

  findMatchingTrips: (parcel: Parcel) => Trip[];
  seedDemoIfEmpty: () => Promise<void>;
};

const DataCtx = createContext<DataState | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState<boolean>(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [requests, setRequests] = useState<DeliveryRequest[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);

  useEffect(() => {
    (async () => {
      const [t, p, r, m, d] = await Promise.all([
        AsyncStorage.getItem(KEYS.trips),
        AsyncStorage.getItem(KEYS.parcels),
        AsyncStorage.getItem(KEYS.requests),
        AsyncStorage.getItem(KEYS.messages),
        AsyncStorage.getItem(KEYS.deliveries),
      ]);
      if (t) setTrips(JSON.parse(t) as Trip[]);
      if (p) setParcels(JSON.parse(p) as Parcel[]);
      if (r) setRequests(JSON.parse(r) as DeliveryRequest[]);
      if (m) setMessages(JSON.parse(m) as ChatMessage[]);
      if (d) setDeliveries(JSON.parse(d) as Delivery[]);
      setHydrated(true);
    })();
  }, []);

  const persist = async <T,>(key: string, value: T) => {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  };

  const createTrip: DataState["createTrip"] = async (t) => {
    const trip: Trip = { ...t, id: makeId("trip"), createdAt: Date.now(), status: "ACTIVE" };
    const next = [trip, ...trips];
    setTrips(next);
    await persist(KEYS.trips, next);
    return trip;
  };

  const cancelTrip = async (id: string) => {
    const next = trips.map((t) => (t.id === id ? { ...t, status: "CANCELLED" as const } : t));
    setTrips(next);
    await persist(KEYS.trips, next);
  };

  const createParcel: DataState["createParcel"] = async (p) => {
    const parcel: Parcel = { ...p, id: makeId("parcel"), createdAt: Date.now(), status: "OPEN" };
    const next = [parcel, ...parcels];
    setParcels(next);
    await persist(KEYS.parcels, next);
    return parcel;
  };

  const cancelParcel = async (id: string) => {
    const next = parcels.map((p) => (p.id === id ? { ...p, status: "CANCELLED" as const } : p));
    setParcels(next);
    await persist(KEYS.parcels, next);
  };

  const createRequest: DataState["createRequest"] = async ({ parcelId, tripId, senderId, travellerId, message }) => {
    const existing = requests.find(
      (r) => r.parcelId === parcelId && r.tripId === tripId && r.status === "PENDING",
    );
    if (existing) return existing;
    const req: DeliveryRequest = {
      id: makeId("req"),
      parcelId,
      tripId,
      senderId,
      travellerId,
      status: "PENDING",
      message,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const next = [req, ...requests];
    setRequests(next);
    await persist(KEYS.requests, next);
    return req;
  };

  const acceptRequest: DataState["acceptRequest"] = async (id) => {
    const req = requests.find((r) => r.id === id);
    if (!req) throw new Error("Request not found");
    const parcel = parcels.find((p) => p.id === req.parcelId);
    if (!parcel) throw new Error("Parcel not found");

    const nextRequests = requests.map((r) =>
      r.id === id
        ? { ...r, status: "ACCEPTED" as const, updatedAt: Date.now() }
        : r.parcelId === req.parcelId && r.status === "PENDING"
          ? { ...r, status: "REJECTED" as const, updatedAt: Date.now() }
          : r,
    );
    setRequests(nextRequests);
    await persist(KEYS.requests, nextRequests);

    const nextParcels = parcels.map((p) =>
      p.id === req.parcelId ? { ...p, status: "MATCHED" as const } : p,
    );
    setParcels(nextParcels);
    await persist(KEYS.parcels, nextParcels);

    const delivery: Delivery = {
      id: makeId("dlv"),
      requestId: req.id,
      parcelId: req.parcelId,
      tripId: req.tripId,
      senderId: req.senderId,
      travellerId: req.travellerId,
      stage: "AWAITING_PICKUP",
      otp: makeOtp(),
      pricePaid: parcel.priceOffer,
      escrowReleased: false,
    };
    const nextDeliveries = [delivery, ...deliveries];
    setDeliveries(nextDeliveries);
    await persist(KEYS.deliveries, nextDeliveries);
    return delivery;
  };

  const rejectRequest = async (id: string) => {
    const next = requests.map((r) =>
      r.id === id ? { ...r, status: "REJECTED" as const, updatedAt: Date.now() } : r,
    );
    setRequests(next);
    await persist(KEYS.requests, next);
  };

  const cancelRequest = async (id: string) => {
    const next = requests.map((r) =>
      r.id === id ? { ...r, status: "CANCELLED" as const, updatedAt: Date.now() } : r,
    );
    setRequests(next);
    await persist(KEYS.requests, next);
  };

  const sendMessage: DataState["sendMessage"] = async (threadId, senderId, text) => {
    const msg: ChatMessage = {
      id: makeId("msg"),
      threadId,
      senderId,
      text,
      createdAt: Date.now(),
    };
    const next = [...messages, msg];
    setMessages(next);
    await persist(KEYS.messages, next);
    return msg;
  };

  const threadMessages = useCallback(
    (threadId: string) => messages.filter((m) => m.threadId === threadId).sort((a, b) => a.createdAt - b.createdAt),
    [messages],
  );

  const confirmPickup = async (deliveryId: string) => {
    const next = deliveries.map((d) =>
      d.id === deliveryId
        ? { ...d, stage: "IN_TRANSIT" as const, pickupConfirmedAt: Date.now() }
        : d,
    );
    setDeliveries(next);
    await persist(KEYS.deliveries, next);
  };

  const confirmDelivery: DataState["confirmDelivery"] = async (deliveryId, otp) => {
    const dlv = deliveries.find((d) => d.id === deliveryId);
    if (!dlv) throw new Error("Delivery not found");
    if (dlv.otp !== otp) throw new Error("Wrong OTP. Ask the receiver for the correct code.");
    const nextDeliveries = deliveries.map((d) =>
      d.id === deliveryId
        ? {
            ...d,
            stage: "DELIVERED" as const,
            deliveryConfirmedAt: Date.now(),
            escrowReleased: true,
          }
        : d,
    );
    setDeliveries(nextDeliveries);
    await persist(KEYS.deliveries, nextDeliveries);

    const nextParcels = parcels.map((p) =>
      p.id === dlv.parcelId ? { ...p, status: "DELIVERED" as const } : p,
    );
    setParcels(nextParcels);
    await persist(KEYS.parcels, nextParcels);
  };

  const markDeliveryFailed: DataState["markDeliveryFailed"] = async (deliveryId, reason) => {
    const dlv = deliveries.find((d) => d.id === deliveryId);
    if (!dlv) return;
    const nextDeliveries = deliveries.map((d) =>
      d.id === deliveryId
        ? { ...d, stage: "FAILED" as const, failedReason: reason }
        : d,
    );
    setDeliveries(nextDeliveries);
    await persist(KEYS.deliveries, nextDeliveries);

    const nextParcels = parcels.map((p) =>
      p.id === dlv.parcelId ? { ...p, status: "FAILED" as const } : p,
    );
    setParcels(nextParcels);
    await persist(KEYS.parcels, nextParcels);
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
    if (trips.length > 0) return;
    const now = Date.now();
    const demoTrips: Trip[] = [
      {
        id: makeId("trip"),
        travellerId: "demo_user_1",
        travellerName: "Aarav Mehta",
        travellerRating: 4.8,
        fromCity: "Mumbai",
        toCity: "Delhi",
        date: now + 2 * 24 * 60 * 60 * 1000,
        vehicle: "Flight",
        capacityKg: 5,
        notes: "Cabin baggage only.",
        createdAt: now,
        status: "ACTIVE",
      },
      {
        id: makeId("trip"),
        travellerId: "demo_user_2",
        travellerName: "Priya Shah",
        travellerRating: 4.9,
        fromCity: "Mumbai",
        toCity: "Pune",
        date: now + 1 * 24 * 60 * 60 * 1000,
        vehicle: "Car",
        capacityKg: 15,
        notes: "Driving solo, lots of room.",
        createdAt: now,
        status: "ACTIVE",
      },
      {
        id: makeId("trip"),
        travellerId: "demo_user_3",
        travellerName: "Rohan Patel",
        travellerRating: 4.7,
        fromCity: "Bangalore",
        toCity: "Hyderabad",
        date: now + 3 * 24 * 60 * 60 * 1000,
        vehicle: "Train",
        capacityKg: 8,
        notes: "Tatkal, 2AC.",
        createdAt: now,
        status: "ACTIVE",
      },
    ];
    setTrips(demoTrips);
    await persist(KEYS.trips, demoTrips);
  }, [trips.length]);

  const value = useMemo<DataState>(
    () => ({
      hydrated,
      trips,
      parcels,
      requests,
      messages,
      deliveries,
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
      confirmPickup,
      confirmDelivery,
      markDeliveryFailed,
      findMatchingTrips,
      seedDemoIfEmpty,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hydrated, trips, parcels, requests, messages, deliveries, threadMessages, findMatchingTrips, seedDemoIfEmpty],
  );

  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>;
}

export function useData(): DataState {
  const ctx = useContext(DataCtx);
  if (!ctx) throw new Error("useData must be used inside DataProvider");
  return ctx;
}
