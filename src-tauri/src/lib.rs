use std::sync::Mutex;
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, State, WindowEvent,
};

/// 화면 설정 중 Rust 쪽에서 쓰는 것. 프론트가 시작할 때와 바뀔 때 apply_window_prefs로 넘긴다
struct Prefs {
    close_to_tray: bool,
}

/// 위치·크기는 프론트(windowPos.ts)가 맡는다
#[tauri::command]
fn apply_window_prefs(
    app: AppHandle,
    state: State<Mutex<Prefs>>,
    always_on_top: bool,
    close_to_tray: bool,
) -> Result<(), String> {
    state.lock().unwrap().close_to_tray = close_to_tray;
    let w = app.get_webview_window("widget").ok_or("widget window not found")?;
    w.set_always_on_top(always_on_top).map_err(|e| e.to_string())
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
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--autostart"]),
        ))
        .manage(Mutex::new(Prefs { close_to_tray: true }))
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
                    // 설정은 위젯 안의 화면이다: 위젯을 띄우고 설정 화면으로 바꾸게 알린다
                    "settings" => {
                        show_widget(app);
                        let _ = app.emit_to("widget", "open-settings", ());
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
        // 위젯 창 닫기(Alt+F4): 트레이 설정이면 숨기고 아니면 종료
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
        .invoke_handler(tauri::generate_handler![apply_window_prefs])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
