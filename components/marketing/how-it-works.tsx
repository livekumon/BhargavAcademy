const steps = [
  {
    title: "Create a batch",
    body: "Name it after the class and the timing — Grade 10 Morning — then add students with their contact number and a login.",
  },
  {
    title: "Write the course once",
    body: "Add a course to your library and break it into chapters. This is the part you never want to repeat.",
  },
  {
    title: "Attach it to every batch",
    body: "The same Physics course can sit under three batches at once. Chapters stay in sync; material does not have to.",
  },
  {
    title: "Upload and assign",
    body: "Put a PDF on a chapter for one batch, choose whether it is revision or an assignment, and pick who gets it.",
  },
]

export function HowItWorks() {
  return (
    <ol className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
      {/* The rail that ties the steps together on wide screens. */}
      <div
        aria-hidden="true"
        className="absolute top-5 right-0 left-0 hidden h-px bg-line lg:block"
      />

      {steps.map((step, index) => (
        <li key={step.title} className="relative flex flex-col gap-3">
          <span className="font-heading tabular relative flex size-10 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-fg ring-4 ring-canvas">
            {index + 1}
          </span>
          <h3 className="font-heading text-title-3 font-semibold">{step.title}</h3>
          <p className="text-sm text-content-muted text-pretty">{step.body}</p>
        </li>
      ))}
    </ol>
  )
}
