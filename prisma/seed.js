const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const projects_data = [
    {
        title: "Campus Connect",
        category: "Social Platform",
        difficulty: "Intermediate",
        techStack: ["MERN", "Socket.IO"],
        image: "https://picsum.photos/600/400?random=1",
        description: "A campus networking platform where students can connect, create communities, share posts, and collaborate on projects.",
        githubUrl: "https://github.com/demo/campus-connect"
    },
    {
        title: "DevPortfolio AI",
        category: "Developer Tools",
        difficulty: "Beginner",
        techStack: ["React", "Tailwind CSS"],
        image: "https://picsum.photos/600/400?random=2",
        description: "Build beautiful developer portfolios with AI-generated content and modern responsive templates.",
        githubUrl: "https://github.com/demo/devportfolio-ai"
    },
    {
        title: "Code Review Assistant",
        category: "AI",
        difficulty: "Advanced",
        techStack: ["React", "Node.js", "OpenAI API"],
        image: "https://picsum.photos/600/400?random=3",
        description: "AI-powered code review platform that suggests improvements, detects bugs, and explains best practices.",
        githubUrl: "https://github.com/demo/code-review-assistant"
    },
    {
        title: "Smart Expense Manager",
        category: "Finance",
        difficulty: "Beginner",
        techStack: ["React", "Express.js", "MongoDB"],
        image: "https://picsum.photos/600/400?random=4",
        description: "Track income, expenses, budgets, savings, and monthly financial reports with insightful charts.",
        githubUrl: "https://github.com/demo/smart-expense-manager"
    },
    {
        title: "Real-Time Chat Platform",
        category: "Communication",
        difficulty: "Intermediate",
        techStack: ["React", "Node.js", "Socket.IO"],
        image: "https://picsum.photos/600/400?random=5",
        description: "A real-time messaging application with typing indicators, media sharing, and online presence.",
        githubUrl: "https://github.com/demo/realtime-chat"
    },
    {
        title: "Hospital Care System",
        category: "Healthcare",
        difficulty: "Intermediate",
        techStack: ["MERN"],
        image: "https://picsum.photos/600/400?random=6",
        description: "Complete hospital management solution for doctors, patients, appointments, billing, and reports.",
        githubUrl: "https://github.com/demo/hospital-care"
    },
    {
        title: "ShopSphere",
        category: "E-Commerce",
        difficulty: "Intermediate",
        techStack: ["MERN", "Stripe"],
        image: "https://picsum.photos/600/400?random=7",
        description: "Full-featured online shopping platform with secure payments, cart, orders, and admin dashboard.",
        githubUrl: "https://github.com/demo/shopsphere"
    },
    {
        title: "QuizVerse",
        category: "Education",
        difficulty: "Beginner",
        techStack: ["React", "Express.js"],
        image: "https://picsum.photos/600/400?random=8",
        description: "Create online quizzes, conduct exams, manage results, and generate leaderboards.",
        githubUrl: "https://github.com/demo/quizverse"
    },
    {
        title: "AI Interview Coach",
        category: "AI",
        difficulty: "Advanced",
        techStack: ["React", "Node.js", "OpenAI API"],
        image: "https://picsum.photos/600/400?random=9",
        description: "Practice technical interviews with AI-generated questions, live coding rounds, and detailed feedback.",
        githubUrl: "https://github.com/demo/ai-interview-coach"
    },
    {
        title: "Team Task Manager",
        category: "Productivity",
        difficulty: "Beginner",
        techStack: ["MERN"],
        image: "https://picsum.photos/600/400?random=10",
        description: "Organize tasks, manage projects, assign team members, and track deadlines efficiently.",
        githubUrl: "https://github.com/demo/team-task-manager"
    },
    {
        title: "FoodHub",
        category: "Food Delivery",
        difficulty: "Advanced",
        techStack: ["MERN"],
        image: "https://picsum.photos/600/400?random=11",
        description: "Food ordering platform with restaurant listings, payments, live tracking, and order history.",
        githubUrl: "https://github.com/demo/foodhub"
    },
    {
        title: "Secure Share",
        category: "Utility",
        difficulty: "Intermediate",
        techStack: ["Node.js", "MongoDB"],
        image: "https://picsum.photos/600/400?random=12",
        description: "Secure file sharing platform with authentication, cloud uploads, and encrypted downloads.",
        githubUrl: "https://github.com/demo/secure-share"
    },
    {
        title: "Climate Dashboard",
        category: "Weather",
        difficulty: "Beginner",
        techStack: ["React", "OpenWeather API"],
        image: "https://picsum.photos/600/400?random=13",
        description: "Interactive weather dashboard with forecasts, air quality, and location-based weather updates.",
        githubUrl: "https://github.com/demo/climate-dashboard"
    },
    {
        title: "CineVerse",
        category: "Entertainment",
        difficulty: "Intermediate",
        techStack: ["React", "TMDB API"],
        image: "https://picsum.photos/600/400?random=14",
        description: "Discover trending movies, explore details, create watchlists, and get AI-powered recommendations.",
        githubUrl: "https://github.com/demo/cineverse"
    },
    {
        title: "FitTrack Pro",
        category: "Health & Fitness",
        difficulty: "Intermediate",
        techStack: ["React Native", "Firebase"],
        image: "https://picsum.photos/600/400?random=15",
        description: "Track workouts, calories, sleep, water intake, and fitness progress with detailed analytics.",
        githubUrl: "https://github.com/demo/fittrack-pro"
    }
];

const pinnedTech = "React.js, Vite, Tailwind CSS, JavaScript, Node.js, Express.js, MongoDB, Mongoose, Socket.IO, JWT Authentication, bcrypt, Monaco Editor, CodeMirror, WebRTC, OpenAI API, GitHub API, GitHub OAuth, Git, REST API, Python, FastAPI, Docker, Cloudinary, Multer, Axios, Markdown, Mermaid.js, Framer Motion, React Router, Redux Toolkit, Context API, Nodemailer, Redis, Vercel, Render, GitHub Actions, ESLint, Prettier";
const pinnedTechList = pinnedTech.split(',').map(x => x.trim());

const pinned_project = {
    title: "CODECOLLAB",
    category: "Open Source Platform",
    difficulty: "Advanced",
    techStack: pinnedTechList,
    image: "https://picsum.photos/1200/800?random=999",
    description: "CODECOLLAB is an AI-powered open-source collaboration platform where developers can discover impactful projects, collaborate in real time, manage teams, contribute to repositories, and accelerate development with integrated AI tools.",
    githubUrl: "https://github.com/404Dev-notFound/jubilant-octo-potato",
    isPinned: true
};

async function main() {
    console.log(`Start seeding ...`);
    
    // Clear existing
    await prisma.project.deleteMany();

    // Insert pinned project
    const pinned = await prisma.project.create({
        data: pinned_project
    });
    console.log(`Created pinned project with id: ${pinned.id}`);

    // Insert rest
    for (const p of projects_data) {
        const project = await prisma.project.create({
            data: p
        });
        console.log(`Created project with id: ${project.id}`);
    }
    console.log(`Seeding finished.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
