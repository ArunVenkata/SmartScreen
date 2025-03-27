mod backlight;
use tauri::AppHandle;
use tauri::Manager;
use tauri::WindowEvent;
use tokio::time::{sleep, Duration};
mod types;
use backlight::{set_linux_brightness, start_brightness_scheduler};
use std::sync::Mutex;
use tauri::Emitter;
use tauri::State;
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
};
use tokio_util::sync::CancellationToken;
use types::{EventResponse, ScheduleInfo, SchedulerState, SchedulerStateInner};

#[tauri::command(async)]
fn update_schedules(
    state: State<'_, SchedulerState>,
    schedule_data: Vec<ScheduleInfo>,
    refresh_interval: u64,
    app_handle: AppHandle,
) {
    let mut s = state.0.lock().unwrap();

    s.schedules = schedule_data.clone();

    if let Some(token) = &s.token {
        token.cancel();
    }
    s.token = Some(CancellationToken::new());
    let my_token = s.token.as_ref().unwrap().clone();

    // If an existing task is running, cancel it
    if let Some(runner) = s.runner.take() {
        runner.abort();
    }

    // Spawn a new brightness scheduler using the new schedules
    let new_runner = tokio::spawn(async move {
        start_brightness_scheduler(my_token, schedule_data, refresh_interval).await;
    });
    s.runner = Some(new_runner);

    let _ = app_handle.emit("schedules_updated", ());
}

#[tauri::command(async)]
fn cancel_scheduler(state: State<'_, SchedulerState>) -> EventResponse<()> {
    let mut s = state.inner().0.lock().unwrap();

    if let Some(token) = &s.token {
        token.cancel();
        EventResponse {
            success: true,
            data: Some(()),
            message: "Cancelled".into(),
        }
    } else {
        s.schedules.clear();
        if let Some(runner) = s.runner.take() {
            runner.abort();
            EventResponse {
                success: true,
                data: Some(()),
                message: "Aborted".into(),
            }
        } else {
            EventResponse {
                success: false,
                data: None,
                message: "No scheduler to cancel".into(),
            }
        }
    }
}
#[tauri::command(async)]
fn set_brightness(percentage: u32) -> EventResponse<()> {
    match set_linux_brightness(percentage, true) {
        Ok(()) => EventResponse {
            success: true,
            data: Some(()),
            message: format!("Brightness set to {}", &percentage),
        },
        Err(_e) => EventResponse {
            success: false,
            data: Some(()),
            message: format!("Error Setting Brightness"),
        },
    }
}

#[tauri::command]
fn close_app(_app: AppHandle) {
    _app.exit(0);
}

#[tauri::command(async)]
async fn subscribe_brightness(app_handle: tauri::AppHandle) {
    tauri::async_runtime::spawn(async move {
        // loop {
        match backlight::get_linux_brightness() {
            Ok((brightness, max_brightness)) => {
                let percentage =
                    ((brightness as f64 / max_brightness as f64) * 100.0).round() as u32;
                app_handle.emit("brightness", percentage).unwrap();
            }
            Err(e) => {
                eprintln!("Error fetching brightness: {}", e);
            }
        }
        sleep(Duration::from_millis(100)).await;
        // }
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Removed unnecessary instantiation of tauri::App
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(SchedulerState(Mutex::new(SchedulerStateInner {
            schedules: Vec::new(),
            token: None,
            runner: None,
        })))
        .on_window_event(|window, event| match event {
            WindowEvent::CloseRequested { api, .. } => {
                api.prevent_close(); // prevent actual close
                window.hide().unwrap_or_default(); // just hide instead
            }
            _ => {}
        })
        .setup(|app| {
            // let quit_i = ?;

            let menu = Menu::with_items(
                app,
                &[
                    &MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?,
                    &MenuItem::with_id(app, "open", "Open", true, None::<&str>)?,
                    ],
            )?;
            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(true)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "open" => {
                        if let Some(window) = app.app_handle().get_webview_window("main") {
                            window.show().unwrap_or_default();
                            window.set_focus().unwrap_or_default();
                        }
                    }
                    _ => {
                        println!("menu item {:?} not handled", event.id);
                    }
                })
                .tooltip("SmartScreen")
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            set_brightness,
            subscribe_brightness,
            update_schedules,
            cancel_scheduler,
            close_app
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
