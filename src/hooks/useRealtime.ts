import { useQueryClient } from "@tanstack/react-query";
import { collection, onSnapshot } from "firebase/firestore";
import { useEffect } from "react";
import { db } from "@/lib/firebase";
import { handleFirestoreError, OperationType } from "@/lib/firestoreErrors";

const COLLECTIONS = [
  "emergencies",
  "ambulances",
  "hospitals",
  "notifications",
  "emergency_timeline",
];

/** Keeps every dashboard in sync with the shared emergency record via Firestore real-time snapshots. */
export function useRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribes = COLLECTIONS.map((collName) => {
      return onSnapshot(
        collection(db, collName),
        () => {
          queryClient.invalidateQueries();
        },
        (error) => {
          try {
            handleFirestoreError(error, OperationType.LIST, collName);
          } catch (e) {
            console.warn(`Firestore real-time subscription error on ${collName}:`, e);
          }
        },
      );
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [queryClient]);
}
