# Design system

## Dark-only by decision

Kadence renders one theme. `app.json` sets `userInterfaceStyle: "dark"`, the
status bar is pinned to `light`, and the navigation theme is pinned to
`DarkTheme`; the app never follows the device scheme.

Consequently there is **no light palette**. `constants/theme.ts` exports a
single flat `Colors` object, and components read it directly — there is no
`useThemeColor` hook and no `light`/`dark` variant of a token.

If light mode is ever required, do not reintroduce ad-hoc `Colors.light` /
`Colors.dark` branches. Restore a `themes` map keyed by colour scheme behind
the existing semantic token names, and have `ThemedText` / `ThemedView`
resolve from it, so call sites keep asking for `textPrimary` rather than a
scheme.

## Colours

`constants/theme.ts` is the source of truth:

- `Colors` — semantic roles (canvas, surfaces, borders, text, icons, accent,
  status, objects). Names describe purpose, not hue.
- `Gradients` — brand gradients shared by more than one component.
- `CategoryColors` — the user-facing category swatch palette.
- `withAlpha(hex, opacity)` — builds an `rgba()` string from a token when only
  a fragment of a colour is needed.

One-off colours that are not part of the brand or a semantic state stay next
to their component.

`back-end/src/shared/email/email-theme.ts` mirrors these groups for the
transactional emails. Change a shared colour in both files; the parity test in
`constants/__tests__/theme-parity.test.ts` guards the shared brand tokens.

## Typography

`constants/typography.ts` models family, size, weight, line height and letter
spacing as independent axes. `ThemedText` takes a `variant` preset plus
per-axis overrides:

```tsx
<ThemedText variant="body" weight="600" />
<ThemedText variant="heading" font="system" />
```

Family and weight are independent, and line height is resolved per family and
size (`LINE_HEIGHT`) rather than from a single ratio. The two families are
`mono` (IBM Plex Mono) and `system`; `MONO_FONTS` lists the loaded mono
weights, so adding one means updating both that map and `MONO_FAMILY` in the
same file.
