export const BackLink = ({ onBack }: { onBack: () => void }) => (
  <button
    type="button"
    onClick={onBack}
    className="self-center text-xs text-muted-foreground hover:text-foreground hover:underline"
  >
    로그인으로 돌아가기
  </button>
)
