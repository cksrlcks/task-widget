/// <reference path="../pb_data/types.d.ts" />

// 할 일 순서(끌어서 바꾸기). 작을수록 위. 기존 항목은 0이라 만든 순서대로 놓인다
migrate((app) => {
  const c = app.findCollectionByNameOrId("todos")
  c.fields.add(new NumberField({ name: "position" }))
  app.save(c)
}, (app) => {
  const c = app.findCollectionByNameOrId("todos")
  c.fields.removeByName("position")
  app.save(c)
})
