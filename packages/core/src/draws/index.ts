// Draws are not built (product plan §0c.3 and §7, spec §3.9, architecture §7). This file only stays
// because packages/core/src/index.ts (not owned by WP-6) still re-exports it; the integration wave
// removes both (architecture §12.5). There is no draw logic, beacon or test vector anywhere.
export {};
