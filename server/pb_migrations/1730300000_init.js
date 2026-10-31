/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const users = app.findCollectionByNameOrId("users")
  users.passwordAuth.enabled = true
  users.oauth2.enabled = true
  users.authRule = "verified = true"
  users.deleteRule = "id = @request.auth.id"
  users.fields.add(new BoolField({ name: "hasPassword" }))
  app.save(users)

  const own = '@request.auth.id != "" && user = @request.auth.id'
  const create = own + ' && @request.body.user = @request.auth.id'
  const common = (name, fields) =>
    new Collection({
      type: "base",
      name,
      listRule: own,
      viewRule: own,
      updateRule: own,
      deleteRule: own,
      createRule: create,
      fields: [
        ...fields,
        { type: "relation", name: "user", required: true, collectionId: users.id, cascadeDelete: true, maxSelect: 1 },
        { type: "autodate", name: "created", onCreate: true },
        { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
      ],
    })

  app.save(common("todos", [
    { type: "text", name: "title", required: true, max: 500 },
    { type: "bool", name: "done" },
  ]))
  app.save(common("events", [
    { type: "text", name: "title", required: true, max: 200 },
    { type: "text", name: "date", required: true, pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
    { type: "text", name: "time", pattern: "^$|^\\d{2}:\\d{2}$" },
    { type: "text", name: "memo", max: 2000 },
  ]))
}, (app) => {
  app.delete(app.findCollectionByNameOrId("events"))
  app.delete(app.findCollectionByNameOrId("todos"))
  const users = app.findCollectionByNameOrId("users")
  users.fields.removeByName("hasPassword")
  app.save(users)
})
