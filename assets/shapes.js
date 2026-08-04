// MESMETRON screensaver module: "shapes"
// A full-screen rotating 3D wireframe shape (Tetrahedron, Cube, or Octahedron)
// scaled up 40% with geometrically accurate regular shapes.

(function() {
  const CX = 240, CY = 160;
  let variant = 0, tick = 0, hasDrawn = false;

  const SHAPES = [
    // 0: Tetrahedron (Regular 3-sided pyramid using symmetric inscribed cube coordinates)
    {
      verts: [
        [ 1,  1,  1],
        [ 1, -1, -1],
        [-1,  1, -1],
        [-1, -1,  1]
      ],
      edges: [[0,1], [0,2], [0,3], [1,2], [1,3], [2,3]]
    },
    // 1: Cube
    {
      verts: [
        [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
        [-1, -1,  1], [1, -1,  1], [1, 1,  1], [-1, 1,  1]
      ],
      edges: [
        [0,1], [1,2], [2,3], [3,0],
        [4,5], [5,6], [6,7], [7,4],
        [0,4], [1,5], [2,6], [3,7]
      ]
    },
    // 2: Octahedron
    {
      verts: [
        [0, -1.5, 0], [0, 1.5, 0],
        [1.5, 0, 0], [-1.5, 0, 0],
        [0, 0, 1.5], [0, 0, -1.5]
      ],
      edges: [
        [0,2], [0,3], [0,4], [0,5],
        [1,2], [1,3], [1,4], [1,5],
        [2,4], [4,3], [3,5], [5,2]
      ]
    }
  ];

  let prevX = [];
  let prevY = [];

  function drawShapeLines(h, sx, sy, edges) { "ram";
    for (let i = 0; i < edges.length; i++) {
      const e = edges[i];
      h.drawLine(sx[e[0]] | 0, sy[e[0]] | 0, sx[e[1]] | 0, sy[e[1]] | 0);
    }
  }

  return {
    init: function(v) {
      variant = v;
      tick = 0;
      hasDrawn = false;
      const shape = SHAPES[Math.abs(variant) % SHAPES.length];
      prevX = new Float32Array(shape.verts.length);
      prevY = new Float32Array(shape.verts.length);
    },
    draw: function(h) { "ram";
      const shapeIdx = Math.abs(variant) % SHAPES.length;
      const shape = SHAPES[shapeIdx];
      const numVerts = shape.verts.length;

      // Erase previous frame
      h.setColor(0);
      if (hasDrawn) {
        drawShapeLines(h, prevX, prevY, shape.edges);
      }

      // Multi-axis rotation angles based on tick
      const ax = tick * 0.025;
      const ay = tick * 0.033;
      const az = tick * 0.018;

      const cxCos = Math.cos(ax), cxSin = Math.sin(ax);
      const cyCos = Math.cos(ay), cySin = Math.sin(ay);
      const czCos = Math.cos(az), czSin = Math.sin(az);

      const curX = new Float32Array(numVerts);
      const curY = new Float32Array(numVerts);
      const dist = 3.5;
      // Increased scale by 40% (140 * 1.4 = 196)
      const scale = 196;

      for (let i = 0; i < numVerts; i++) {
        const v = shape.verts[i];
        let x = v[0], y = v[1], z = v[2];

        // Rotate X
        let y1 = y * cxCos - z * cxSin;
        let z1 = y * cxSin + z * cxCos;
        let x1 = x;

        // Rotate Y
        let x2 = x1 * cyCos + z1 * cySin;
        let z2 = -x1 * cySin + z1 * cyCos;
        let y2 = y1;

        // Rotate Z
        let x3 = x2 * czCos - y2 * czSin;
        let y3 = x2 * czSin + y2 * czCos;
        let z3 = z2;

        // Perspective projection
        const factor = scale / (z3 + dist);
        curX[i] = CX + x3 * factor;
        curY[i] = CY + y3 * factor;
      }

      // Draw current frame wireframe
      h.setColor(3);
      drawShapeLines(h, curX, curY, shape.edges);

      // Save coordinates for next frame erasure
      for (let i = 0; i < numVerts; i++) {
        prevX[i] = curX[i];
        prevY[i] = curY[i];
      }
      hasDrawn = true;
      tick++;
    }
  };
});