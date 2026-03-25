import test from "node:test";
import assert from "node:assert/strict";

import { paths, tags } from "../packages/mutaflow/dist/next.js";

test("tags builder creates dot-separated invalidation entries", () => {
  assert.deepEqual(tags.posts.list(), {
    kind: "tag",
    value: "posts.list",
  });

  assert.deepEqual(tags.posts.byId(42), {
    kind: "tag",
    value: "posts.byId.42",
  });
});

test("paths builder creates slash-separated invalidation entries", () => {
  assert.deepEqual(paths.posts.list(), {
    kind: "path",
    value: "/posts/list",
  });

  assert.deepEqual(paths.dashboard.user("42", "settings"), {
    kind: "path",
    value: "/dashboard/user/42/settings",
  });
});
