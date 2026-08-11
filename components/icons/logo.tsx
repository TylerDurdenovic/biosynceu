import clsx from "clsx";

export default function LogoIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      aria-label={`${process.env.SITE_NAME} logo`}
      viewBox="0 0 40 40"
      fill="none"
      {...props}
      className={clsx("h-8 w-8", props.className)}
    >
      {/* Outer sync ring */}
      <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="80 20" />
      {/* Inner DNA helix cross bars */}
      <line x1="13" y1="13" x2="27" y2="27" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="27" y1="13" x2="13" y2="27" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Center dot */}
      <circle cx="20" cy="20" r="3" fill="currentColor" />
      {/* Arrow tip on the sync ring */}
      <path d="M34 10 L38 14 L32 15 Z" fill="currentColor" />
    </svg>
  );
}
