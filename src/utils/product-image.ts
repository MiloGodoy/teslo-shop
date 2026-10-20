// Compatibility for catalogs created with the old seed's missing filenames.
const localAliases: Record<string, string> = {
  '1740507-00-A_0_2000.jpg': '1740507-00-A_1.jpg',
  '1549268-00-A_2.jpg': '1549268-00-A_0_2000.jpg',
  '1740226-00-A_0_2000.jpg': '1740226-00-A_1.jpg',
  '9877040-00-A_1.jpg': '9877040-00-A_0_2000.jpg',
  '100042307_alt_2000.jpg': '100042307_alt.jpg',
  '1473809-00-A_alt.jpg': '1473809-00-A_1_2000.jpg',
  '8765100-00-A_0_2000.jpg': '/imgs/placeholder.jpg',
  '8765100-00-A_1.jpg': '/imgs/placeholder.jpg',
};
export function getProductImageSrc(src?: string | null): string {
  if (!src) return '/imgs/placeholder.jpg';
  src = localAliases[src] ?? src;
  if (/^https:\/\//.test(src) || src.startsWith('/')) return src;
  return `/products/${src}`;
}
