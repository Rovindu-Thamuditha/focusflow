import type { SVGProps } from "react";

export const Icons = {
    logo: (props: SVGProps<SVGSVGElement>) => (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 200 200"
            {...props}
        >
            <defs>
                <radialGradient id="grad1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                    <stop offset="0%" style={{ stopColor: "hsl(var(--primary))", stopOpacity: 1 }} />
                    <stop offset="70%" style={{ stopColor: "hsl(var(--primary))", stopOpacity: 0.8 }} />
                    <stop offset="100%" style={{ stopColor: "hsl(var(--background))", stopOpacity: 0.2 }} />
                </radialGradient>
                 <filter id="glow">
                    <feGaussianBlur stdDeviation="7.5" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            <circle 
                cx="100" 
                cy="100" 
                r="80" 
                fill="url(#grad1)" 
                stroke="hsl(var(--primary))" 
                strokeWidth="5"
                className="[.stranger-things_&]:filter-[url(#glow)]"
            />
            <circle 
                cx="100" 
                cy="100" 
                r="60" 
                fill="hsl(var(--background))" 
                className="[.stranger-things_&]:opacity-50"
            />
        </svg>
    ),
  };
  