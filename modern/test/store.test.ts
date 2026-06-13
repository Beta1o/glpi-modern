import assert from "node:assert/strict";
import test from "node:test";
import {
  mapGlpiPriority,
  mapGlpiStatus,
  mapGlpiTicketType,
  normalizeTicketPatch,
  normalizeTicketInput,
  parseAssetId,
  stripHtml
} from "../src/store.ts";

test("maps GLPI ticket status constants exactly", () => {
  assert.deepEqual(mapGlpiStatus(1), {
    statusValue: 1,
    statusKey: "new",
    statusLabel: "New"
  });
  assert.deepEqual(mapGlpiStatus(2), {
    statusValue: 2,
    statusKey: "assigned",
    statusLabel: "Assigned"
  });
  assert.deepEqual(mapGlpiStatus(3), {
    statusValue: 3,
    statusKey: "planned",
    statusLabel: "Planned"
  });
  assert.deepEqual(mapGlpiStatus(4), {
    statusValue: 4,
    statusKey: "waiting",
    statusLabel: "Waiting"
  });
  assert.deepEqual(mapGlpiStatus(5), {
    statusValue: 5,
    statusKey: "solved",
    statusLabel: "Solved"
  });
  assert.deepEqual(mapGlpiStatus(6), {
    statusValue: 6,
    statusKey: "closed",
    statusLabel: "Closed"
  });
});

test("normalizes GLPI ticket update fields", () => {
  assert.deepEqual(
    normalizeTicketPatch({
      content: "Updated content",
      priority: "5",
      status: "2",
      title: "Updated ticket",
      type: "2"
    }),
    {
      content: "Updated content",
      priority: 5,
      status: 2,
      title: "Updated ticket",
      type: 2
    }
  );
});

test("maps GLPI priority constants exactly", () => {
  assert.equal(mapGlpiPriority(1).priorityLabel, "Very low");
  assert.equal(mapGlpiPriority(2).priorityLabel, "Low");
  assert.equal(mapGlpiPriority(3).priorityLabel, "Medium");
  assert.equal(mapGlpiPriority(4).priorityLabel, "High");
  assert.equal(mapGlpiPriority(5).priorityLabel, "Very high");
  assert.equal(mapGlpiPriority(6).priorityLabel, "Major");
});

test("maps GLPI ticket type constants exactly", () => {
  assert.deepEqual(mapGlpiTicketType(1), {
    typeValue: 1,
    typeLabel: "Incident"
  });
  assert.deepEqual(mapGlpiTicketType(2), {
    typeValue: 2,
    typeLabel: "Request"
  });
});

test("normalizes new tickets for GLPI table inserts", () => {
  assert.deepEqual(
    normalizeTicketInput({
      assetId: "Computer:42",
      content: "<p>Cannot boot</p>",
      priority: "4",
      requesterId: "2",
      title: "Workstation failure",
      type: "1"
    }),
    {
      asset: { itemType: "Computer", legacyId: 42 },
      content: "<p>Cannot boot</p>",
      impact: 4,
      priority: 4,
      requesterId: 2,
      title: "Workstation failure",
      type: 1,
      urgency: 4
    }
  );
});

test("parses GLPI item links and strips legacy HTML", () => {
  assert.deepEqual(parseAssetId("NetworkEquipment:7"), {
    itemType: "NetworkEquipment",
    legacyId: 7
  });
  assert.equal(stripHtml("<p>Hello&nbsp;&amp;&nbsp;bye<br>now</p>"), "Hello & bye\nnow");
});
