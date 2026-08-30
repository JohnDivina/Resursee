export function cn(...classes: (string | undefined | null | false | Record<string, boolean>)[]) {
  return classes
    .filter(Boolean)
    .map((c) => {
      if (typeof c === 'string') return c;
      if (typeof c === 'object' && c !== null) {
        return Object.entries(c)
          .filter(([, val]) => Boolean(val))
          .map(([key]) => key)
          .join(' ');
      }
      return '';
    })
    .join(' ')
    .trim();
}
