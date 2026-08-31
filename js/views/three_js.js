export function render_three_js() {
    return `
<main class="relative w-full h-[calc(100vh-80px)] flex flex-col items-center justify-center overflow-hidden">
    <!-- Header overlay -->
    <div class="absolute top-6 left-6 z-20 pointer-events-none">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-bold uppercase tracking-widest mb-2">
            <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            Dynamic Three.js Simulation
        </div>
        <h1 class="text-2xl md:text-3xl font-display font-extrabold text-on-surface">Cosmic Harmonic Field</h1>
        <p class="text-xs text-on-surface-variant max-w-sm mt-1">Interactive 3D particle field simulation driven by real-time mathematical harmonics.</p>
    </div>

    <!-- Controls overlay -->
    <div class="absolute bottom-6 right-6 z-20 flex items-center gap-3">
        <button onclick="window.location.hash='home'" class="px-4 py-2 bg-surface-container/80 backdrop-blur-md hover:bg-surface-variant text-on-surface border border-white/10 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg">
            <span class="material-symbols-outlined text-[16px]">arrow_back</span> Return Home
        </button>
    </div>

    <!-- Canvas Container -->
    <div id="threejs-interactive-canvas" class="w-full h-full"></div>
</main>
`;
}

export function initThree_js() {
    const container = document.getElementById('threejs-interactive-canvas');
    if (!container) return;

    // Check if THREE is available
    if (typeof THREE === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
        script.onload = () => startSimulation(container);
        document.head.appendChild(script);
    } else {
        startSimulation(container);
    }
}

function startSimulation(container) {
    if (!container || container.querySelector('canvas')) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || (window.innerHeight - 80);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 70;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    // Particle field
    const particleCount = 4000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const color = new THREE.Color();

    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const radius = 25 + Math.random() * 20;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i3 + 2] = radius * Math.cos(phi);

        color.setHSL(0.5 + (i / particleCount) * 0.3, 0.8, 0.6);
        colors[i3] = color.r;
        colors[i3 + 1] = color.g;
        colors[i3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 1.2,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    let animationFrameId;
    let clock = new THREE.Clock();

    function animate() {
        if (!document.getElementById('threejs-interactive-canvas')) {
            cancelAnimationFrame(animationFrameId);
            renderer.dispose();
            geometry.dispose();
            material.dispose();
            return;
        }

        animationFrameId = requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        particles.rotation.y = elapsedTime * 0.08;
        particles.rotation.x = Math.sin(elapsedTime * 0.05) * 0.2;

        const posAttr = geometry.attributes.position;
        const colAttr = geometry.attributes.color;

        for (let i = 0; i < particleCount; i += 4) {
            const i3 = i * 3;
            const n = i / particleCount;
            const t = elapsedTime * 0.5 + n * Math.PI * 2;
            const wave = Math.sin(t) * 1.5;
            posAttr.array[i3 + 1] += Math.sin(elapsedTime * 2 + n * 10) * 0.05;
        }
        posAttr.needsUpdate = true;

        renderer.render(scene, camera);
    }

    animate();

    const handleResize = () => {
        if (!container) return;
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || (window.innerHeight - 80);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);
}
