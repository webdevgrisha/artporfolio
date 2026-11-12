/** An image that vite-imagetools makes at build time from an import with directives. */
declare module "*&as=srcset" {
  const srcset: string;
  export default srcset;
}

declare module "*&format=webp" {
  const url: string;
  export default url;
}
