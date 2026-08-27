import { useId } from "react";
import { siInstagram, siLine, siMessenger, siThreads } from "simple-icons";

type LogoProps = {
  size?: number;
};

export function LineLogo({ size = 40 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      className="shrink-0"
    >
      <path d={siLine.path} fill={`#${siLine.hex}`} />
    </svg>
  );
}

export function MessengerLogo({ size = 40 }: LogoProps) {
  const id = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      className="shrink-0"
    >
      <defs>
        <linearGradient
          id={id}
          x1="0%"
          y1="100%"
          x2="100%"
          y2="0%"
        >
          <stop offset="0%" stopColor="#00B2FF" />
          <stop offset="50%" stopColor="#A033FF" />
          <stop offset="100%" stopColor="#FF5280" />
        </linearGradient>
      </defs>
      <path d={siMessenger.path} fill={`url(#${id})`} />
    </svg>
  );
}

export function InstagramLogo({ size = 40 }: LogoProps) {
  const id = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      className="shrink-0"
    >
      <defs>
        <radialGradient id={id} cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="5%" stopColor="#fdf497" />
          <stop offset="45%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <path d={siInstagram.path} fill={`url(#${id})`} />
    </svg>
  );
}

export function ThreadsLogo({ size = 40 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      className="shrink-0"
    >
      <path d={siThreads.path} fill={`#${siThreads.hex}`} />
    </svg>
  );
}
