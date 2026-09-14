"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const questions = [
  {
    q: "Can the same student be in more than one batch?",
    a: "Yes. A student can be enrolled in several batches, and their progress is reported separately for each one so a morning and an evening batch never get mixed up.",
  },
  {
    q: "Do I have to re-upload the same PDF for every batch?",
    a: "No. The course and its chapters are shared. Material is attached per batch, so you upload only where the material actually differs — and a batch you have not touched keeps what it already had.",
  },
  {
    q: "How do parents get access?",
    a: "A parent is linked to a student through the student's profile, then signs in with their own account. One login shows every child linked to them, with a progress breakdown per batch.",
  },
  {
    q: "What can students actually do?",
    a: "They see only the material assigned to them, split into what to revise and what to submit. They can open the PDF, mark revision as done, and upload their own PDF against an assignment.",
  },
  {
    q: "Where does my data live?",
    a: "This build stores records in a local SQLite database and uploaded PDFs on the same machine, under the project's data folder. Nothing is sent anywhere else.",
  },
  {
    q: "How big can an upload be?",
    a: "PDFs up to 20 MB. You can replace or remove a file at any time without affecting the same chapter in another batch.",
  },
]

export function Faq() {
  return (
    <Accordion type="single" collapsible className="w-full">
      {questions.map((item) => (
        <AccordionItem key={item.q} value={item.q}>
          <AccordionTrigger>{item.q}</AccordionTrigger>
          <AccordionContent>{item.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
