type SectionHeadingProps = {
  title: string;
  description?: string;
  align?: "left" | "center";
  tone?: "light" | "dark";
};

export function SectionHeading({ title, description, align = "left", tone = "light" }: SectionHeadingProps) {
  const headingClass = tone === "dark" ? "text-white" : "text-slate-950";
  const descriptionClass = tone === "dark" ? "text-slate-300" : "text-slate-600";

  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <h2 className={`text-3xl font-semibold leading-tight md:text-4xl ${headingClass}`}>{title}</h2>
      {description ? <p className={`mt-3 text-base leading-7 md:text-lg ${descriptionClass}`}>{description}</p> : null}
    </div>
  );
}
