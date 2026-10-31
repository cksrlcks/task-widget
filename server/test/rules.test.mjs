import assert from "node:assert/strict"
import { createHmac } from "node:crypto"
import { DatabaseSync } from "node:sqlite"
import { before, test } from "node:test"
import PocketBase from "pocketbase"

const URL = process.env.PB_URL ?? "http://127.0.0.1:8090"
const pw = "Passw0rd-test-123"
const uid = Date.now().toString(36)
const admin = new PocketBase(URL)
const client = () => new PocketBase(URL)
let A, B, pbA, pbB

const mkUser = (name, extra = {}) =>
  admin.collection("users").create({
    email: `${name}-${uid}@test.local`,
    password: pw,
    passwordConfirm: pw,
    verified: true,
    hasPassword: true,
    ...extra,
  })

before(async () => {
  await admin
    .collection("_superusers")
    .authWithPassword(process.env.PB_ADMIN_EMAIL, process.env.PB_ADMIN_PASSWORD)
  A = await mkUser("a")
  B = await mkUser("b")
  pbA = client()
  pbB = client()
  await pbA.collection("users").authWithPassword(A.email, pw)
  await pbB.collection("users").authWithPassword(B.email, pw)
})

test("user B cannot list user A's todos", async () => {
  await pbA.collection("todos").create({ title: "a-todo", user: A.id })
  const listAsB = await pbB.collection("todos").getFullList()
  assert.equal(listAsB.length, 0)
})

test("user B cannot create todo with user=A", async () => {
  await assert.rejects(pbB.collection("todos").create({ title: "x", user: A.id }))
})

test("unverified user cannot log in with password", async () => {
  const u = await mkUser("unv", { verified: false })
  await assert.rejects(client().collection("users").authWithPassword(u.email, pw))
})

test("password reset confirm sets hasPassword", async () => {
  const u = await mkUser("rst", { hasPassword: false })
  // 메일 없이 토큰을 얻을 수 없어 서버 서명 방식대로 직접 만든다: HS256, key = record.tokenKey + collection.passwordResetToken.secret
  // (둘 다 API에 노출되지 않아 PocketBase sqlite 파일을 읽기 전용으로 읽는다)
  const db = new DatabaseSync(`${process.env.PB_DATA_DIR ?? "server/pb_data"}/data.db`, { readOnly: true })
  const col = await admin.collections.getOne("users")
  const secret = JSON.parse(db.prepare("select options from _collections where id = ?").get(col.id).options).passwordResetToken.secret
  const tokenKey = db.prepare("select tokenKey from users where id = ?").get(u.id).tokenKey
  db.close()
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url")
  const head = b64({ alg: "HS256", typ: "JWT" })
  const body = b64({
    id: u.id,
    type: "passwordReset",
    collectionId: col.id,
    email: u.email,
    exp: Math.floor(Date.now() / 1000) + 600,
  })
  const key = tokenKey + secret
  const sig = createHmac("sha256", key).update(`${head}.${body}`).digest("base64url")
  await client().collection("users").confirmPasswordReset(`${head}.${body}.${sig}`, "New-Passw0rd-456", "New-Passw0rd-456")
  const after = await admin.collection("users").getOne(u.id)
  assert.equal(after.hasPassword, true)
})

test("events.date rejects non YYYY-MM-DD", async () => {
  await assert.rejects(pbA.collection("events").create({ title: "x", date: "2026-1-1", user: A.id }))
  await pbA.collection("events").create({ title: "ok", date: "2026-01-01", time: "", user: A.id })
})
