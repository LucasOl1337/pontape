// Geometry of the hero prism: one beam in, five rays out. Two shapes of the same drawing:
// wide for desktop, tall for phones, so the five labels always sit where the rays end.
type Point = readonly [number, number];
interface PrismShape {
  width: number;
  height: number;
  apex: Point;
  left: Point;
  right: Point;
  beamStartY: number;
  hitAt: number; // 0 = bottom-left corner, 1 = apex, along the left face
  exitFrom: number; // 0 = apex, 1 = bottom-right corner, along the right face
  exitTo: number;
  rayEndHalf: number;
}

const lerp = (a: Point, b: Point, t: number): Point => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const pt = ([x, y]: Point) => `${x.toFixed(1)} ${y.toFixed(1)}`;

export function prismDrawing(s: PrismShape) {
  const hit = lerp(s.left, s.apex, s.hitAt);
  const exits = [0, 1, 2, 3, 4].map(k => lerp(s.apex, s.right, s.exitFrom + (s.exitTo - s.exitFrom) * (k / 4)));
  const rays = exits.map((e, k) => {
    const endY = s.height * (0.1 + 0.2 * k);
    return `M${pt([e[0], e[1] - 1.2])} L${pt([s.width, endY - s.rayEndHalf])} L${pt([s.width, endY + s.rayEndHalf])} L${pt([e[0], e[1] + 1.2])} Z`;
  });
  // A thin reflection just inside the right face, so the prism reads as glass.
  const centre: Point = [(s.apex[0] + s.left[0] + s.right[0]) / 3, (s.apex[1] + s.left[1] + s.right[1]) / 3];
  const inset = (p: Point, by: number): Point => {
    const dx = centre[0] - p[0], dy = centre[1] - p[1], len = Math.hypot(dx, dy);
    return [p[0] + (dx / len) * by, p[1] + (dy / len) * by];
  };
  const shine = `M${pt(inset(lerp(s.apex, s.right, 0.1), 9))} L${pt(inset(lerp(s.apex, s.right, 0.38), 9))}`;
  return {
    shine,
    viewBox: `0 0 ${s.width} ${s.height}`,
    beam: `M0 ${s.beamStartY} L${pt(hit)}`,
    body: `M${pt(s.apex)} L${pt(s.right)} L${pt(s.left)} Z`,
    edge: `M${pt(s.left)} L${pt(s.apex)}`,
    fan: `M${pt(hit)} L${pt(exits[0]!)} L${pt(exits[4]!)} Z`,
    rays,
    // Where the labels sit, in % of the drawing: the glass name under the prism, the beam name above the beam.
    glassLabel: { x: (s.apex[0] / s.width) * 100, y: ((s.left[1] + 14) / s.height) * 100 },
    beamLabel: { y: (s.beamStartY / s.height) * 100 },
  };
}

export const PRISM_WIDE = prismDrawing({
  width: 1000, height: 460, apex: [500, 40], left: [330, 400], right: [670, 400],
  beamStartY: 268, hitAt: 0.42, exitFrom: 0.47, exitTo: 0.7, rayEndHalf: 10,
});

export const PRISM_TALL = prismDrawing({
  width: 520, height: 600, apex: [250, 150], left: [150, 400], right: [350, 400],
  beamStartY: 338, hitAt: 0.3, exitFrom: 0.42, exitTo: 0.66, rayEndHalf: 13,
});
