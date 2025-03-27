import { Component, OnInit } from '@angular/core';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSliderModule } from 'ng-zorro-antd/slider';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { CommonModule } from '@angular/common';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { BaseComponent } from '../app/base-component';
import { StorageService } from '../services/storage.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { HistoryService } from '../services/history.service';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { StorageKeys } from '../storage-keys';
import { BrightnessSchedule, EventResponse } from '../types';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, NzSliderModule, NzGridModule,
    FormsModule, NzIconModule, NzCheckboxModule, NzButtonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent extends BaseComponent implements OnInit {
  brightnessChangeEvent$ = new Subject<number>();
  currentBrightnessPercentage: number = 0;
  sliderDisabled: boolean = false;

  intervalTimer!: number;
  constructor(private nzMessageService: NzMessageService, private storageService: StorageService, private historyService: HistoryService) {
    super();
    listen<number>('brightness', (event) => {
      this.currentBrightnessPercentage = event.payload;
      console.log(`Received ${this.currentBrightnessPercentage}`);
    });
  }
  override ngOnDestroy(): void {
    super.ngOnDestroy();

    clearInterval(this.intervalTimer);
  }
  ngOnInit(): void {
    invoke("subscribe_brightness");
    this.syncWithBackend();
    this.brightnessChangeEvent$.pipe(takeUntil(this.ngUnsubscribe$)).pipe(debounceTime(1000)).subscribe((value: number) => {
      console.log("Received after 800 millis.");
      this.setBrightness(value);
    });
  }

  setBrightness(value: number) {
    console.log("SET BRIGHTNESS", value);
    invoke<EventResponse>("set_brightness", { percentage: value }).then((data: EventResponse) => {
      console.log("Brightness set", data.message);
    });
  }

  updateBrightness(value: number) {
    this.brightnessChangeEvent$.next(value);
  }

  syncWithBackend() {
    const scheduleEnabled = this.storageService.get(StorageKeys.scheduleEnabled, false);
    const serializedSchedules = this.storageService.get(StorageKeys.scheduleData, []);

    const refreshInterval = this.storageService.get(StorageKeys.scheduleRefreshInterval, 10);

    if (scheduleEnabled) {
      this.sliderDisabled = true;
      const schedules = serializedSchedules.map((schedule: BrightnessSchedule) => ({
        ...schedule,
        from: schedule.from ? new Date(schedule.from) : null,
        to: schedule.to ? new Date(schedule.to) : null
      }));
      this.intervalTimer =  setInterval(() => invoke("subscribe_brightness"), refreshInterval*1000);

      invoke<EventResponse>('update_schedules', { scheduleData: schedules, refreshInterval }).catch(err => {
        console.error('Failed to update schedules:', err);
      });
    } else {
      invoke<EventResponse>("cancel_scheduler").then((resp: EventResponse) => {
        console.log(resp.message);
      }).catch(err => {
        console.error('Failed to cancel scheduler:', err);
      });
    }
  }


}
