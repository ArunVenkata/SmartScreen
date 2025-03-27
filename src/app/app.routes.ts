import { Routes } from "@angular/router";
import { AppComponent } from "./app.component";
import { SubappComponent } from "../subapp/subapp.component";
import { PreferencesComponent } from "../preferences/preferences.component";
import { HomeComponent } from "../home/home.component";

export const routes: Routes = [

    {
        path: "",
        component: HomeComponent
    },
    {
        path: "preferences",
        component: PreferencesComponent
    },
    {
        path: "app/:app_id",
        component: SubappComponent
    }


];
