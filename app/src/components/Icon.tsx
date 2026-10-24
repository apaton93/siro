/** Simple stroke icons. Decorative by default – label the button/link, not the icon. */
const paths = {
  back: <path d="M15 5l-7 7 7 7" />,
  share: <path d="M12 3v13M7 8l5-5 5 5M5 14v6h14v-6" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </>
  ),
  home: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  pin: (
    <>
      <path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z" />
      <circle cx="12" cy="9" r="2.5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </>
  ),
  check: <path d="M5 12l5 5 9-10" />,
  external: <path d="M14 5h5v5M19 5l-8 8M10 5H5v14h14v-5" />,
}

export type IconName = keyof typeof paths

export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="square"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  )
}
