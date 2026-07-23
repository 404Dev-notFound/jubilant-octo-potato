export function render_Three_js() {
    return `
 STITCH_THREEJS_START:ANIMATION_2 class="fixed inset-0 w-full h-full bg-transparent" 
<div class="fixed inset-0 w-full h-full bg-transparent" style="display:block;">
<script src="https://ajax.googleapis.com/ajax/libs/threejs/r125/three.min.js"></script>
<div id="threejs-container-ANIMATION_2" style="width:100%;height:100%"></div>
<script>
(function() {
  const container = document.getElementById('threejs-container-ANIMATION_2');
  const devicePixelRatio = window.devicePixelRatio || 1;
  
const i3 = i * 3;
const n = i / count;

// Independent mathematical frequencies
const t1 = time * 0.15;
const t2 = time * 0.11 + n * 2.0;
const t3 = time * 0.08 + n * 4.0;

// Procedural harmonic motion
const radius = 25.0 + 5.0 * Math.sin(t1 + n * 6.28);
const angle = n * 62.8 + t2;
const spiral = n * 15.0;

// Interference patterns & Spiral field
const x = radius * Math.cos(angle + spiral) * (1.0 + 0.2 * Math.sin(t3 * 2.5 + n * 10.0));
const y = radius * Math.sin(angle + spiral) * (1.0 + 0.2 * Math.cos(t2 * 1.8 + n * 12.0));
const z = 15.0 * Math.sin(t1 * 1.2 + n * 20.0) + 10.0 * Math.cos(t2 * 0.7 + n * 8.0);

// Rotational fields & fractal-inspired evolution
const rotX = x * Math.cos(t1) - z * Math.sin(t1);
const rotZ = x * Math.sin(t1) + z * Math.cos(t1);

target.set(rotX, y + Math.sin(t2 * 0.5) * 5.0, rotZ);

// Dynamic color evolution based on position and time
const hue = (0.6 + 0.1 * Math.sin(t1 + n * 5.0)) % 1.0;
const saturation = 0.8 + 0.2 * Math.cos(t3);
const lightness = 0.5 + 0.3 * Math.sin(t2 + n * 3.14);

color.setHSL(hue, saturation, lightness);

})();
</script>
</div>
 STITCH_THREEJS_END:ANIMATION_2 
`;
}
