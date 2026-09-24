# Production media browser application

Use this architecture when the primary task is horizontally browsing a small
collection of real media, selecting one destination, and reading its detail.
Do not use it for a vertical record list, controls, or a static slideshow.

## Fixed architecture

Use exactly two routes:

- collection: `Page` > one edge-to-edge `ScrollView` > one direct `Carousel` >
  interactive `Card` destinations;
- detail: `Page` > one `ScrollView` with `tabIndex={0}` > one non-interactive
  full-bleed media region > one edge-to-edge informational `Panel`.

Mount with `BrowserRouter` > `ReactRouterNavigationProvider` > `App` > one
durable collection-state provider > `ReactRouterPageTransition` > `Routes`.
The provider owns the centered item index and remains outside the transition so
Back restores the selected Card. Do not add in-app Back/Home controls.

Use the render-callback router API exactly; `ReactRouterPageTransition` has no
`location` prop:

```tsx
<ReactRouterPageTransition>
  {({location}) => (
    <Routes location={location}>
      <Route path="/" element={<CollectionPage />} />
      <Route path="/photo/:id" element={<DetailPage />} />
    </Routes>
  )}
</ReactRouterPageTransition>
```

Keep `BrowserRouter`, `ReactRouterNavigationProvider`, `App`, the durable
provider, and this transition callback together in `main.tsx` so the canonical
order is explicit. Do not hide the transition in a child app component.

Use a normal Vite React config with no `resolve.alias`. Consume the toolkit only through
package exports. Never alias the toolkit, its stylesheet, router integration, icons, or
shape package to source files.

Use only `App`, `Page`, `ScrollView`, `Carousel`, `Card`, `CardBelowScrim`,
`CardAboveScrim`, `StaticContainer`, `Panel`, `TextView`, `TextStyle`, and
`TextColor`. Import the router integration from
`@wearables-ui-toolkit/mrbd/react-router`; `App` loads the toolkit styles. Use real local
images; do not generate gradients or placeholders that imitate media.

Bundle stable local images in the application. Do not depend on a remote image
URL or redirect. Title, place, alt text, and detail copy must describe what is
actually visible. Unless the asset source definitively identifies a named
building, architect, or location, use a truthful visual title such as “Glass
courtyard” rather than assigning a famous landmark to a generic photograph.
Never draw an SVG/vector scene, gradient illustration, or generated placeholder
to stand in for a photograph. When the brief allows mock landscape media, copy
the skill's generated raster photographs from `../assets/landscapes/` into the
application and describe them as coast, forest, and overlook. When product
assets are supplied, use those instead.

Each destination owns one unique image. Never reuse one photograph for another
Card, title, place, story, or alt description. When using the three bundled
landscapes, render exactly three destinations and use these conservative visual
identities rather than inventing named locations or unseen features:

- `coast.png`: title `Tidal coast`, place `Rocky shore`, alt text describing
  rocky tidal pools along a misty coast in soft morning light;
- `forest.png`: title `Forest path`, place `Woodland`, alt text describing a
  winding path through a mossy deciduous forest in warm sunlight;
- `overlook.png`: title `Mountain overlook`, place `Highlands`, alt text
  describing layered forested mountains from a rocky overlook in hazy daylight.

For these bundled assets, use the following natural journal copy exactly. This
keeps mock content truthful without exposing asset provenance or defensively
listing what is absent from the pixels:

- coast lead: `Still water gathers between dark rocks while mist softens the
  distant shore.` Detail: `Low light catches the pools and uneven stone along
  the waterline.` Source/context: `Field journal · Rocky coast`;
- forest lead: `A narrow path curves through moss, ferns, and sunlit trees.`
  Detail: `Warm light reaches the ground between trunks and dense green
  undergrowth.` Source/context: `Field journal · Woodland path`;
- overlook lead: `Forested ridges recede into haze beyond a rocky foreground.`
  Detail: `Soft daylight separates the layered slopes across the broad view.`
  Source/context: `Field journal · Mountain overlook`.

Never mention bundled/generated assets, a study, implementation provenance, or
defensive phrases such as “no people visible” in product copy. Stories may add
atmosphere only when the image establishes it; do not infer geology, climate,
exact time of day, a named location, or off-frame objects.

## Collection geometry and content

Carousel and ScrollView frames are edge-to-edge. Carousel must be a direct
ScrollView child, not wrapped in a padded element. Each Card is one truthful
destination with `onClick`, a complete `ariaLabel`, and real media.

The collection Page contains only the direct Carousel. Do not add an intro,
metadata strip, explanatory prose, wrapper, or spacer around it. Use
`insetForHeader` on ScrollView and omit `headerMetadata`. Initialize Carousel
with the durable `initialIndex` and update that index through
`onItemCentered`; do not use a timeout or effect to restore position.

Card layers are positioned and cannot establish Card geometry. Every Card must
have:

- a nonzero responsive inline size bounded by both the available inline and
  block space;
- a nonzero block-size established by a content-appropriate `aspect-ratio`;
- `min-inline-size: 0`;
- full-bleed image content using `inline-size: 100%`, `block-size: 100%`, and
  `object-fit: cover` only after the Card itself has geometry.

Set Card geometry through its public `width` and root `style` props. Do not give
Card an application class and do not target Card descendants or rendered toolkit
internals. The only media CSS needed is:

```css
.media-image {
  display: block;
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
}
```

The ratio describes source media, not a viewport dimension. Choose the media's
real ratio. Never encode a device width/height or use percentage-sized media as
the only sizing anchor.

Prefer public root props over CSS when possible. Reserve the header area,
pagination, and focus-growth clearance in the block-axis bound; a width-only
ratio can fit one square viewport and still push pagination off a shorter or
wider viewport:

```tsx
<Card
  width={`min(
    calc(100vi - (2 * var(--uit-spacing-large))),
    calc(
      (100vb - var(--uit-header-area-length) - var(--uit-spacing-5xl) -
      var(--uit-spacing-xlarge) - var(--uit-spacing-small)) * 1.5
    )
  )`}
  style={{aspectRatio: '3 / 2'}}
  onClick={() => openPhoto(photo.id, index)}
  ariaLabel={`${photo.title}, ${photo.place}`}>
  ...
</Card>
```

Use `CardBelowScrim` for the image and `CardAboveScrim` for one compact text
stack protected by a built-in bottom Card scrim. These are paint-order wrappers,
not flow layout. Position the media layer across the Card and anchor the copy
layer over its bottom edge through their public `style` props. Never let a
100%-block-size image participate in flow before the copy.

```tsx
<Card bottomScrim={ScrimType.TALL} {...cardProps}>
  <CardBelowScrim style={{position: 'absolute', inset: 0}}>
    <img className="media-image" src={photo.src} alt={photo.alt} />
  </CardBelowScrim>
  <CardAboveScrim
    style={{
      position: 'absolute',
      insetInline: 'var(--uit-spacing-large)',
      insetBlockEnd: 'var(--uit-spacing-large)',
    }}>
    <div className="card-copy">{/* title and context */}</div>
  </CardAboveScrim>
</Card>
```

Keep routine title text at `BODY2_EMPHASIZED` and place in-card context at
secondary metadata size. Keep pagination close to content. Verify first,
middle, and last Cards have nonzero rectangles, visible copy/scrim, and room
for focus expansion at both compact and wide viewport proportions.

Every visible compact string contains at most two fact groups. Card context is
one place value, not a joined place/region/time/format sequence. Long prose
belongs only in the detail Panel.

## Detail route

Do not reuse Card as a decorative hero: Card is always focusable and represents
one destination. A detail image with no action uses `StaticContainer` with
clipping or ordinary non-interactive media. Give that region the same explicit
responsive geometry rule as collection media.

Configure StaticContainer through public root props instead of styling its
internals. Give the full-width region an explicit responsive height: preserve
the source ratio when inline space is limiting, but cap block size so a wider
viewport still reveals a meaningful portion of the Panel below it. The image
uses `object-fit: cover` for the bounded wide case; do not shrink only the image
inside a wider rounded container.

```tsx
<StaticContainer
  width="100%"
  height={`min(
    calc(100vi * 0.6667),
    calc(
      100vb - var(--uit-header-area-length) - var(--uit-spacing-5xl) -
      var(--uit-spacing-xlarge) - var(--uit-spacing-small)
    )
  )`}
  clipContent>
  <img className="media-image" src={photo.src} alt={photo.alt} />
</StaticContainer>
```

The StaticContainer content wrapper fills every explicitly sized axis. Keep the
image at `inline-size: 100%` and `block-size: 100%`; never counteract the public
root geometry with an image max-size, ratio, self-alignment, or authored width.

Use one edge-to-edge Panel for coherent reading information. Inside it, apply
one `var(--uit-spacing-large)` content inset and the News text-stack rhythm:

- all-caps secondary `META2` eyebrow;
- a lead and directly related detail separated by
  `var(--uit-spacing-small)`;
- secondary `META3` source/context;
- `calc(var(--uit-spacing-large) + var(--uit-spacing-xsmall))` between the
  eyebrow, lead/detail group, and source/context.

Store eyebrow values in uppercase or call `toUpperCase()` at render time. Do
not assume title-cased source data satisfies an all-caps field role. Uppercase
only the value serving as the eyebrow/category label. Keep title, Card place,
lead, detail, and source/context strings in their authored natural case; never
call `toUpperCase()` on source/context.

Do not repeat the Page title inside the Panel. Do not add another rounded
surface around text. The detail ScrollView receives `insetForHeader`,
`tabIndex={0}`, and a concise `ariaLabel` so D-pad scroll works without an
invented focus target.

Do not assign application classes to StaticContainer or Panel. Their public
props own their roots; only the ordinary child inset and image need authored
classes. Do not add pull quotes, metadata grids, extra field sections, or a
trailing scroll spacer. Keep the route to the one media region and one concise
Panel.

## Root CSS

Set `html`, `body`, and the mount root to full available inline/block size,
zero margin, and `var(--uit-color-background-window)`. Use `box-sizing:
border-box`. Apart from media geometry, use only the toolkit tokens and responsive
layout. Do not add extra top spacing when `insetForHeader` is present.

Apart from the root reset and `.media-image`, authored CSS may define only the
ordinary Card text stack and Panel text-stack wrappers using the toolkit spacing tokens. Do
not author letter spacing, font metrics, scrollbar rules, body overflow,
focus-ring compensation, wrappers, pseudo-elements, or raw lengths.

## Verification

Before terminal verification, confirm:

- package dependencies consume public package exports; no source aliases;
- collection and detail each have exactly one vertical scroll owner;
- Carousel is a direct edge-to-edge ScrollView child;
- every Card is interactive, labeled, and nonzero; no decorative Card exists;
- every image loads and paints inside a nonzero parent;
- every media asset is a local raster photograph, not SVG/vector artwork;
- Back restores the centered item and visible focus;
- no implementation, D-pad, mock-data, or design-system explanation appears in
  product copy;
- no heading/display/numeral style, hardcoded viewport dimension, raw
  spacing/color/corner, internal selector, or fake component is present.

Then run this skill's focused verifier. When it succeeds, return immediately.
Do not start or probe a development, preview, or HTTP server; runtime acceptance
belongs to the caller.
