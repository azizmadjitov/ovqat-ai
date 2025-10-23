# HomeScreen Architecture

## Overview
HomeScreen is the main dashboard displaying daily nutrition tracking with calendar navigation, macro summary, and meal history.

## Scrolling Architecture

### Design Decision: Natural Page Scroll
We use **natural browser scrolling** instead of fixed containers with overflow:
- ✅ Simple and predictable
- ✅ Works on all devices
- ✅ No nested scroll conflicts
- ✅ Better performance
- ✅ Easier to maintain

### Layout Structure
```
<div className="min-h-screen">          ← Root container (natural scroll)
  <section>CalendarStrip</section>       ← Scrolls with page
  <main>                                 ← Scrolls with page
    <MacroCard />                        ← Scrolls with page
    <RecentlyLoggedList />               ← Scrolls with page
  </main>
  <FabCamera />                          ← Fixed position (CSS)
</div>
```

### Key Points
1. **Root container**: `min-h-screen` ensures minimum viewport height
2. **No overflow constraints**: All content flows naturally
3. **FAB button**: Uses `position: fixed` in CSS (not inline styles)
4. **Safe areas**: Handled with `env(safe-area-inset-*)` on root
5. **Bottom padding**: `pb-32` on main ensures content doesn't hide behind FAB

## Component Responsibilities

### HomeScreen.tsx
- Date management and filtering
- Data calculations (consumed calories/macros)
- Layout orchestration
- Conditional FAB rendering

### CalendarStrip.tsx
- Week view with 7 days
- Date selection
- Visual indicators (dots for meals)

### MacroCard.tsx
- Macro summary display
- Progress rings
- Calories/protein/carbs/fat breakdown

### RecentlyLoggedList.tsx
- Meal history for selected date
- Empty state messaging
- Meal item rendering

### FabCamera.tsx
- Fixed floating action button
- Camera icon with gradient background
- Smooth animations

## Performance Considerations
- Memoize calculations if meal list grows large
- Use React.memo for child components if re-renders are expensive
- Keep date filtering efficient with proper array methods

## Accessibility
- Semantic HTML (`<main>`, `<section>`)
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus management

## Future Improvements
- [ ] Virtual scrolling for very long meal lists
- [ ] Pull-to-refresh gesture
- [ ] Skeleton loading states
- [ ] Optimistic UI updates
