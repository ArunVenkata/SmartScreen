use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use tokio::task::JoinHandle;
use tokio_util::sync::CancellationToken;

#[derive(Serialize)]
pub struct EventResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub message: String,
}


#[derive(Deserialize, Clone, Debug)]
pub struct ScheduleInfo {
    pub from: String,        // e.g. "07:00"
    pub to: String,          // e.g. "09:30"
    pub brightness: u32,     // 0–100
}

pub struct SchedulerState(pub Mutex<SchedulerStateInner>);

pub struct SchedulerStateInner {
    pub schedules: Vec<ScheduleInfo>,
    pub token: Option<CancellationToken>,
    pub runner: Option<JoinHandle<()>>,
}