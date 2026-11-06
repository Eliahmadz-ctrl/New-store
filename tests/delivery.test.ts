import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultDeliveryLocations, expandDeliveryLocations } from "../src/data";

test("each original destination has an independent selection at its original fee", () => {
  const get = (name: string) => defaultDeliveryLocations.find(l => l.name === name);
  for (const [name, fee] of [["Ndola", 30], ["Kitwe", 30], ["Kabwe", 40], ["Kapiri", 40], ["Chinsali", 150], ["Mansa", 150], ["Samfya", 150], ["Lusaka", 40]] as const) assert.equal(get(name)?.fee, fee);
  assert.notEqual(get("Ndola")?.id, get("Kitwe")?.id);
  assert.equal(new Set(defaultDeliveryLocations.map(l => l.id)).size, defaultDeliveryLocations.length);
});

test("legacy grouped locations preserve customised prices and custom entries", () => {
  const legacy = [{ id: "cb-town", name: "Ndola, Kitwe, Mufulira, Luanshya, Chingola, Chililabombwe", fee: 99, province: "Copperbelt" }, { id: "custom", name: "Bed & Breakfast", fee: 12, province: "Custom" }];
  const expanded = expandDeliveryLocations(legacy);
  assert.equal(expanded.length, 7);
  assert.equal(expanded.find(l => l.name === "Kitwe")?.fee, 99);
  assert.equal(expanded.at(-1)?.name, "Bed & Breakfast");
  assert.deepEqual(expandDeliveryLocations(expanded), expanded);
});
