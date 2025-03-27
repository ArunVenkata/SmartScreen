import { ApplicationConfig } from "@angular/core";
import { provideRouter } from "@angular/router";
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from "./app.routes";
import { IconDefinition } from '@ant-design/icons-angular';
import * as AllIcons from '@ant-design/icons-angular/icons';
import { NZ_ICONS } from "ng-zorro-antd/icon";
import { provideNzI18n, en_US } from 'ng-zorro-antd/i18n';


const icons: IconDefinition[] = Object.keys(AllIcons).map(key => (AllIcons as any)[key]);

export const appConfig: ApplicationConfig = {
  providers: [provideNzI18n(en_US), provideRouter(routes), provideAnimations(), { provide: NZ_ICONS, useValue: icons }],
};
