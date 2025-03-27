use chrono::NaiveTime;
use std::{fs, io, thread, time::Duration};
use tokio::time::interval;
use tokio_util::sync::CancellationToken;

use crate::types::ScheduleInfo;

/// Retrieves the current brightness and the maximum brightness
/// from the first valid backlight device in /sys/class/backlight/.
pub fn get_linux_brightness() -> io::Result<(u32, u32)> {
    let backlight_dir = "/sys/class/backlight/";
    for entry in fs::read_dir(backlight_dir)? {
        let entry = entry?;
        let path = entry.path();
        if path.is_dir() {
            let brightness_path = path.join("brightness");
            let max_brightness_path = path.join("max_brightness");
            if brightness_path.exists() && max_brightness_path.exists() {
                let brightness_str = fs::read_to_string(&brightness_path)?;
                let max_brightness_str = fs::read_to_string(&max_brightness_path)?;
                let brightness = brightness_str.trim().parse().unwrap_or(0);
                let max_brightness = max_brightness_str.trim().parse().unwrap_or(0);
                return Ok((brightness, max_brightness));
            }
        }
    }
    Err(io::Error::new(
        io::ErrorKind::NotFound,
        "No backlight device found",
    ))
}

/// Sets the brightness of the first valid backlight device based on a percentage.
/// A percentage of 100 will set brightness to max, whereas a lower percentage scales it down.
pub fn set_linux_brightness(percentage: u32, gradual: bool) -> io::Result<()> {
    let backlight_dir = "/sys/class/backlight/";
    for entry in fs::read_dir(backlight_dir)? {
        let entry = entry?;
        let path = entry.path();
        if path.is_dir() {
            let brightness_path = path.join("brightness");
            let max_brightness_path = path.join("max_brightness");
            if brightness_path.exists() && max_brightness_path.exists() {
                let max_brightness_str = fs::read_to_string(&max_brightness_path)?;
                let max_brightness: u32 = max_brightness_str.trim().parse().unwrap_or(0);
                if max_brightness == 0 {
                    return Err(io::Error::new(
                        io::ErrorKind::InvalidData,
                        "Invalid max brightness value",
                    ));
                }
                if !gradual {
                    let new_brightness = (max_brightness * percentage) / 100;
                    fs::write(&brightness_path, new_brightness.to_string())?;
                } else {
                    // Gradual change: get current brightness and update over 20 steps.
                    let brightness_str = fs::read_to_string(&brightness_path)?;
                    let current_brightness: u32 = brightness_str.trim().parse().unwrap_or(0);
                    let current_percent = (current_brightness * 100) / max_brightness;
                    let steps = 20;
                    let delay = Duration::from_millis(50);
                    for step in 0..=steps {
                        let t = step as f32 / steps as f32;
                        let intermediate_percent = current_percent as f32
                            + (percentage as f32 - current_percent as f32) * t;
                        let new_brightness =
                            (max_brightness as f32 * intermediate_percent / 100.0).round() as u32;
                        fs::write(&brightness_path, new_brightness.to_string())?;
                        thread::sleep(delay);
                    }
                }
                return Ok(());
            }
        }
    }
    Err(io::Error::new(
        io::ErrorKind::NotFound,
        "No valid backlight device found",
    ))
}

pub async fn start_brightness_scheduler(token: CancellationToken, schedules: Vec<ScheduleInfo>, refresh_interval: u64) {
    let mut tick = interval(Duration::from_secs(refresh_interval));
    loop {
        tokio::select! {
            _ = tick.tick() => {
                let now = chrono::Utc::now().time();
                let mut found_brightness = None;
                for s in &schedules {
                    let from_time = NaiveTime::parse_from_str(&s.from, "%Y-%m-%dT%H:%M:%S%.3fZ");
                    let to_time = NaiveTime::parse_from_str(&s.to, "%Y-%m-%dT%H:%M:%S%.3fZ");
                    // println!("FROMSTR {}, TOSTR {}",&s.from, &s.to );
                    if from_time.is_ok() && to_time.is_ok() {
                        let f = from_time.unwrap();
                        let t = to_time.unwrap();
                        // println!("Current Time {now}, From: {f}, To: {t}");
                        if in_time_range(now, f, t) {
                            found_brightness = Some(s.brightness);
                            break;
                        }
                    }
                }
                if let Some(b) = found_brightness {
                    match set_linux_brightness(b, true) {
                        Ok(_) => println!("Brightness set to {}% for current schedule.", b),
                        Err(e) => eprintln!("Could not set brightness: {}", e),
                    }
                }
            },
            _ = token.cancelled() => {
                println!("Brightness scheduling cancelled");
                break;
            }
        }
    }
}

pub fn in_time_range(now: NaiveTime, from: NaiveTime, to: NaiveTime) -> bool {
    if from <= to {
        now >= from && now < to
    } else {
        // If from > to, e.g. from 22:00 to 06:00
        now >= from || now < to
    }
}