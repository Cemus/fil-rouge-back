type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
interface JsonObject {
  [key: string]: JsonValue;
}
interface JsonArray extends Array<JsonValue> {}

export function toCamelCase(input: JsonValue): JsonValue {
  if (Array.isArray(input)) {
    return input.map(toCamelCase);
  }

  if (input !== null && typeof input === "object") {
    const newObject: JsonObject = {};
    for (const key in input) {
      if (Object.hasOwn(input, key)) {
        const newKey = key.replace(/_([a-z])/g, (_, letter) =>
          letter.toUpperCase()
        );
        newObject[newKey] = toCamelCase((input as JsonObject)[key]);
      }
    }
    return newObject;
  }

  if (typeof input === "string" && input.includes("_")) {
    return input.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  return input;
}
