export function BrandMark({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path
        d="M3 4.5A1.5 1.5 0 0 1 4.5 3h7A1.5 1.5 0 0 1 13 4.5v5A1.5 1.5 0 0 1 11.5 11H8l-3.2 2.1A.4.4 0 0 1 4.2 13V11H4.5A1.5 1.5 0 0 1 3 9.5v-5Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}
