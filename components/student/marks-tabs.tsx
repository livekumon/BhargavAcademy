"use client"

import type { ReactNode } from "react"
import { History, PenLine } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

/**
 * Reading marks and logging them are different jobs, so they get separate tabs.
 * Panels stay mounted so a half-filled exam line survives a quick look at history.
 */
export function MarksTabs({
  defaultTab,
  historyCount,
  history,
  log,
}: {
  defaultTab: "history" | "log"
  historyCount: number
  history: ReactNode
  log: ReactNode
}) {
  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList aria-label="Marks">
        <TabsTrigger value="history" className="min-h-10">
          <History aria-hidden="true" />
          Your marks
          <span className="tabular opacity-80">{historyCount}</span>
        </TabsTrigger>
        <TabsTrigger value="log" className="min-h-10">
          <PenLine aria-hidden="true" />
          Log an exam
        </TabsTrigger>
      </TabsList>
      <TabsContent value="history" forceMount className="data-[state=inactive]:hidden">
        {history}
      </TabsContent>
      <TabsContent value="log" forceMount className="data-[state=inactive]:hidden">
        {log}
      </TabsContent>
    </Tabs>
  )
}
