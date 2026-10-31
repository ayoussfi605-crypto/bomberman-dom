export default function normalizeChildren(children) {
  return children
    .flat(Infinity)
    .filter((child) => {
      return (
        child !== null && child !== undefined && typeof child !== "boolean"
      );
    })
    .map((child) => {
      if (typeof child === "number") {
        return String(child);
      }

      return child;
    });
}
