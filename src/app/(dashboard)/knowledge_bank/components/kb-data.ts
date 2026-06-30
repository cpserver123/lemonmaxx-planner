"use client";

export interface KBCategory {
  id: string;
  label: string;
}

export interface KBDocument {
  id: string;
  title: string;
  tab: "project-unicorn" | "sops" | "test";
  category: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  pages: number;
  content: string; // preview text / description
}

export const KB_CATEGORIES: KBCategory[] = [
  { id: "strategic",            label: "Strategic" },
  { id: "business",             label: "Business" },
  { id: "finance",              label: "Finance" },
  { id: "workflows",            label: "Workflows" },
  { id: "policies",             label: "Policies" },
  { id: "moms",                 label: "MOMs" },
  { id: "department",           label: "Department" },
  { id: "learning-development", label: "Learning & development" },
];

export const KB_TABS = [
  { id: "project-unicorn", label: "Project Unicorn" },
  { id: "sops",            label: "SOPs" },
  { id: "test",            label: "Test" },
] as const;

export const KB_DOCUMENTS: KBDocument[] = [
  // Project Unicorn — Strategic
  {
    id: "pu-1",
    title: "Breakthrough Project Roles and Responsibilities",
    tab: "project-unicorn",
    category: "strategic",
    author: "Madhavrao Pathak",
    createdAt: "May 5, 2026",
    updatedAt: "about 2 months ago",
    pages: 3,
    content: "Defines project manager, core team, strategic team captains, and overall conversation manager roles within Breakthrough Projects.",
  },
  {
    id: "pu-2",
    title: "Checklist for Weekly Breakthrough Review",
    tab: "project-unicorn",
    category: "strategic",
    author: "Nirav Vyas",
    createdAt: "Apr 14, 2026",
    updatedAt: "3 months ago",
    pages: 2,
    content: "Weekly review checklist covering promise tracking, escalations, and team alignment.",
  },
  {
    id: "pu-3",
    title: "Enrolling Key People into the Project",
    tab: "project-unicorn",
    category: "strategic",
    author: "Nirav Vyas",
    createdAt: "Mar 20, 2026",
    updatedAt: "4 months ago",
    pages: 4,
    content: "Framework for identifying and onboarding key stakeholders into breakthrough projects.",
  },
  {
    id: "pu-4",
    title: "Milestone Outcomes & Accountability",
    tab: "project-unicorn",
    category: "strategic",
    author: "Madhavrao Pathak",
    createdAt: "Feb 10, 2026",
    updatedAt: "5 months ago",
    pages: 5,
    content: "Defines milestone-based delivery expectations and accountability structures for each team role.",
  },
  // SOPs — Strategic
  {
    id: "sop-1",
    title: "Onboarding SOP — New Media Buyer",
    tab: "sops",
    category: "strategic",
    author: "Arun Bandral",
    createdAt: "Jan 15, 2026",
    updatedAt: "6 months ago",
    pages: 6,
    content: "Step-by-step onboarding guide for new media buyers joining the VSL team.",
  },
  {
    id: "sop-2",
    title: "Campaign Launch SOP",
    tab: "sops",
    category: "workflows",
    author: "Satish Kumar",
    createdAt: "Feb 1, 2026",
    updatedAt: "5 months ago",
    pages: 4,
    content: "Standard procedure for launching new ad campaigns, covering creative, targeting, and budget setup.",
  },
  // Test
  {
    id: "test-1",
    title: "Creative Testing Framework",
    tab: "test",
    category: "strategic",
    author: "Kapil Dev",
    createdAt: "Mar 5, 2026",
    updatedAt: "4 months ago",
    pages: 3,
    content: "Framework for A/B testing creatives including hypothesis, metrics, and decision criteria.",
  },
  {
    id: "test-2",
    title: "Platform Testing Playbook",
    tab: "test",
    category: "workflows",
    author: "Yash Poonia",
    createdAt: "Apr 2, 2026",
    updatedAt: "3 months ago",
    pages: 7,
    content: "Defines the go/no-go criteria and process for testing new ad platforms.",
  },
];
