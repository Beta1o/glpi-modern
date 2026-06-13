import assert from "node:assert/strict";
import test from "node:test";
import { createStore } from "../src/store.ts";

test("store returns seeded service desk data", () => {
  const store = createStore();
  assert.equal(store.listAssets().length, 3);
  assert.equal(store.listTickets().length, 2);
  assert.equal(store.metrics().openTickets, 2);
});

test("store creates a validated ticket", () => {
  const store = createStore();
  const ticket = store.createTicket({
    title: " Replace failed access point ",
    requester: "Network operations",
    priority: "urgent",
    assetId: "ast-router-002"
  });

  assert.equal(ticket.number, "INC-1003");
  assert.equal(ticket.title, "Replace failed access point");
  assert.equal(ticket.priority, "urgent");
  assert.equal(store.metrics().urgentTickets, 1);
});

test("store rejects unknown assets", () => {
  const store = createStore();
  assert.throws(
    () => store.createTicket({
      title: "Cannot find attached asset",
      requester: "Service desk",
      assetId: "missing"
    }),
    /assetId does not exist/
  );
});
