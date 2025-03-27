export interface EventResponse {
    success: boolean,
    message: string
}

export interface BrightnessSchedule {
    from: Date | null;
    to: Date | null;
    brightness: number;
}