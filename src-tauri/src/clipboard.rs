//! 클립보드 섹션.
//! Windows: 시스템 클립보드 기록(Win+V)을 그대로 읽고 쓴다. 바뀌면 "clipboard-changed"로 알려 프론트가 다시 읽는다.
//! 그 밖(macOS): 시스템 기록을 읽는 공개 API가 없어, 새 텍스트를 "clipboard-text"로 알리고 프론트가 직접 기록한다.

use tauri::{AppHandle, Emitter};

pub fn watch(app: AppHandle) {
    std::thread::spawn(move || {
        #[cfg(windows)]
        {
            use windows::Win32::System::DataExchange::GetClipboardSequenceNumber;
            let mut seq = 0;
            loop {
                std::thread::sleep(std::time::Duration::from_millis(500));
                let s = unsafe { GetClipboardSequenceNumber() };
                if s != seq {
                    seq = s;
                    let _ = app.emit_to("widget", "clipboard-changed", ());
                }
            }
        }
        #[cfg(not(windows))]
        {
            let Ok(mut cb) = arboard::Clipboard::new() else { return };
            let mut last = String::new();
            loop {
                std::thread::sleep(std::time::Duration::from_millis(500));
                // ponytail: 바뀐 여부를 못 봐서 매번 읽고, 비밀번호 관리자 표시(ConcealedType)도 안 거른다
                let Ok(text) = cb.get_text() else { continue };
                if text == last || text.trim().is_empty() {
                    continue;
                }
                last = text.clone();
                let _ = app.emit_to("widget", "clipboard-text", text);
            }
        }
    });
}

#[cfg(windows)]
mod win {
    use std::collections::HashMap;
    use std::sync::{LazyLock, Mutex};
    use windows::ApplicationModel::DataTransfer::{
        Clipboard, ClipboardHistoryItem, ClipboardHistoryItemsResultStatus, DataPackageView,
        StandardDataFormats,
    };
    use windows::Graphics::Imaging::{
        BitmapAlphaMode, BitmapDecoder, BitmapEncoder, BitmapInterpolationMode, BitmapPixelFormat,
        BitmapTransform, ColorManagementMode, ExifOrientationMode,
    };
    use windows::Security::Cryptography::CryptographicBuffer;
    use windows::Storage::Streams::{Buffer, InMemoryRandomAccessStream, InputStreamOptions};
    use windows::Win32::System::Com::{CoInitializeEx, COINIT_APARTMENTTHREADED};

    /// 화면에 보일 만큼만 넘긴다. 다시 복사할 때는 id로 원본 항목을 쓴다
    const PREVIEW: usize = 1000;
    /// 이미지 썸네일의 긴 변(px)
    const THUMB: f64 = 360.0;

    /// 항목 id → 썸네일(data URL). 같은 이미지를 매번 다시 줄이지 않게
    static THUMBS: LazyLock<Mutex<HashMap<String, String>>> = LazyLock::new(Default::default);

    #[derive(serde::Serialize)]
    pub struct Clip {
        id: String,
        /// 이미지 항목은 빈 문자열
        text: String,
        image: Option<String>,
    }

    /// WinRT Clipboard는 STA 스레드에서만 돈다. 호출마다 짧게 STA 스레드를 띄운다
    fn sta<T: Send + 'static>(
        f: impl FnOnce() -> Result<T, String> + Send + 'static,
    ) -> Result<T, String> {
        std::thread::spawn(move || {
            let _ = unsafe { CoInitializeEx(None, COINIT_APARTMENTTHREADED) };
            f()
        })
        .join()
        .map_err(|_| "clipboard thread panicked".to_string())?
    }

    fn msg(e: windows::core::Error) -> String {
        e.message()
    }

    /// 기록 항목들. 꺼져 있으면 "disabled"(프론트가 안내 문구로 바꾼다)
    fn items() -> Result<Vec<ClipboardHistoryItem>, String> {
        if !Clipboard::IsHistoryEnabled().map_err(msg)? {
            return Err("disabled".into());
        }
        let r = Clipboard::GetHistoryItemsAsync().map_err(msg)?.join().map_err(msg)?;
        match r.Status().map_err(msg)? {
            ClipboardHistoryItemsResultStatus::Success => {
                Ok(r.Items().map_err(msg)?.into_iter().collect())
            }
            ClipboardHistoryItemsResultStatus::ClipboardHistoryDisabled => Err("disabled".into()),
            _ => Err("denied".into()),
        }
    }

    fn find(id: &str) -> Result<ClipboardHistoryItem, String> {
        items()?
            .into_iter()
            .find(|it| it.Id().is_ok_and(|i| i == id))
            .ok_or_else(|| "기록에서 항목을 찾지 못했습니다.".into())
    }

    /// 이미지를 긴 변 THUMB px 이하 PNG data URL로
    fn thumbnail(c: &DataPackageView) -> windows::core::Result<String> {
        let src = c.GetBitmapAsync()?.join()?.OpenReadAsync()?.join()?;
        let dec = BitmapDecoder::CreateAsync(&src)?.join()?;
        let (w, h) = (dec.OrientedPixelWidth()?, dec.OrientedPixelHeight()?);
        let scale = (THUMB / w.max(h) as f64).min(1.0);
        let (tw, th) = (
            ((w as f64 * scale).round() as u32).max(1),
            ((h as f64 * scale).round() as u32).max(1),
        );
        let t = BitmapTransform::new()?;
        t.SetScaledWidth(tw)?;
        t.SetScaledHeight(th)?;
        t.SetInterpolationMode(BitmapInterpolationMode::Fant)?;
        let px = dec
            .GetPixelDataTransformedAsync(
                BitmapPixelFormat::Bgra8,
                BitmapAlphaMode::Premultiplied,
                &t,
                ExifOrientationMode::RespectExifOrientation,
                ColorManagementMode::DoNotColorManage,
            )?
            .join()?
            .DetachPixelData()?;
        let out = InMemoryRandomAccessStream::new()?;
        let enc = BitmapEncoder::CreateAsync(BitmapEncoder::PngEncoderId()?, &out)?.join()?;
        enc.SetPixelData(
            BitmapPixelFormat::Bgra8,
            BitmapAlphaMode::Premultiplied,
            tw,
            th,
            96.0,
            96.0,
            &px,
        )?;
        enc.FlushAsync()?.join()?;
        let size = out.Size()? as u32;
        let buf = out
            .GetInputStreamAt(0)?
            .ReadAsync(&Buffer::Create(size)?, size, InputStreamOptions::None)?
            .join()?;
        Ok(format!(
            "data:image/png;base64,{}",
            CryptographicBuffer::EncodeToBase64String(&buf)?
        ))
    }

    /// 최근 순 텍스트·이미지 항목. 그 밖의 형식(파일 등)은 건너뛴다
    #[tauri::command]
    pub async fn clipboard_history() -> Result<Vec<Clip>, String> {
        sta(|| {
            let text = StandardDataFormats::Text().map_err(msg)?;
            let bitmap = StandardDataFormats::Bitmap().map_err(msg)?;
            let mut thumbs = THUMBS.lock().unwrap();
            let clips: Vec<Clip> = items()?
                .into_iter()
                .filter_map(|it| {
                    let id = it.Id().ok()?.to_string();
                    let c = it.Content().ok()?;
                    if c.Contains(&text).ok()? {
                        let t = c.GetTextAsync().ok()?.join().ok()?.to_string();
                        return Some(Clip { id, text: t.chars().take(PREVIEW).collect(), image: None });
                    }
                    if !c.Contains(&bitmap).ok()? {
                        return None;
                    }
                    let image = match thumbs.get(&id) {
                        Some(u) => u.clone(),
                        None => {
                            let u = thumbnail(&c).ok()?;
                            thumbs.insert(id.clone(), u.clone());
                            u
                        }
                    };
                    Some(Clip { id, text: String::new(), image: Some(image) })
                })
                .collect();
            // 기록에서 빠진 항목의 썸네일은 버린다
            thumbs.retain(|id, _| clips.iter().any(|c| &c.id == id));
            Ok(clips)
        })
    }

    /// 그 항목을 현재 클립보드로(Win+V에서 고르는 것과 같다)
    #[tauri::command]
    pub async fn clipboard_history_use(id: String) -> Result<(), String> {
        sta(move || {
            Clipboard::SetHistoryItemAsContent(&find(&id)?).map_err(msg)?;
            Ok(())
        })
    }

    #[tauri::command]
    pub async fn clipboard_history_delete(id: String) -> Result<(), String> {
        sta(move || {
            Clipboard::DeleteItemFromHistory(&find(&id)?).map_err(msg)?;
            Ok(())
        })
    }

    /// Win+V의 "모두 지우기"와 같다. 고정한 항목은 남는다
    #[tauri::command]
    pub async fn clipboard_history_clear() -> Result<(), String> {
        sta(|| {
            Clipboard::ClearHistory().map_err(msg)?;
            Ok(())
        })
    }
}

#[cfg(windows)]
pub use win::*;
