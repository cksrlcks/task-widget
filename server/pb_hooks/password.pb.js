// 비밀번호 재설정 확인 시 hasPassword = true (e.next()가 저장하므로 그 전에 세팅)
onRecordConfirmPasswordResetRequest((e) => {
  e.record.set("hasPassword", true)
  e.next()
}, "users")
