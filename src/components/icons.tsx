import type { SVGProps } from "react";

export const Icons = {
    logo: (props: SVGProps<SVGSVGElement>) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
        <path d="M12 8v4l2 2" />
        <path d="M16.5 16.5l1.5 1.5" />
        <path d="M7.5 16.5l-1.5 1.5" />
      </svg>
    ),
  };
  