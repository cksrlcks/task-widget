use std::sync::Mutex;
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, PhysicalPosition, PhysicalSize, State, WebviewUrl, WebviewWindowBuilder,
    WindowEvent,
};

/// 화면 설정 중 Rust 쪽에서 쓰는 것. 프론트가 시작할 때와 바뀔 때 apply_window_prefs로 넘긴다
struct Prefs {
    close_to_tray: bool,
    /// 마지막으로 적용한 너비(CSS px). 바뀔 때만 리사이즈해 직접 조절한 크기를 지키지 않게 되는 걸 막는다
    width: Option<u32>,
}

/// 투명도(opacity)는 웹뷰 루트 CSS로 처리해 여기서는 쓰지 않는다(글자가 흐려지지 않게)
#[tauri::command]
fn apply_window_prefs(
    app: AppHandle,
    state: State<Mutex<Prefs>>,
    always_on_top: bool,
    opacity: f64,
    width: u32,
    close_to_tray: bool,
) -> Result<(), String> {
    let _ = opacity;
    let width_changed = {
        let mut st = state.lock().unwrap();
        st.close_to_tray = close_to_tray;
        st.width.replace(width) != Some(width)
    };
    let w = app.get_webview_window("widget").ok_or("widget window not found")?;
    w.set_always_on_top(always_on_top).map_err(|e| e.to_string())?;
    if !width_changed {
        return Ok(());
    }
    // 물리 픽셀로 계산. 너비가 바뀌면 오른쪽 끝을 고정한다
    let scale = w.scale_factor().map_err(|e| e.to_string())?;
    let pos = w.outer_position().map_err(|e| e.to_string())?;
    let size = w.outer_size().map_err(|e| e.to_string())?;
    let new_w = (width as f64 * scale).round() as u32;
    if new_w != size.width {
        let x = pos.x + size.width as i32 - new_w as i32;
        w.set_position(PhysicalPosition::new(x, pos.y)).map_err(|e| e.to_string())?;
        w.set_size(PhysicalSize::new(new_w, size.height)).map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn show_settings(app: &AppHandle) -> tauri::Result<()> {
    if let Some(w) = app.get_webview_window("settings") {
        let _ = w.unminimize();
        let _ = w.show();
        return w.set_focus();
    }
    let built = WebviewWindowBuilder::new(app, "settings", WebviewUrl::App("index.html#settings".into()))
        .title("설정")
        .inner_size(880.0, 732.0)
        .decorations(true)
        .build();
    match built {
        Ok(_) => Ok(()),
        // 거의 동시에 두 번 열렸으면 먼저 만들어진 창을 앞으로
        Err(e) => match app.get_webview_window("settings") {
            Some(w) => w.set_focus(),
            None => Err(e),
        },
    }
}

/// 윈도우에서 동기 커맨드로 창을 만들면 멈출 수 있어 async
#[tauri::command]
async fn open_settings(app: AppHandle) -> Result<(), String> {
    show_settings(&app).map_err(|e| e.to_string())
}

fn show_widget(app: &AppHandle) {
    if let Some(w) = app.get_webview_window("widget") {
        let _ = w.unminimize();
        let _ = w.show();
        let _ = w.set_focus();
    }
}

fn toggle_widget(app: &AppHandle) {
    if let Some(w) = app.get_webview_window("widget") {
        if w.is_visible().unwrap_or(false) {
            let _ = w.hide();
        } else {
            show_widget(app);
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // 이미 떠 있으면 새로 띄우지 않고 기존 창을 앞으로
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| show_widget(app)))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--autostart"]),
        ))
        .manage(Mutex::new(Prefs { close_to_tray: true, width: None }))
        .setup(|app| {
            let item = |id: &str, text: &str| MenuItem::with_id(app, id, text, true, None::<&str>);
            let menu = Menu::with_items(
                app,
                &[
                    &item("toggle", "보이기/숨기기")?,
                    &item("settings", "설정")?,
                    &PredefinedMenuItem::separator(app)?,
                    &item("quit", "종료")?,
                ],
            )?;
            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("Task Widget")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, e| match e.id.as_ref() {
                    "toggle" => toggle_widget(app),
                    "settings" => {
                        let _ = show_settings(app);
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, e| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = e
                    {
                        toggle_widget(tray.app_handle());
                    }
                })
                .build(app)?;
            Ok(())
        })
        // 위젯 창 닫기(Alt+F4): 트레이 설정이면 숨기고 아니면 종료. 설정 창은 그냥 닫힌다
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                if window.label() != "widget" {
                    return;
                }
                if window.state::<Mutex<Prefs>>().lock().unwrap().close_to_tray {
                    api.prevent_close();
                    let _ = window.hide();
                } else {
                    window.app_handle().exit(0);
                }
            }
        })
        .invoke_handler(tauri::generate_handler![apply_window_prefs, open_settings])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
