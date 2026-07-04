---
name: Hero halo/portrait flush-bottom technique
description: How the cwsite hero keeps the portrait cutout flush with the circular halo bottom across breakpoints
---

# Hero portrait ↔ halo flush bottom

To make a portrait cutout sit flush with the bottom of a circular halo backdrop, the circle and the portrait must share a single clipping plane (a common ancestor with `overflow-hidden`), and the circle's *wide midsection* (not its narrow bottom point) must intersect that clip line.

**Why:** A circle narrows to a point at the bottom, so aligning the circle's lowest point with the portrait bottom leaves the figure's lower body poking out the sides. Desktop (xl) looks right because the whole section is `overflow-hidden` at a fixed height and the halo is huge — it's still wide at the clip line. The non-xl layout had no such shared clip, so the smaller halo (translated *down* past the portrait) visibly poked out below the man.

**How to apply:** Clip the portrait column with `overflow-hidden` (use `xl:overflow-visible` so desktop's separate large halo is untouched), size the column wider than the circle diameter (else `overflow-hidden` clips the circle *sides* into an arch/tombstone shape), and translate the circle downward so its broad middle — not its tip — meets the clipped bottom edge. Offsets are tuned to the current portrait asset's transparent bounds; a differently-cropped cutout may need retuning.
