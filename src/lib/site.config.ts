export const siteConfig = {
  name: "Next.js Base",
  tagline: "Production-ready · TypeScript · Tailwind CSS v4 · shadcn v4",
  description:
    "Production-ready Next.js 16 + React 19 starter with App Router, TypeScript strict mode, Tailwind CSS v4, shadcn components, GSAP animations, and automated dependency updates and audit workflow.",
  author: {
    name: "mjldotdev",
    url: "https://mjldotdev.vercel.app",
    twitter: "@mjldotdev",
  },
  socials: [
    {
      label: "GitHub",
      href: "https://github.com/mjldotdev",
      icon: "github" as const,
    },
    {
      label: "LinkedIn",
      href: "https://linkedin.com/in/mjldotdev",
      icon: "linkedin" as const,
    },
    {
      label: "X",
      href: "https://x.com/mjldotdev",
      icon: "x" as const,
    },
  ],
  links: {
    home: "/",
  },
} as const;

export type SocialIcon = (typeof siteConfig.socials)[number]["icon"];
