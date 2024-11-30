function toCamelCase(input) {
  if (Array.isArray(input)) {
    return input.map(toCamelCase);
  }

  if (input !== null && typeof input === "object") {
    const newObject = {};
    for (const key in input) {
      if (Object.hasOwn(input, key)) {
        const newKey = key.replace(/_([a-z])/g, (_, letter) =>
          letter.toUpperCase()
        ); //regex pour viser les "_"
        newObject[newKey] = toCamelCase(input[key]);
      }
    }
    return newObject;
  }
  if (typeof input === "string" && input.includes("_")) {
    return input.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }
  return input;
}

module.exports = {
  toCamelCase,
};
