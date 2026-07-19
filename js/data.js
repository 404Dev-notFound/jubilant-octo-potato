// Comprehensive Mock Database for CODECOLLAB SPA
window.CodeCollabDB = {
    user: {
        id: "u_1", username: "dev_ninja", name: "Alex Developer",
        avatar: "U", role: "Pro Member",
        bio: "Full-stack engineer passionate about open source and AI.",
        location: "San Francisco, CA", website: "codecollab.dev/alex",
        skills: ["Python", "JavaScript", "C++", "React", "Docker", "Machine Learning"],
        stats: { followers: 128, following: 45, repositories: 24, stars: 342, contributions: 1450, streak: 12 },
        organizations: [{ name: "OpenAI", logo: "O" }, { name: "Vercel", logo: "V" }],
        achievements: ["Early Adopter", "Bug Hunter", "Mentor"]
    },
    projects: [
        { id: "p_1", title: "NeonDB", desc: "High-performance distributed key-value store.", lang: "C++", stars: 1205, issues: 14, contribs: 8, diff: "Advanced", org: "Database Corp", ai_rec: true },
        { id: "p_2", title: "AuraUI", desc: "Glassmorphism UI component library.", lang: "JavaScript", stars: 840, issues: 5, contribs: 12, diff: "Beginner", org: "DesignCo", ai_rec: false },
        { id: "p_3", title: "NexusML", desc: "ML framework optimized for edge.", lang: "Python", stars: 3200, issues: 42, contribs: 35, diff: "Intermediate", org: "AI Labs", ai_rec: true },
        { id: "p_4", title: "SkyMind", desc: "Autonomous AI agent framework.", lang: "Python", stars: 5400, issues: 120, contribs: 80, diff: "Advanced", org: "SkyCorp", ai_rec: true }
    ],
    issues: [
        { id: "i_1", title: "Memory leak in query parser", status: "todo", priority: "high", project: "NeonDB", assignee: "U" },
        { id: "i_2", title: "Add dark mode support", status: "in-progress", priority: "medium", project: "AuraUI", assignee: "A" },
        { id: "i_3", title: "Update README docs", status: "done", priority: "low", project: "NexusML", assignee: "U" }
    ],
    prs: [
        { id: "pr_1", title: "Implement zero-copy network stack", status: "open", author: "alexdev", time: "2 days ago", tag: "enhancement", ci: "pass" },
        { id: "pr_2", title: "Fix edge case in auth flow", status: "merged", author: "johndoe", time: "5 days ago", tag: "bug", ci: "pass" }
    ],
    events: [
        { title: "Global Open Source Hackathon 2026", date: "August 15-20", participants: 15420, type: "Hackathon" },
        { title: "Intro to AI Agents", date: "July 25", participants: 3200, type: "Webinar" }
    ],
    leaderboard: [
        { rank: 1, name: "Sarah Code", score: 15420, badge: "🥇" },
        { rank: 2, name: "Alex Developer", score: 14200, badge: "🥈" },
        { rank: 3, name: "Mike Script", score: 13800, badge: "🥉" }
    ]
};