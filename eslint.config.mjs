import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    // ON, against the preset, for the reason gymmer-nuxt's config gives at
    // length: TypeScript reports unreachable code, and that is not the same as
    // the error being seen. A bare `return` with its expression on the next
    // line is valid JavaScript — ASI closes the return and strands the
    // expression — and it shipped once already.
    'no-unreachable': 'error',
  },
})
