/**
 * Scroll reveals: every `.rv` element fades and settles once as it enters the
 * viewport, then stops being observed. Threshold 0.12 so a tall section starts
 * revealing as soon as its top edge is committed, not when it is fully in.
 *
 * Elements are found by class rather than per-component refs so a new section
 * only has to add `rv` — no wiring.
 */
export function useReveal() {
  onMounted(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>('.rv'))

    // No IntersectionObserver (or the visitor asked for less motion): show
    // everything immediately rather than leaving the page blank.
    if (
      !('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      targets.forEach((el) => el.classList.add('in'))
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add('in')
            io.unobserve(en.target)
          }
        })
      },
      { threshold: 0.12 },
    )

    targets.forEach((el) => io.observe(el))
    onUnmounted(() => io.disconnect())
  })
}
