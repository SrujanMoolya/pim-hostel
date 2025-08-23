import React from "react";
import { Linkedin } from "lucide-react"

const workDistribution = [
  {
    name: "Srujan Moolya",
    linkedin: "https://www.linkedin.com/in/srujan-moolya",
    work: [
      "Project architecture & setup",
      "Authentication & Supabase integration",
      "Dashboard UI/UX",
      "Student management module",
    ],
  },
  {
    name: "Aneesh Bhat",
    linkedin: "https://www.linkedin.com/in/aneesh-bhat",
    work: [
      "Responsive design",
      "Accessibility improvements",
      "Performance optimization",
      "Deployment scripts",
    ],
  },
  {
    name: "Neelanjan V",
    linkedin: "",
    work: [
      "Fees management module",
      "Payment records & dialogs",
      "UI components (forms, dialogs)",
      "Testing & bug fixes",
    ],
  },
  {
    name: "Vishal Shetty",
    linkedin: "",
    work: [
      "Settings & configuration pages",
      "Sidebar & navigation",
      "Reusable UI components",
      "Documentation",
    ],
  },
  {
    name: "Dheeraj Kumar",
    linkedin: "",
    work: [
      "Database schema & migrations",
      "Supabase backend setup",
      "API integration",
      "Testing & QA",
    ],
  },
];

const techStack = [
  "React (Vite, TypeScript)",
  "Tailwind CSS",
  "Supabase (PostgreSQL, Auth)",
  "Lucide Icons",
  "ESLint, Prettier",
  "PostCSS",
  "Shadcn UI Components"
];

export default function DevelopedBy() {
  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-4">Developed By</h1>
      <p className="mb-6 text-lg">MCA Batch 2024-2026<br/>Poornaprajna Institute of Management</p>
      <h2 className="text-xl font-semibold mb-2">Team Members & Work Distribution</h2>
      <ul className="mb-6 space-y-4">
        {workDistribution.map((dev) => (
          <li key={dev.name}>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{dev.name}</span>
              {dev.linkedin ? (
                <a href={dev.linkedin} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary">
                  <Linkedin className="h-4 w-4" />
                </a>
              ) : (
                <span className="text-muted-foreground opacity-40">
                  <Linkedin className="h-4 w-4" />
                </span>
              )}
            </div>
            <ul className="list-disc list-inside ml-4 text-sm text-muted-foreground">
              {dev.work.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <h2 className="text-xl font-semibold mb-2">Tech Stack Used</h2>
      <ul className="mb-6 list-disc list-inside ml-4 text-muted-foreground">
        {techStack.map(tech => <li key={tech}>{tech}</li>)}
      </ul>
      <div className="mt-8 text-sm text-muted-foreground">
        Developed by MCA batch 2024-2026 for PIM - Poornaprajna Institute of Management
      </div>
      <div className="mt-4 text-sm text-muted-foreground">
        Developed by Svvaap Innovations and Team
      </div>
    </div>
  );
}
