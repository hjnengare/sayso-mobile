# Claude Code Rules — sayso-mobile

## Design Enforcement

### Grid Discipline
- All layout must align to an **8pt base grid** (4pt for fine adjustments)
- Padding and margin values must be multiples of 4: `4, 8, 12, 16, 20, 24, 32, 40, 48`
- No arbitrary pixel values — if it doesn't fit the grid, question the design

### Spacing Scale
- Use only these spacing values: `4 | 8 | 12 | 16 | 20 | 24 | 32 | 40 | 48 | 64`
- Do not invent intermediate values (e.g. no `13`, `17`, `22`, `26`)
- Gap, padding, margin, and insets must all pull from this scale

### Alignment Rules
- Text and icons must align to a consistent baseline grid
- Horizontal alignment: left-align body content, center only for hero/empty states
- Never mix alignment styles within the same list or card component
- Use `alignItems` and `justifyContent` explicitly — no relying on implicit defaults

### Component Reuse
- Before creating a new component, check if an existing one can be extended
- Do not duplicate logic — extract shared patterns into reusable components
- Shared UI lives in `src/components/` — use it, don't reinvent it
- Tokens (colors, spacing, typography) must come from the existing theme/token files

### No Creative Deviation
- Do not introduce new visual styles, color values, shadows, or decorative elements not already in the design system
- Do not add background orbs, gradients, blur effects, or decorative shapes unless explicitly requested
- Match existing component patterns exactly — no "improvements" to visual design without explicit instruction
- When in doubt, replicate what already exists elsewhere in the codebase
