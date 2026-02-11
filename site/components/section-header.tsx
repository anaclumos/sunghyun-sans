import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  label?: string;
  title?: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
  titleClassName?: string;
}

export function SectionHeader({ label, title, description, align = "left", className, titleClassName }: SectionHeaderProps) {

  return (
    <div className={cn(
      "flex flex-col gap-4 mb-12 md:mb-16",
      align === "center" ? "items-center text-center" : "items-start text-left",
      className
    )}>
      {label && (
        <span className="type-micro font-semibold text-warm-muted tracking-widest">
          {label}
        </span>
      )}
      {title && (
        <h2 className={cn("type-section font-semibold text-ink", titleClassName)}>
          {title}
        </h2>
      )}
      {description && (
        <p className="type-body text-warm-muted max-w-2xl">
          {description}
        </p>
      )}
    </div>
  );
}
