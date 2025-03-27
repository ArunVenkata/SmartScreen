import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { BaseComponent } from '../app/base-component';
import { NzTimePickerModule } from 'ng-zorro-antd/time-picker';
import { StorageKeys } from '../storage-keys';
import { StorageService } from '../services/storage.service';
import { invoke } from '@tauri-apps/api/core';
import { BrightnessSchedule, EventResponse } from '../types';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzNotificationService, NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';


@Component({
  selector: 'app-preferences',
  standalone: true,
  imports: [CommonModule, NzIconModule, FormsModule, NzCheckboxModule, NzTimePickerModule, NzButtonModule, NzGridModule, NzNotificationModule, NzInputNumberModule],
  templateUrl: './preferences.component.html',
  styleUrl: './preferences.component.css'
})
export class PreferencesComponent extends BaseComponent implements OnInit {
  changeBasedOnTimeOfDay: boolean = this.storageService.get(StorageKeys.changeBasedOnTime, false);
  scheduleEnabled: boolean = this.storageService.get(StorageKeys.scheduleEnabled, false);
  refreshInterval: number = this.storageService.get(StorageKeys.scheduleRefreshInterval, 10);
  schedules: BrightnessSchedule[] = [];

  StorageKeys = StorageKeys

  constructor(private storageService: StorageService, private nzNotificationService: NzNotificationService) {
    super();
  }



  ngOnInit(): void {

    const serializedSchedules = this.storageService.get(StorageKeys.scheduleData, [])

    this.schedules = serializedSchedules.map((schedule: BrightnessSchedule) => ({
      ...schedule,
      from: schedule.from ? new Date(schedule.from) : null,
      to: schedule.to ? new Date(schedule.to) : null
    }));
  }


  getDisabledHours(index: number, isFrom: boolean): () => number[] {
    return () => {
      const schedule = this.schedules[index];
      if (!schedule.from || !schedule.to) {
        return [];
      }

      const otherTime = isFrom ? schedule.to : schedule.from;
      if (!(otherTime instanceof Date)) {
        return [];
      }

      const disabledHours: number[] = [];
      const otherHour = otherTime.getHours();

      if (isFrom) {
        for (let hour = otherHour + 1; hour < 24; hour++) {
          disabledHours.push(hour);
        }
      } else {
        for (let hour = 0; hour < otherHour; hour++) {
          disabledHours.push(hour);
        }
      }

      return disabledHours;
    };
  }

  getDisabledMinutes(index: number, isFrom: boolean): (hour: number) => number[] {
    return (hour: number) => {
      const schedule = this.schedules[index];
      if (!schedule.from || !schedule.to) {
        return [];
      }

      const otherTime = isFrom ? schedule.to : schedule.from;
      if (!(otherTime instanceof Date)) {
        return [];
      }

      const disabledMinutes: number[] = [];
      const otherHour = otherTime.getHours();
      const otherMinute = otherTime.getMinutes();

      if ((isFrom && hour === otherHour) || (!isFrom && hour === otherHour)) {
        if (isFrom) {
          for (let minute = otherMinute; minute < 60; minute++) {
            disabledMinutes.push(minute);
          }
        } else {
          for (let minute = 0; minute <= otherMinute; minute++) {
            disabledMinutes.push(minute);
          }
        }
      }

      return disabledMinutes;
    };
  }


  addSchedule() {
    if (this.schedules.length >= 5) {
      this.nzNotificationService.warning(
        'Limit Reached',
        'You cannot add more than 5 schedules.'
      );
      return;
    }
    this.schedules.push({ from: null, to: null, brightness: 50 });
  }

  removeSchedule(index: number) {
    this.schedules.splice(index, 1);
  }


  validateTime(index: number) {
    const schedule = this.schedules[index];
    if (!schedule.from || !schedule.to) {
      return;
    }
    if (!(schedule.from instanceof Date) || !(schedule.to instanceof Date)) {
      return;
    }

    if (schedule.from.getTime() > schedule.to.getTime()) {
      const temp = schedule.from;
      schedule.from = schedule.to;
      schedule.to = temp;
      console.warn(`Swapped times for schedule at index ${index} because 'from' > 'to'.`);
    }

    for (let i = 0; i < this.schedules.length; i++) {
      if (i === index) continue;
      const other = this.schedules[i];
      if (
        other.from &&
        other.to &&
        schedule.from.getTime() < other.to.getTime() &&
        schedule.to.getTime() > other.from.getTime()
      ) {
        this.nzNotificationService.error(
          "A schedule overlaps with these timings. Please adjust the times.", ""
        );
        return;
      }
    }

    console.log(`Schedule at index ${index} is valid.`);
  }

  saveAllSettings() {
    let res = true;
    this.storageService.set(StorageKeys.changeBasedOnTime, this.changeBasedOnTimeOfDay);
    this.storageService.set(StorageKeys.scheduleEnabled, this.scheduleEnabled);
    this.storageService.set(StorageKeys.scheduleRefreshInterval, this.refreshInterval);
    if (this.scheduleEnabled) {
      res &&= this.saveSchedules();

    } else {
      invoke<EventResponse>("cancel_scheduler").then((resp: EventResponse) => {
        console.log(resp.message);
      });
    }
    if (!res) {
      return;
    }
    this.nzNotificationService.success(
      'Settings Saved',
      'All settings have been successfully saved.'
    );
  }
  saveSchedules() {
    for (let i = 0; i < this.schedules.length; i++) {
      const schedule = this.schedules[i];
      if (!schedule.from || !schedule.to || !(schedule.from instanceof Date) || !(schedule.to instanceof Date)) {
        this.nzNotificationService.error(
          'Invalid Schedule',
          `One of the schedules is incomplete. Please provide valid 'from' and 'to' times.`
        );
        return false;
      }

      if (schedule.from.getTime() >= schedule.to.getTime()) {
        this.nzNotificationService.error(
          'Invalid Schedule',
          `One of the Schedules has 'from' time greater than or equal to 'to' time. Please adjust the times.`
        );
        return false;
      }
      for (let j = 0; j < this.schedules.length; j++) {
        if (i === j) continue;
        const other = this.schedules[j];
        if (
          other.from &&
          other.to &&
          schedule.from.getTime() < other.to.getTime() &&
          schedule.to.getTime() > other.from.getTime()
        ) {
          this.nzNotificationService.error(
            "There are overlaps in schedules. Please adjust the times.", ""
          );
          return false;
        }
      }

      schedule.from.setSeconds(0, 0);
      schedule.to.setSeconds(0, 0);
    }
    this.storageService.set(StorageKeys.scheduleData, JSON.stringify(this.schedules));
    invoke('update_schedules', { scheduleData: this.schedules, refreshInterval: this.refreshInterval });
    return true;
  }
}
