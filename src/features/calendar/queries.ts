import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { pb } from "@/lib/pb"
import type { CalEvent } from "./type"

export const eventKeys = { all: ["events"] as const, month: (ym: string) => ["events", ym] as const }

export type EventInput = Pick<CalEvent, "title" | "date" | "time" | "memo">

export function useMonthEvents(ym: string) {
  return useQuery({
    queryKey: eventKeys.month(ym),
    queryFn: () =>
      pb.collection("events").getFullList<CalEvent>({
        filter: pb.filter("date ~ {:p}", { p: `${ym}-%` }),
        sort: "date,time",
      }),
  })
}

function useEventMutation<V>(fn: (v: V) => Promise<unknown>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSettled: () => qc.invalidateQueries({ queryKey: eventKeys.all }),
  })
}

export const useAddEvent = () =>
  useEventMutation((v: EventInput) => pb.collection("events").create({ ...v, user: pb.authStore.record?.id }))

export const useUpdateEvent = () =>
  useEventMutation(({ id, ...data }: { id: string } & Partial<EventInput>) =>
    pb.collection("events").update(id, data),
  )

export const useDeleteEvent = () => useEventMutation((id: string) => pb.collection("events").delete(id))
