# Isometric assets and character format

Generated with built-in `image_gen`, not CLI. Existing chibi characters supply identity; the supplied office and character-reference images supply style and sheet structure. Original generated PNGs remain unchanged; alpha bounds are described by `src/art-manifest.json` and rendered as separate objects with their own grid position, footprint, rotation and depth.

## Files

- `public/art/furniture-atlas.png`: nine isolated modules (desk, chair, cream sofa, bookcase, coffee counter, plant, meeting table, divider, sage sofa).
- `public/art/furniture-cozy-expansion.png`: nine more modules (bed, round tea table, beanbag, floor lamp, refrigerator, sink counter, stove/oven, storage cabinet, cat tree).
- `public/art/character-0.png` through `character-3.png`: one sheet per existing look, 24 frames each.
- `scripts/inspect-atlas.py`: inspect alpha bounds and regenerate metadata with Python + Pillow; never modifies the PNGs. Cell boundaries are specified per sheet because generated atlases have different margins.

## Character prompt

Use case: stylized-concept. Production game sprite atlas, not a reference poster. EXACT regular grid 4 columns by 6 rows, 24 separate full-body sprites of ONE identical character. Transparent background throughout, no grid lines no labels no text no panels. Each cell equal size, character same height (80% cell height), centered horizontally with feet at 90% cell height, generous transparent gaps. Polished cozy Japanese chibi, big head 2.5-head body, warm brown lineart, soft hand painted colors. ROW 1: four walking cycle frames FACING FRONT (toward viewer): contact left, passing, contact right, passing. ROW 2: same walk cycle all FACING LEFT side profile. ROW 3: same cycle all FACING RIGHT profile. ROW 4: same cycle all FACING BACK, no face visible. ROW 5: four FRONT full-body expressions: neutral, cheerful eyes-closed smile, thoughtful hand at chin, surprised. ROW 6: four FRONT full-body actions: holding a cooking bowl and spoon; carrying a small cardboard box; talking with open hand; cheering hands up. This is for game runtime slicing, so EXACTLY 24 cells and never cross cell boundaries. Keep hair, face identity, costume, colors consistent in all views. Reference images: first existing four characters supplies identity (only character indicated), second supplies sprite-sheet format, not its labels or characters. Character: 

Four separate calls append these respective identities: (0) chestnut-haired girl, cream flower clip, ivory cardigan, brown plaid skirt and satchel; (1) dark-haired boy, ivory cardigan and brown tie, brown trousers and satchel; (2) pink bob-haired girl, sage cardigan, beige skirt and cream bag; (3) blonde boy, blue cardigan, navy shorts, white sneakers and dark bag.

## Furniture prompt

Production modular game asset atlas. Transparent background, exactly 3 columns by 3 rows, nine individually isolated objects, generous padding, consistent isometric 2:1 projection, cozy Japanese handpainted anime, warm wood/cream/sage colors matching the reference office. Row 1: oak computer desk with monitor, keyboard and mug; coral cushioned office chair; cream two-seat sofa with pastel cushions. Row 2: oak bookcase with books and trailing plant; cream coffee counter with espresso machine; leafy plant in white ceramic pot. Row 3: oak meeting table with books and vase, no chairs; cream divider with wooden cap; sage two-seat sofa. Entire objects visible; no room composition, people, labels, baked floor or ground shadows.

## Furniture expansion prompt

Use case: stylized-concept. Create a new transparent furniture sprite atlas for the cozy Japanese chibi 2D isometric game. The existing furniture atlas is a style reference only: match its warm wood, creamy pastel colors, crisp brown outlines, softly painted shading, and elevated 2:1 isometric camera. Exactly nine distinct isolated furniture items, evenly spaced in a strict 3 columns by 3 rows layout, one complete object per cell, generous transparent gutters. Row 1: wooden single bed with cream duvet and sage blanket; low round wooden coffee table with tiny tea set; soft dusty-blue beanbag with cream cushion. Row 2: slender brass floor lamp with cream fabric shade; pastel pink retro refrigerator; wooden kitchen sink cabinet with white countertop. Row 3: cream stove and oven cabinet; low wooden storage cabinet with two drawers and a small flower vase; compact beige cat climbing tree with two platforms and a cubby. All same camera direction, full objects including feet, no floor tiles, no background, no people, no labels, no text, no grid lines, no cast shadows extending outside each object. True transparent alpha. Landscape 1536x1024.

## Runtime behavior

Rows 0–3: down, left, right, up walking cycles, four frames each at 140 ms per frame. Row 4: neutral, smiling, thinking, surprised. Row 5: cooking, carrying, talking, cheering. Idle uses the neutral front pose or a still directional frame. Emotes select talking/cheering; game processing selects cooking/carrying. Expressions and all actions can be inspected in Character Studio. These are raster frame animations, not a skeletal rig; no claim of independent clothing layers or eight-direction art.
