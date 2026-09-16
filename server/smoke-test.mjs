/**
 * End-to-end smoke test for server/index.js using an in-memory MongoDB.
 *
 *   node server/smoke-test.mjs
 *
 * Starts a throwaway MongoDB, boots the API, and exercises every endpoint:
 * seeding, admin login, products, reviews, enquiries, image
 * upload/serve/delete. Exits 0 on success, 1 on failure.
 */

import assert from "assert";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.PORT = "3099";
process.env.ADMIN_USERNAME = "admin";
process.env.ADMIN_PASSWORD = "test-pass";

const base = "http://localhost:3099";

const memoryServer = await MongoMemoryServer.create();
process.env.MONGODB_URI = memoryServer.getUri("skfurniture_test");

// Import after env vars are set so the server picks them up.
await import("./index.js");

// Wait for the API to come up.
for (let i = 0; i < 60; i++) {
  try {
    const res = await fetch(`${base}/api/health`);
    if (res.ok) break;
  } catch {
    // not up yet
  }
  await new Promise((r) => setTimeout(r, 500));
  if (i === 59) {
    console.error("API did not start in time");
    process.exit(1);
  }
}

const json = async (res) => {
  const text = await res.text();
  return text ? JSON.parse(text) : {};
};

// 1. Health
{
  const res = await fetch(`${base}/api/health`);
  assert.equal(res.status, 200);
  console.log("✓ health");
}

// 2. Products seeded
let products;
{
  const res = await fetch(`${base}/api/products`);
  assert.equal(res.status, 200);
  products = await json(res);
  assert.equal(products.length, 4);
  assert.equal(products[0].name, "Modular Kitchens");
  assert.ok(products[0]._id);
  console.log("✓ products seeded (4 services)");
}

// 3. Public gallery empty, admin auth required
{
  const res = await fetch(`${base}/api/gallery`);
  assert.equal(res.status, 200);
  assert.deepEqual(await json(res), []);
  const statsRes = await fetch(`${base}/api/admin/stats`);
  assert.equal(statsRes.status, 401);
  console.log("✓ gallery empty; admin endpoints reject anonymous access");
}

// 4. Admin login (bad + good)
let token;
{
  const bad = await fetch(`${base}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "wrong" }),
  });
  assert.equal(bad.status, 401);

  const good = await fetch(`${base}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "test-pass" }),
  });
  assert.equal(good.status, 200);
  token = (await json(good)).token;
  assert.ok(token);
  console.log("✓ admin login (rejects wrong password, issues token)");
}

const auth = { Authorization: `Bearer ${token}` };

// 5. Stats
{
  const res = await fetch(`${base}/api/admin/stats`, { headers: auth });
  const stats = await json(res);
  assert.equal(stats.products, 4);
  assert.equal(stats.images, 0);
  console.log("✓ admin stats");
}

// 6. Update a product rate
{
  const res = await fetch(`${base}/api/admin/products/${products[0]._id}`, {
    method: "PATCH",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Modular Kitchens",
      description: "Updated description",
      price: 15999,
    }),
  });
  assert.equal(res.status, 200);
  const updated = await json(await fetch(`${base}/api/products`));
  const first = updated[0];
  assert.equal(first.price, 15999);
  assert.equal(first.description, "Updated description");
  console.log("✓ product rate update reflects on the public site");
}

// 7. Review flow: submit → pending → approve → visible publicly
let reviewId;
{
  const submit = await fetch(`${base}/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Ramesh", rating: 5, text: "Great work, on time." }),
  });
  assert.equal(submit.status, 201);
  reviewId = (await json(submit))._id;

  let publicReviews = await (await fetch(`${base}/api/reviews`)).json();
  assert.equal(publicReviews.length, 0); // pending = hidden

  const approve = await fetch(`${base}/api/admin/reviews/${reviewId}`, {
    method: "PATCH",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ status: "approved" }),
  });
  assert.equal(approve.status, 200);

  publicReviews = await (await fetch(`${base}/api/reviews`)).json();
  assert.equal(publicReviews.length, 1);
  assert.equal(publicReviews[0].name, "Ramesh");

  const adminReviews = await (
    await fetch(`${base}/api/admin/reviews`, { headers: auth })
  ).json();
  assert.equal(adminReviews.length, 1);
  console.log("✓ review submit → moderation → public visibility");
}

// 8. Enquiry flow: submit → list → handle → delete
{
  const submit = await fetch(`${base}/api/enquiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Priya",
      phone: "9876543210",
      message: "Need an L-shaped kitchen quote",
    }),
  });
  assert.equal(submit.status, 201);

  const enquiries = await (
    await fetch(`${base}/api/admin/enquiries`, { headers: auth })
  ).json();
  assert.equal(enquiries.length, 1);
  assert.equal(enquiries[0].status, "new");

  const handled = await fetch(`${base}/api/admin/enquiries/${enquiries[0]._id}`, {
    method: "PATCH",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ status: "handled" }),
  });
  assert.equal(handled.status, 200);

  const del = await fetch(`${base}/api/admin/enquiries/${enquiries[0]._id}`, {
    method: "DELETE",
    headers: auth,
  });
  assert.equal(del.status, 200);

  const after = await (
    await fetch(`${base}/api/admin/enquiries`, { headers: auth })
  ).json();
  assert.equal(after.length, 0);
  console.log("✓ enquiry submit → handle → delete");
}

// 9. Image upload → serve → delete (GridFS)
{
  // 1x1 transparent PNG
  const pngBase64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
  const form = new FormData();
  form.append("title", "Test kitchen");
  form.append(
    "file",
    new Blob([Buffer.from(pngBase64, "base64")], { type: "image/png" }),
    "kitchen.png",
  );

  const upload = await fetch(`${base}/api/admin/images`, {
    method: "POST",
    headers: auth,
    body: form,
  });
  assert.equal(upload.status, 201);
  const image = await json(upload);
  assert.equal(image.title, "Test kitchen");

  const served = await fetch(image.url);
  assert.equal(served.status, 200);
  assert.equal(served.headers.get("content-type"), "image/png");

  const gallery = await (await fetch(`${base}/api/gallery`)).json();
  assert.equal(gallery.length, 1);

  const del = await fetch(`${base}/api/admin/images/${image._id}`, {
    method: "DELETE",
    headers: auth,
  });
  assert.equal(del.status, 200);

  const gone = await fetch(image.url);
  assert.equal(gone.status, 404);
  console.log("✓ image upload → serve → delete (GridFS)");
}

// 10b. Add gallery image by external URL (talkntea-style)
{
  const add = await fetch(`${base}/api/admin/image-links`, {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ url: "https://example.com/kitchen.jpg", title: "Linked kitchen" }),
  });
  assert.equal(add.status, 201);
  const linked = await json(add);
  assert.equal(linked.url, "https://example.com/kitchen.jpg");
  assert.equal(linked.title, "Linked kitchen");

  const bad = await fetch(`${base}/api/admin/image-links`, {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ url: "not-a-url" }),
  });
  assert.equal(bad.status, 400);

  const anon = await fetch(`${base}/api/admin/image-links`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: "https://example.com/x.jpg" }),
  });
  assert.equal(anon.status, 401);

  const gallery = await (await fetch(`${base}/api/gallery`)).json();
  assert.equal(gallery[0].url, "https://example.com/kitchen.jpg");

  const del = await fetch(`${base}/api/admin/images/${linked._id}`, {
    method: "DELETE",
    headers: auth,
  });
  assert.equal(del.status, 200);
  console.log("✓ image add by URL (validation + auth + delete)");
}

// 10. Logout invalidates the token
{
  await fetch(`${base}/api/admin/logout`, { method: "POST", headers: auth });
  const res = await fetch(`${base}/api/admin/stats`, { headers: auth });
  assert.equal(res.status, 401);
  console.log("✓ logout invalidates the admin session");
}

console.log("\nAll smoke tests passed ✅");
process.exit(0);
