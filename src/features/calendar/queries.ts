import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createEvent,
  deleteEvent,
  listMonthEvents,
  updateEvent,
} from "./services/events"
import type { EventInput } from "./type"

export const eventKeys = {
  all: ["events"] as const,
  month: (ym: string) => ["events", ym] as const,
}

export function useMonthEvents(ym: string) {
  return useQuery({
    queryKey: eventKeys.month(ym),
    queryFn: () => listMonthEvents(ym),
  })
}

function useEventMutation<V>(fn: (v: V) => Promise<unknown>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSettled: () => qc.invalidateQueries({ queryKey: eventKeys.all }),
  })
}

export const useAddEvent = () => useEventMutation(createEvent)

export const useUpdateEvent = () =>
  useEventMutation(({ id, ...data }: { id: string } & Partial<EventInput>) =>
    updateEvent(id, data),
  )

export const useDeleteEvent = () => useEventMutation(deleteEvent)
