export function Header({
  title,
  className,
}: {
  title: string;
  className?: string;
}) {
  return (
    <div>
      <h2
        className={`whitespace-nowrap text-base font-bold sm:text-lg ${className ?? ""}`}
      >
        {title}
      </h2>
    </div>
  );
}
