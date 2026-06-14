export default function isRelativeUrl(url) {
  return url[0] === '/' && url[1] !== '/';
}
