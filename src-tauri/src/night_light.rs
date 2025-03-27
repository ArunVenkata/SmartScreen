use std::error::Error;
use std::thread;
use std::time::Duration;
use x11rb::connection::Connection;
use x11rb::protocol::randr::ConnectionExt as RandRConnectionExt;
use x11rb::rust_connection::RustConnection;
#[allow(dead_code)]
pub enum ColorTemperature {
    K2000,
    K3000,
    K4000,
    K5000,
    K6500,
}

impl ColorTemperature {
    /// Returns target multipliers for (red, green, blue).
    /// Neutral (no effect) is assumed to be (1.0, 1.0, 1.0).
    pub fn target_factors(&self) -> (f32, f32, f32) {
        match self {
            ColorTemperature::K2000 => (1.0, 0.4, 0.0),
            ColorTemperature::K3000 => (1.0, 0.6, 0.3),
            ColorTemperature::K4000 => (1.0, 0.8, 0.5),
            ColorTemperature::K5000 => (1.0, 0.9, 0.7),
            ColorTemperature::K6500 => (1.0, 1.0, 1.0), // neutral
        }
    }
}

pub fn apply_night_light(
    temp: ColorTemperature,
    intensity: u32,
    gradual: bool,
) -> Result<(), Box<dyn Error>> {
    if intensity > 100 {
        return Err("Intensity must be between 0 and 100".into());
    }
    if !gradual {
        let fraction = intensity as f32 / 100.0;
        let (r_target, g_target, b_target) = temp.target_factors();
        let (conn, screen_num) = RustConnection::connect(None)?;
        let screen = &conn.setup().roots[screen_num];
        let resources = conn.randr_get_screen_resources(screen.root)?.reply()?;
        if resources.crtcs.is_empty() {
            return Err("No CRTCs found".into());
        }
        let crtc = resources.crtcs[0];
        let gamma_reply = conn.randr_get_crtc_gamma(crtc)?.reply()?;
        let size = gamma_reply.size() as usize;
        let mut new_red = Vec::with_capacity(size);
        let mut new_green = Vec::with_capacity(size);
        let mut new_blue = Vec::with_capacity(size);
        for i in 0..size {
            let norm = i as f32 / ((size - 1) as f32);
            let baseline = norm * 65535.0;
            let red_factor = (1.0 - fraction) + fraction * r_target;
            let green_factor = (1.0 - fraction) + fraction * g_target;
            let blue_factor = (1.0 - fraction) + fraction * b_target;
            new_red.push((baseline * red_factor).round() as u16);
            new_green.push((baseline * green_factor).round() as u16);
            new_blue.push((baseline * blue_factor).round() as u16);
        }
        conn.randr_set_crtc_gamma(crtc, &new_red, &new_green, &new_blue)?
            .check()?;
        conn.flush()?;
    } else {
        let steps = 20;
        let delay = Duration::from_millis(50);
        // Assume initial intensity is 0.
        for step in 0..=steps {
            let t = step as f32 / steps as f32;
            let intermediate_intensity = (intensity as f32 * t).round() as u32;
            let fraction = intermediate_intensity as f32 / 100.0;
            let (r_target, g_target, b_target) = temp.target_factors();
            let (conn, screen_num) = RustConnection::connect(None)?;
            let screen = &conn.setup().roots[screen_num];
            let resources = conn.randr_get_screen_resources(screen.root)?.reply()?;
            if resources.crtcs.is_empty() {
                return Err("No CRTCs found".into());
            }
            let crtc = resources.crtcs[0];
            let gamma_reply = conn.randr_get_crtc_gamma(crtc)?.reply()?;
            let size = gamma_reply.size() as usize;
            let mut new_red = Vec::with_capacity(size);
            let mut new_green = Vec::with_capacity(size);
            let mut new_blue = Vec::with_capacity(size);
            for i in 0..size {
                let norm = i as f32 / ((size - 1) as f32);
                let baseline = norm * 65535.0;
                let red_factor = (1.0 - fraction) + fraction * r_target;
                let green_factor = (1.0 - fraction) + fraction * g_target;
                let blue_factor = (1.0 - fraction) + fraction * b_target;
                new_red.push((baseline * red_factor).round() as u16);
                new_green.push((baseline * green_factor).round() as u16);
                new_blue.push((baseline * blue_factor).round() as u16);
            }
            conn.randr_set_crtc_gamma(crtc, &new_red, &new_green, &new_blue)?
                .check()?;
            conn.flush()?;
            thread::sleep(delay);
        }
    }
    Ok(())
}